import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private workers: Tesseract.Worker[] = [];
  private readonly WORKER_COUNT = 4; // Số workers song song

  async onModuleInit() {
    // Tạo worker pool để OCR song song
    console.log(`🔧 Initializing ${this.WORKER_COUNT} OCR workers...`);
    const workerPromises = Array.from({ length: this.WORKER_COUNT }, () =>
      Tesseract.createWorker('vie'),
    );
    this.workers = await Promise.all(workerPromises);
    console.log('✅ OCR workers ready!');
  }

  private getWorker(index: number): Tesseract.Worker {
    return this.workers[index % this.workers.length];
  }

  // Handle
  async load(filePath: string) {
    try {
      // Check if file is PDF
      const isPdf = filePath.toLowerCase().endsWith('.pdf');
      // --- CASE 1: Non-PDF files (images) ---
      if (!isPdf) {
        const result = await this.workers[0].recognize(filePath);
        return { text: result.data.text, confidence: result.data.confidence };
      }

      // --- CASE 2: PDF files ---
      // -- Get pageNumber --
      const pdfBuffet = fs.readFileSync(filePath);
      const pdfInfo = await pdf(pdfBuffet);
      const pageCount = pdfInfo.numpages;

      if (!pageCount || pageCount === 0) return { text: '' };

      console.log(`📄 Processing ${pageCount} pages with OCR...`);

      // Create: "uploads/temp" if not exists
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // List pages: convert(1) => page 1
      const convert = fromPath(filePath, {
        density: 130, // dpi
        saveFilename: `ocr-${Date.now()}`, // Temporary filename
        savePath: tempDir,
        format: 'png',
        width: 1000, // upscale width
        height: 1000,
      });

      console.log('🖼️  Converting PDF to images...');
      const convertPromises: Promise<any>[] = [];
      for (let page = 1; page <= pageCount; page++) {
        convertPromises.push(convert(page, { responseType: 'image' }));
      }
      const pageImages = await Promise.all(convertPromises);
      console.log('✅ PDF converted to images');

      // 5️⃣ OCR tất cả trang song song với worker pool
      console.log(`🔍 Running OCR on ${pageCount} pages...`);
      const ocrPromises = pageImages.map((img: any, index: number) => {
        const worker = this.getWorker(index); // Round-robin workers
        return worker.recognize(img.path).then((res) => ({
          text: res.data.text,
          path: img.path,
          page: index + 1,
        }));
      });

      const results = await Promise.all(ocrPromises);
      console.log('✅ OCR completed');

      // 6️⃣ Ghép text theo thứ tự trang
      const allText = results
        .sort((a, b) => a.page - b.page)
        .map((r) => r.text)
        .join('\n');

      // 7️⃣ Xoá file ảnh tạm
      results.forEach((r) => {
        try {
          if (fs.existsSync(r.path)) fs.unlinkSync(r.path);
        } catch {}
      });

      return { text: allText };
    } catch (error) {
      console.log('OCR Error: ', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    console.log('🛑 Terminating OCR workers...');
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
