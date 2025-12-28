import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import sharp from 'sharp';

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private workers: Tesseract.Worker[] = [];
  private readonly WORKER_COUNT = 8; // Số workers song song

  async onModuleInit() {
    console.log('🔧 Initializing OCR worker pool...');
    // Tạo worker pool để OCR song song
    const workerPromises = Array.from(
      { length: this.WORKER_COUNT },
      async () => {
        const worker = await Tesseract.createWorker('vie', 1, {
          logger: () => {}, // Tắt log verbose
        });

        // Cấu hình tối ưu cho tiếng Việt
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Tự động detect layout
          tessedit_char_whitelist: '', // Cho phép tất cả ký tự
          preserve_interword_spaces: '1',
          // Cải thiện nhận diện dấu tiếng Việt
          textord_heavy_nr: '1',
          // Giảm noise
          edges_use_new_outline_complexity: '1',
        });

        return worker;
      },
    );

    this.workers = await Promise.all(workerPromises);
    console.log(`✅ Initialized ${this.workers.length} OCR workers`);
  }

  private getWorker(index: number): Tesseract.Worker {
    return this.workers[index % this.workers.length];
  }

  // Handle
  async load(filePath: string) {
    try {
      const ext = filePath.toLowerCase();
      const isPdf = ext.endsWith('.pdf');

      // Supported image formats for OCR
      const isImage = /\.(jpg|jpeg|png|bmp|tiff|webp)$/i.test(ext);

      // --- CASE 1: Image files only ---
      if (isImage) {
        const result = await this.workers[0].recognize(filePath);
        return { text: result.data.text, confidence: result.data.confidence };
      }

      // --- CASE 2: Non-PDF and non-image files (e.g., .txt) ---
      if (!isPdf) {
        throw new Error(
          `Unsupported file type for OCR. Only PDF and images are supported. Got: ${path.extname(filePath)}`,
        );
      }

      // --- CASE 3: PDF files ---
      // -- Get pageNumber --
      const pdfBuffet = fs.readFileSync(filePath);
      const pdfInfo = await pdf(pdfBuffet);

      if (pdfInfo.text && pdfInfo.text.trim().length > 20) {
        // Return if PDF has embedded text
        console.log('📄 PDF has embedded text, skipping OCR.');
        return { text: pdfInfo.text };
      }

      const pageCount = pdfInfo.numpages;

      if (!pageCount || pageCount === 0) return { text: '' };

      // Create: "uploads/temp" if not exists
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // List pages: convert(1) => page 1
      console.log('📄 PDF scanned → OCR');
      const convert = fromPath(filePath, {
        density: 200, // Tăng DPI để OCR chính xác hơn (từ 200 lên 300)
        saveFilename: `ocr-${Date.now()}`, // Temporary filename
        savePath: tempDir,
        format: 'png',
        width: 1700, // Tăng kích thước để giữ chi tiết (từ 1200 lên 2400)
        height: 2400,
      });

      const convertPromises: Promise<any>[] = [];
      for (let page = 1; page <= pageCount; page++) {
        convertPromises.push(convert(page, { responseType: 'image' }));
      }
      const pageImages = await Promise.all(convertPromises);
      console.log('✅ PDF converted to images');

      // 5️⃣ OCR tất cả trang song song với worker pool
      console.log(`🔍 Running OCR on ${pageCount} pages...`);

      const ocrPromises = pageImages.map(async (img: any, index: number) => {
        const worker = this.getWorker(index);

        const prep = await this.preprocessImage(img.path);

        const res = await worker.recognize(prep);

        return {
          text: res.data.text,
          path: img.path,
          prepPath: prep, // Lưu đường dẫn file preprocessed
          page: index + 1,
        };
      });

      const results = await Promise.all(ocrPromises);
      console.log('✅ OCR completed');

      // 6️⃣ Ghép text theo thứ tự trang
      const allText = results
        .sort((a, b) => a.page - b.page)
        .map((r) => this.normalizeText(r.text))
        .join('\n');

      // 7️⃣ Xoá file ảnh tạm (cả gốc và preprocessed)
      results.forEach((r) => {
        try {
          // Xóa file gốc
          if (fs.existsSync(r.path)) {
            fs.unlinkSync(r.path);
          }
          // Xóa file preprocessed
          if (r.prepPath && fs.existsSync(r.prepPath)) {
            fs.unlinkSync(r.prepPath);
          }
        } catch (error) {
          console.warn(`⚠️ Cannot delete temp file: ${r.path}`, error.message);
        }
      });

      return { text: allText };
    } catch (error) {
      console.log('OCR Error: ', error);
      throw error;
    }
  }

  // Normalize text: nối từ ngắt dòng, gộp khoảng trắng, sửa lỗi OCR phổ biến tiếng Việt
  private normalizeText(text: string): string {
    const normalized = text
      // Nối từ bị ngắt dòng
      .replace(/-\s*\n\s*/g, '')
      // Giữ nguyên xuống dòng đơn, chỉ gộp xuống dòng nhiều
      .replace(/\n{3,}/g, '\n\n')
      // Chuẩn hóa space (không gộp xuống dòng)
      .replace(/[ \t]+/g, ' ')
      // Remove brand watermarks
      .replace(/Scanned with[\s\S]*$/gi, '')
      // Sửa lỗi OCR phổ biến tiếng Việt
      .replace(/\bl\b/g, 'I') // l đơn -> I
      .replace(/ĐẠl/g, 'ĐẠI')
      .replace(/HỘl/g, 'HỘI')
      .replace(/TRUẬT/g, 'THUẬT')
      .replace(/lẼN/g, 'MIỄN')
      // Loại bỏ ký tự lỗi OCR phổ biến
      .replace(/[¬]/g, '-')
      .replace(/[‹›«»]/g, '"')
      // Loại bỏ các ký tự lạ không phải chữ cái, số, dấu câu thông thường
      .replace(
        /[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ.,;:!?()\-"/\n]/g,
        ' ',
      )
      // Gộp space thừa sau khi xử lý
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Đếm diacritics để debug
    const diacriticCount = (
      normalized.match(
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi,
      ) || []
    ).length;
    if (diacriticCount > 0) {
      console.log(`Detected ${diacriticCount} diacritics`);
    }

    return normalized;
  }

  private async preprocessImage(imgPath: string): Promise<string> {
    const outPath = imgPath.replace('.png', '-prep.png');

    const img = sharp(imgPath);
    const meta = await img.metadata();

    const topCut = Math.floor(meta.height! * 0.03); // 1000px => cut 30px
    const bottomCut = Math.floor(meta.height! * 0.03);

    // Chỉ cắt trái/phải nếu ảnh quá rộng (scan lệch)
    // aspect ratio: width / height
    // < 1 là ảnh dọc, 0.75 là tỉ lệ phổ biến của trang A4
    const sideCut =
      meta.width! / meta.height! > 0.75 ? Math.floor(meta.width! * 0.012) : 0;

    await img
      .extract({
        left: sideCut,
        top: topCut,
        width: meta.width! - sideCut * 2, // cut left/right
        height: meta.height! - topCut - bottomCut, // cut top/bottom
      })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 0.5 })
      // .threshold(115)
      .median(1)
      .toFile(outPath);

    return outPath;
  }

  async onModuleDestroy() {
    console.log('🛑 Terminating OCR workers...');
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
