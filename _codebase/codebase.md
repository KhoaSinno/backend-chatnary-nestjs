# Project Export

## Project Statistics

- Total files: 33

## Folder Structure

```
src
  retrieval
    retrieval.module.ts
    retrieval.service.ts
  ingest
    ingest.module.ts
    ingest.service.ts
    loaders
      ocr.loader.ts
      pdf.loader.ts
    splitters
      text-splitter.ts
    vector
      pgvector.client.ts
      vector.service.ts
  document
    document.controller.ts
    document.module.ts
    document.service.ts
    dto
      add-doc2pj.dto.ts
      create-document.dto.ts
      update-document.dto.ts
      upload-document.dto.ts
    entities
      document.entity.ts
    oss.ts
  chat
    chat.controller.ts
    chat.module.ts
    chat.service.ts
    dto
      chat.dto.ts
      update-chat.dto.ts
  user
    dto
      create-user.dto.ts
      update-user.dto.ts
    entities
      user.entity.ts
    user.controller.ts
    user.module.ts
    user.service.ts
  main.ts
  app.module.ts
  config
    env.config.ts
    pg.config.ts

```

### src\retrieval\retrieval.module.ts

```ts
import { Logger, Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { IngestModule } from '../ingest/ingest.module';

@Module({
  imports: [IngestModule],
  providers: [RetrievalService, Logger],
  exports: [RetrievalService],
})
export class RetrievalModule {}

```

### src\retrieval\retrieval.service.ts

```ts
import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';

type MetadataDoc = {
  fileId?: string;
  projectId?: string;
  userId?: string;
  fileUrl?: string;

  endOffset?: number;
  startOffset?: number;
  chunkIndex?: number;
  page?: number;
  title?: string;
  originalFileName?: string;
};

export interface ScoredDocument {
  pageContent: string;
  metadata: MetadataDoc;
  vectorScore: number;
  keywordScore?: number;
  finalScore?: number;
}

@Injectable()
export class RetrievalService {
  // Lấy nhiều hơn để lọc kỹ hơn (Wide Net)
  private readonly RETRIEVE_K = 100;
  // Chỉ lấy top kết quả chất lượng nhất gửi cho LLM
  private readonly FINAL_K = 8;

  // Trọng số cho Hybrid search (Fire tune base on real data)
  private readonly WEIGHT_VECTOR = 0.3;
  private readonly WEIGHT_KEYWORD = 0.7;

  constructor(
    private vectorService: VectorService,
    private logger: Logger,
  ) {}

  /**
   * Pipeline tìm kiếm chuyên nghiệp:
   * 1. Retrieve (Vector Search)
   * 2. Rerank (Keyword Boosting / Cross-Encoder)
   * 3. Cutoff (Cut Top K)
   */
  async retrieveAndRerank(query: string, userId: string, projectId?: string) {
    // BƯỚC 1: RETRIEVAL - Lấy tập ứng viên rộng
    const rawDocs = await this.vectorService.getRetrievalsWithScore(
      query,
      this.RETRIEVE_K,
      userId,
      projectId,
    );

    if (!rawDocs.length) return [];

    // Chuẩn hóa documents sang format dễ xử lý
    let candidates: ScoredDocument[] = rawDocs.map(([doc, score]) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      vectorScore: score, // Giả sử score càng cao càng tốt (Cosine Similarity)
    }));

    // BƯỚC 2: RERANKING - Tính điểm từ khóa (Keyword Boosting)
    // Đây là Core quality để tìm chính xác thông tin hỗn tạp
    candidates = this.performKeywordReranking(query, candidates);

    // BƯỚC 3: SORTING & SELECTION
    // Sắp xếp theo điểm số cuối cùng (Final Score)
    candidates.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    // Log để debug chất lượng tìm kiếm
    this.logSearchQuality(query, candidates);

    // Trả về top kết quả tốt nhất
    return candidates.slice(0, this.FINAL_K);
  }

  /**
   * THUẬT TOÁN RERANK MỚI CHO TIẾNG VIỆT
   * Ưu tiên: Cụm từ chính xác (Bigram/Phrase) > Từ đơn (Unigram)
   */
  private performKeywordReranking(
    query: string,
    docs: ScoredDocument[],
  ): ScoredDocument[] {
    const queryLower = query.toLowerCase().trim();

    // 1. Tách từ đơn (Unigrams) - KHÔNG lọc độ dài nữa
    const unigrams = queryLower.split(/\s+/);

    // 2. Tạo cụm từ (Bigrams) để bắt ngữ cảnh.
    // Ví dụ: "miễn giảm học phí" -> ["miễn giảm", "giảm học", "học phí"]
    const bigrams: string[] = [];
    for (let i = 0; i < unigrams.length - 1; i++) {
      bigrams.push(`${unigrams[i]} ${unigrams[i + 1]}`);
    }

    return docs.map((doc) => {
      const contentLower = doc.pageContent.toLowerCase();
      let score = 0;

      // -- A. Điểm cho cụm từ (Quan trọng nhất - Trọng số cao) --
      // Nếu tìm thấy "miễn giảm" hoặc "học phí", cộng điểm rất lớn
      bigrams.forEach((gram) => {
        if (contentLower.includes(gram)) {
          score += 0.5; // Mỗi bigram khớp cộng 0.5 điểm
        }
      });

      // -- B. Điểm cho từ đơn (Bổ trợ) --
      unigrams.forEach((term) => {
        if (contentLower.includes(term)) {
          score += 0.1; // Mỗi từ đơn khớp cộng 0.1 điểm
        }
      });

      // -- C. Boost đặc biệt nếu khớp nguyên câu query (Hiếm nhưng chất) --
      if (contentLower.includes(queryLower)) {
        score += 2.0;
      }

      // Normalization: Kéo điểm về khoảng [0, 1] để không lấn át Vector quá đà
      // (Dùng hàm sigmoid hoặc min/max đơn giản)
      const normalizedKeywordScore = Math.min(score, 2.0) / 2.0; // Max là 1.0

      doc.keywordScore = normalizedKeywordScore;

      // Công thức tính Final Score
      doc.finalScore =
        doc.vectorScore * this.WEIGHT_VECTOR +
        normalizedKeywordScore * this.WEIGHT_KEYWORD;

      return doc;
    });
  }

  /**
   * Thuật toán tính điểm Keyword đơn giản nhưng hiệu quả (BM25 Simplified)
   * Tăng điểm cho các document chứa chính xác từ khóa trong query
   */
  // private performKeywordReranking(
  //   query: string,
  //   docs: ScoredDocument[],
  // ): ScoredDocument[] {
  //   // Tách query thành các token (từ đơn), loại bỏ từ quá ngắn
  //   const queryTerms = query
  //     .toLowerCase()
  //     .split(/\s+/)
  //     .filter((w) => w.length > 2); // TODO: User chat: "IT là gì, AI là gì?, IC là gì? " -> loại bỏ luôn key thì toang

  //   if (queryTerms.length === 0) return docs;

  //   return docs.map((doc) => {
  //     const contentLower = doc.pageContent.toLowerCase();
  //     let keywordMatches = 0;

  //     // Đếm số lượng từ khóa xuất hiện trong đoạn văn
  //     queryTerms.forEach((term) => {
  //       // Sử dụng regex để tìm từ chính xác (word boundary) tránh match nhầm
  //       // Ví dụ: tìm "tài" không nên match "tài liệu"
  //       const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'g');
  //       const matches = contentLower.match(regex);
  //       if (matches) {
  //         keywordMatches += matches.length;
  //       }
  //       // Fallback: nếu không tìm thấy chính xác, tìm chuỗi con (cho tiếng Việt)
  //       else if (contentLower.includes(term)) {
  //         keywordMatches += 0.5;
  //       }
  //     });

  //     // Tính điểm keyword (Normalization đơn giản)
  //     // Giới hạn điểm keyword boost tối đa là 1.0 để không lấn át hoàn toàn Vector
  //     const keywordScore = Math.min(keywordMatches * 0.1, 1.0);

  //     // CÔNG THỨC HYBRID SCORE
  //     // Kết hợp sức mạnh của Vector (hiểu ngữ nghĩa) và Keyword (độ chính xác)
  //     doc.keywordScore = keywordScore;
  //     doc.finalScore =
  //       doc.vectorScore * this.WEIGHT_VECTOR +
  //       keywordScore * this.WEIGHT_KEYWORD;

  //     return doc;
  //   });
  // }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private logSearchQuality(query: string, sortedDocs: ScoredDocument[]) {
    const topDoc = sortedDocs[0];
    this.logger.debug({
      msg: 'Rerank Results',
      query,
      topResult: {
        preview: topDoc?.pageContent.substring(0, 50),
        vScore: topDoc?.vectorScore.toFixed(3),
        kScore: topDoc?.keywordScore?.toFixed(3),
        final: topDoc?.finalScore?.toFixed(3),
      },
    });
  }
}

```

### src\ingest\ingest.module.ts

```ts
import { ConsoleLogger, Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { PdfService } from './loaders/pdf.loader';
import { OcrService } from './loaders/ocr.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { VectorService } from './vector/vector.service';
import { PgvectorService } from './vector/pgvector.client';
import { OpenaiService } from '../llm/openai/openai.service';

@Module({
  providers: [
    IngestService,
    PdfService,
    OcrService,
    TextSplitterService,
    VectorService,
    PgvectorService,
    OpenaiService,
    ConsoleLogger,
  ],
  exports: [IngestService, VectorService],
})
export class IngestModule {}

```

### src\ingest\ingest.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { VectorService } from './vector/vector.service';
import { PdfService } from './loaders/pdf.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { OcrService } from './loaders/ocr.loader';
// import * as fs from 'fs';

@Injectable()
export class IngestService {
  constructor(
    private pdfService: PdfService,
    private ocrService: OcrService,
    private textSplitterService: TextSplitterService,
    private vectorService: VectorService,
  ) {}
  /* 
    1. Load document (Text/PDF/Image)
    2. Split text into chunks
    3. Create embeddings => Store embeddings in vector database
    */
  async ingestDocument(
    filePath: string,
    fileId: string,
    userId: string,
    projectId?: string,
    originalFileName?: string,
  ) {
    const pdfPages = await this.pdfService.load(filePath);

    // OCR handle
    let pagesToSplit = pdfPages;
    if (
      !pdfPages ||
      pdfPages.length === 0 ||
      pdfPages.every((p) => p.text.trim().length < 5)
    ) {
      console.log('📄 PDF scanned → OCR');
      const ocrResult = await this.ocrService.load(filePath);
      pagesToSplit = [{ page: 1, text: ocrResult.text }];
    }

    // 2. Split text into chunks
    const chunks = this.textSplitterService.splitPdfPages(pagesToSplit);

    const metadata = {
      fileId,
      projectId,
      userId,
      fileUrl: filePath,
      originalFileName,
    };

    console.log(
      '💾 Saving to vector store with metadata:',
      JSON.stringify(metadata),
    );
    console.log('📦 Total chunks:', chunks.length);

    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata,
    });

    // Return number of chunks processed
    return chunks.length;
  }
}

```

### src\ingest\loaders\ocr.loader.ts

```ts
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

```

### src\ingest\loaders\pdf.loader.ts

```ts
import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

// Type definitions for pdf.js objects
interface TextItem {
  str: string;
  transform: number[];
}

interface TextContent {
  items: TextItem[];
}

interface PageData {
  pageNumber: number;
  getTextContent(options?: {
    normalizeWhitespace?: boolean;
    disableCombineTextItems?: boolean;
  }): Promise<TextContent>;
}

@Injectable()
export class PdfService {
  private pageTexts: Map<number, string> = new Map();

  async load(filePath: string): Promise<{ page: number; text: string }[]> {
    // Reset page texts for new document
    this.pageTexts.clear();

    // Read PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF with pdf-parse
    await pdfParse(dataBuffer, {
      pagerender: (pageData: PageData) => this.renderPage(pageData),
    });

    // Convert Map to array sorted by page number
    const result = Array.from(this.pageTexts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNum, text]) => ({
        page: pageNum,
        text: text,
      }));

    return result;
  }

  private async renderPage(pageData: PageData): Promise<string> {
    const render_options = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };

    const textContent = await pageData.getTextContent(render_options);
    const strings = textContent.items.map((item) => item.str);
    const pageText = strings.join(' ') + '\n';

    // Store text by page number
    this.pageTexts.set(pageData.pageNumber, pageText);

    return pageText;
  }
}

```

### src\ingest\splitters\text-splitter.ts

```ts
import { Injectable } from '@nestjs/common';
import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constant/index.constant.js';

export type ChunkResult = {
  text: string;
  page: number;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
};

@Injectable()
export class TextSplitterService {
  // Thứ tự ưu tiên: Ngắt đoạn đôi -> Đoạn đơn -> Câu -> Mệnh đề -> Từ
  private readonly SEPARATORS = [
    '\n\n',
    '\n',
    '. ',
    '? ',
    '! ',
    '; ',
    ': ', // Thêm dấu hai chấm
    ', ',
    ' ',
    '', // Fallback cuối cùng: cắt từng ký tự nếu không tìm thấy gì
  ];

  splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    let globalOffset = 0;
    let chunkIndex = 0;

    for (const p of pages) {
      const pageText = p.text;

      // Xử lý trang rỗng
      if (!pageText || pageText.length === 0) {
        continue; // Offset không đổi vì độ dài = 0
      }

      let localStart = 0;

      while (localStart < pageText.length) {
        // 1. Xác định điểm cắt lý tưởng (Hard Limit)
        let localEnd = Math.min(localStart + CHUNK_SIZE, pageText.length);

        // 2. Tìm điểm cắt ngữ nghĩa (Semantic Boundary)
        // Chỉ tìm nếu chưa hết văn bản
        if (localEnd < pageText.length) {
          const semanticEnd = this.findNearestSeparator(
            pageText,
            localStart,
            localEnd,
          );
          if (semanticEnd !== -1) {
            localEnd = semanticEnd;
          }
        }

        // 3. Lấy raw text
        const rawChunkText = pageText.slice(localStart, localEnd);

        // 4. XỬ LÝ TRIM VÀ OFFSET CHÍNH XÁC (QUAN TRỌNG)
        // Ta cần tìm vị trí thực của chữ cái đầu tiên và cuối cùng trong rawChunkText
        // để offset trả về KHÔNG bao gồm khoảng trắng thừa ở đầu/cuối.
        if (rawChunkText.trim().length > 0) {
          // Tính toán offset nội bộ để trim
          const startTrimDelta =
            rawChunkText.length - rawChunkText.trimStart().length;
          const endTrimDelta =
            rawChunkText.length - rawChunkText.trimEnd().length;

          const realStartOffset = globalOffset + localStart + startTrimDelta;
          const realEndOffset = globalOffset + localEnd - endTrimDelta;

          chunks.push({
            text: rawChunkText.trim(),
            page: p.page,
            chunkIndex: chunkIndex,
            startOffset: realStartOffset,
            endOffset: realEndOffset,
          });
          chunkIndex++;
        }

        // 5. Chuẩn bị cho vòng lặp sau (Overlap)
        if (localEnd >= pageText.length) {
          break;
        }

        // Tính overlap
        const idealNextStart = Math.max(localStart, localEnd - CHUNK_OVERLAP);

        // Tìm điểm bắt đầu "đẹp" cho chunk sau (tránh cắt giữa từ)
        localStart = this.findSmartNextStart(
          pageText,
          idealNextStart,
          localEnd,
        );
      }

      globalOffset += pageText.length;
    }

    return chunks;
  }

  /**
   * TỐI ƯU HIỆU NĂNG:
   * Không dùng slice() để tạo chuỗi con mới. Dùng lastIndexOf với tham số position.
   */
  private findNearestSeparator(
    text: string,
    start: number,
    limit: number,
  ): number {
    // Chỉ tìm ngược lại trong khoảng 40% cuối của chunk
    // Để đảm bảo chunk không bị quá ngắn (ví dụ chunk 1000 mà cắt ở ký tự thứ 10)
    const minSearchIndex = Math.max(
      start,
      limit - Math.floor(CHUNK_SIZE * 0.4),
    );

    for (const sep of this.SEPARATORS) {
      if (sep === '') return limit; // Fallback hard cut

      // Tìm separator cuối cùng xuất hiện TRƯỚC limit
      const lastIndex = text.lastIndexOf(sep, limit);

      // Quan trọng: lastIndex phải >= minSearchIndex để đảm bảo chunk đủ dài
      if (lastIndex !== -1 && lastIndex >= minSearchIndex) {
        // Cắt SAU separator (ví dụ sau dấu chấm)
        return lastIndex + sep.length;
      }
    }

    return -1; // Fallback
  }

  private findSmartNextStart(
    text: string,
    idealStart: number,
    previousEnd: number,
  ): number {
    if (idealStart <= 0) return 0;
    if (idealStart >= text.length) return text.length;

    // Nếu ngay tại idealStart đã là ký tự bắt đầu từ mới (trước đó là space) -> Tốt
    if (text[idealStart - 1] === ' ' || text[idealStart - 1] === '\n') {
      return idealStart;
    }

    // Nếu không, lùi lại tìm khoảng trắng gần nhất
    // Giới hạn lùi tối đa 50 ký tự để tránh chunk sau bị overlap quá nhiều (thừa thãi)
    const searchLimit = Math.max(0, idealStart - 50);

    // Tìm space hoặc newline gần nhất phía trước
    const lastSpace = text.lastIndexOf(' ', idealStart);
    const lastNewline = text.lastIndexOf('\n', idealStart);

    const bestStart = Math.max(lastSpace, lastNewline);

    if (bestStart !== -1 && bestStart >= searchLimit) {
      return bestStart + 1; // Bắt đầu sau dấu cách
    }

    // Nếu từ quá dài (dài hơn 50 ký tự không có dấu cách), đành cắt giữa từ
    return idealStart;
  }

  splitText(text: string): ChunkResult[] {
    const pages = [{ page: 1, text }];
    return this.splitPdfPages(pages);
  }
}

```

### src\ingest\vector\pgvector.client.ts

```ts
import {
  ConsoleLogger,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { getPgConfig } from '../../config/pg.config';
import { Pool, PoolClient } from 'pg';
@Injectable()
export class PgvectorService implements OnModuleInit, OnModuleDestroy {
  private vectorStore: PGVectorStore | null = null;
  private pool: Pool | null = null;

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: ConsoleLogger,
  ) {}

  // Tự động chạy khi module khởi tạo
  async onModuleInit() {
    await this.initVectorStore();
    // Khuyến nghị: Chỉ chạy dòng này 1 lần khi deploy hoặc migration,
    // nhưng để ở đây cũng được nếu bảng chưa có index nó sẽ tạo.
    // Nếu index đã tồn tại, nó có thể báo lỗi, ta nên dùng try/catch
    try {
      await this.ensureHnswIndex();
    } catch (e) {
      this.logger.error(
        '⚠️ Warning: HNSW Index check failed (non-fatal)',
        e.message,
      );
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async initVectorStore() {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    // Use universal pgConfig - works with any PostgreSQL provider
    // IMPORTANT: Call getPgConfig() at runtime to ensure env vars are loaded
    const config = getPgConfig();

    // Initialize PG connection pool
    this.pool = new Pool(config.postgresConnectionOptions);

    // 2. BẮT BUỘC: Lắng nghe sự kiện error trên pool
    // Nếu không có dòng này, khi Neon ngắt kết nối, App sẽ Crash ngay lập tức
    this.pool.on('error', (err) => {
      this.logger.error('❌ PG Pool Error (Idle client):', err.message);
      // Không throw error, chỉ log để app tiếp tục chạy và tự reconnect
    });

    this.pool.on('connect', (client: PoolClient) => {
      client.on('error', (err) => {
        this.logger.error('❌ PG Client Error:', err.message);
      });
    });

    // Pass the pool to vector store config
    this.vectorStore = await PGVectorStore.initialize(
      this.openaiService.getEmbeddings(),
      { ...config, pool: this.pool },
    );

    this.logger.log('✅ Connected to PGVector successfully!');
    return this.vectorStore;
  }

  // ---  INDEX HNSW ---
  async ensureHnswIndex() {
    if (!this.vectorStore) await this.initVectorStore();

    this.logger.log('🏗️ Checking/Creating HNSW Index...');

    try {
      // Các thông số này tối ưu cho OpenAI (1536 dimensions)
      await this.vectorStore?.createHnswIndex({
        dimensions: 1536,
        m: 16, // Số kết nối mỗi node (Default: 16)
        efConstruction: 64, // Độ sâu tìm kiếm khi xây dựng index (Default: 64)
      });
      this.logger.log('✅ HNSW Index created successfully');
    } catch (error) {
      // PGVector thường throw lỗi nếu Index đã tồn tại.
      // Ta catch lỗi này để không làm crash app.
      if (error.message && error.message.includes('already exists')) {
        this.logger.log('ℹ️ HNSW Index already exists. Skipping creation.');
      } else {
        this.logger.error('❌ Error creating HNSW index:', error);
      }
    }
  }
}

```

### src\ingest\vector\vector.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { PgvectorService } from './pgvector.client';
import { ChunkResult } from '../splitters/text-splitter';

type Metadata = {
  fileId: string;
  projectId?: string;
  userId: string;
  fileUrl: string;
};
@Injectable()
export class VectorService {
  constructor(private readonly pgvectorService: PgvectorService) {}

  // -- ADD DOCUMENTS TO VECTOR STORE --
  async addDocuments({
    chunks,
    metadata,
  }: {
    chunks: ChunkResult[];
    metadata: Metadata;
  }) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    return vectorStore.addDocuments(
      chunks.map((chunk) => ({
        pageContent: chunk.text,
        metadata: {
          ...metadata,
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
        },
      })),
    );
  }

  // -- RETRIEVE SIMILAR DOCUMENTS --
  async getRetrievalsWithK(
    query: string,
    k: number,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearch(query, k, filter);
    return results;
  }

  // -- RETRIEVE SIMILAR WITH SCORE --
  async getRetrievalsWithScore(
    query: string,
    k = 30,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearchWithScore(
      query,
      k,
      filter,
    );

    //  for (const [doc, score] of similaritySearchWithScoreResults) {
    //   console.log(`* [SIM=${score.toFixed(3)}] ${doc.pageContent} [${JSON.stringify(doc.metadata)}]`);
    // }

    return results;
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}

```

### src\document\document.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Logger,
  Headers,
  Req,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './oss';
import path from 'path';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';
import { ParseJsonPipe } from '../common/pipes/parse-json.pipe';
import { UploadMetadataDto } from './dto/upload-document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // -- UPLOAD FILES --
  @Post('upload/files')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      dest: 'uploads/documents',
      storage: storage,
      limits: { fileSize: 2000 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const extName = path.extname(file.originalname).toLowerCase();
        const allowedExts = [
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          '.txt',
        ];
        if (!allowedExts.includes(extName)) {
          return cb(
            new BadRequestException('Only document files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFiles(
    @Req() req: { user: JwtPayloadWithRt },
    @UploadedFiles() files: Express.Multer.File[],
    // @Body('projectId') projectId?: string,
    @Body('data', ParseJsonPipe) metadata?: UploadMetadataDto,
  ) {
    Logger.log('Uploaded files:', files);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    console.log('Metadata:', metadata);
    // Lúc này 'metadata' đã là Object xịn, có type đầy đủ, không cần parse thủ công
    console.log(metadata?.authors); // ['Nguyen Van A', 'Tran Van B']
    console.log(metadata?.publishedYear); // 2024 (Number)

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    await this.documentService.uploadFiles(
      req.user.userId,
      files,
      metadata?.projectId as string,
      metadata,
    );
    return files.map((file) => ({
      url: `/uploads/documents/${file.filename}`,
    }));
  }

  // -- REMOVE --
  @Delete(':fileId')
  removeDocument(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('fileId') fileId: string,
  ) {
    return this.documentService.removeDocument(fileId, req.user.userId);
  }

  // -- GET ALL DOCUMENTS --
  @Get()
  getAllDocuments(@Req() req: { user: JwtPayloadWithRt }) {
    return this.documentService.getAllDocuments(req.user.userId);
  }

  // -- GET DOCUMENT DETAIL BY USER --
  @Get(':id')
  getDocumentDetail(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
  ) {
    return this.documentService.getDocumentDetail(req.user.userId, id);
  }

  //  -- UPDATE DOCUMENT --
  @Patch(':id')
  updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.updateDocument(id, updateDocumentDto);
  }
}

```

### src\document\document.module.ts

```ts
import { ConsoleLogger, Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { IngestModule } from '../ingest/ingest.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [IngestModule],
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService, ConsoleLogger],
  exports: [DocumentService],
})
export class DocumentModule {}

```

### src\document\document.service.ts

```ts
import { ConsoleLogger, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { documents, DocumentStatus } from '@prisma/client';
import { AccessLevelDoc } from '../constant/index.constant';
import { UploadMetadataDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    private readonly ingestService: IngestService,
    private vectorService: VectorService,
    private prisma: PrismaService,
    private readonly logger: ConsoleLogger,
  ) {}

  //-- UPLOAD --
  async uploadFiles(
    userId: string,
    files: Express.Multer.File[],
    projectId?: string,
    metadata?: UploadMetadataDto,
  ): Promise<void> {
    for (const file of files) {
      let document: documents | null = null;
      try {
        // Pre create document record with 'processing' status
        document = await this.createDocument({
          projectId: projectId,
          originalName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: DocumentStatus.PROCESSING,
          userId: userId,
          accessLevel: metadata?.accessLevel || AccessLevelDoc.PRIVATE,
          viewCount: 0, // TODO: default 0
          pageCount: 0, // TODO: get real page count after OCR
          authors: metadata?.authors || [],
          description: metadata?.description || '',
          publishedYear: metadata?.publishedYear || undefined,
          subjects: metadata?.subjects || [],
          tags: metadata?.tags || [],
          title: metadata?.title || path.parse(file.originalname).name,
          documentType: 'unknown',
        });

        const chunksCount = await this.ingestService.ingestDocument(
          file.path,
          document.id,
          userId,
          projectId,
          file.originalname,
        );

        this.logger.log(
          `✅ Ingested ${chunksCount} chunks for: ${file.originalname}`,
        );

        // If ingestion successful (has chunks), save document record in DB
        if (chunksCount > 0) {
          // update 'done' status
          await this.updateDocumentStatus(document.id, DocumentStatus.DONE);

          this.logger.log(
            `📝 Document record created for: ${file.originalname}`,
          );
        } else {
          this.logger.warn(`⚠️ No chunks created for: ${file.originalname}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to ingest ${file.originalname}:`, error);
        // Optionally update 'error' status
        if (document) {
          await this.updateDocumentStatus(document.id, DocumentStatus.ERROR);
        }
      }
    }
  }

  // -- REMOVE --
  async removeDocument(fileId: string, userId: string) {
    //  1. Check doc exists & Ownership
    const document = await this.prisma.documents.findUnique({
      where: { id: fileId },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (document.userId !== userId)
      throw new NotFoundException('Document not found');

    // 2. Remove vectors
    await this.vectorService.removeVectorByFileId(fileId);

    // 3. Delete physical file
    try {
      const absolutePath = path.resolve(process.cwd(), document.filePath);
      deleteFile(absolutePath);
    } catch (error) {
      console.error('⚠️ File delete error:', error);
      throw new NotFoundException('Delete file uploads error');
    }

    // 4. Delete Record => Cascade delete `project_resources`
    return await this.prisma.documents.delete({
      where: { id: fileId },
    });
  }

  // -- UNLINK DOCUMENT FROM PROJECT --
  async unlinkDocumentFromProject(docId: string, projId: string) {
    return await this.prisma.project_resources.deleteMany({
      where: {
        projectId: projId,
        documentId: docId,
      },
    });
  }

  // -- CREATE DOCUMENT MAPPING --
  async createDocument(documentDto: CreateDocumentDto) {
    // Validate project exists if projectId provided

    const document = await this.prisma.documents.create({
      data: {
        userId: documentDto.userId,
        title: documentDto.title,
        description: documentDto.description,
        authors: documentDto.authors,
        subjects: documentDto.subjects,
        tags: documentDto.tags,
        documentType: documentDto.documentType,
        publishedYear: documentDto.publishedYear,
        accessLevel: documentDto.accessLevel,

        originalName: documentDto.originalName,
        filePath: documentDto.filePath,
        mimeType: documentDto.mimeType,
        size: documentDto.size as number,
        pageCount: documentDto.pageCount,

        status: documentDto.status,
        viewCount: documentDto.viewCount,
      },
    });

    if (documentDto.projectId) {
      await this.prisma.project_resources.create({
        data: {
          projectId: documentDto.projectId,
          documentId: document.id,
          isSelected: true,
        },
      });
    }
    return document;
  }

  /**
    1. Check Project exists AND belongs to User
    2. Validate Documents (Security Check)
    3. Prepare data for bulk insert
    4. Create links
   */
  async addDocumentsToProject(
    userId: string,
    projectId: string,
    documentIds: string[],
  ) {
    // 1. Check Project exists AND belongs to User
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have permission to access it',
      );
    }

    // 2. Validate Documents (Security Check)
    const validDocuments = await this.prisma.documents.findMany({
      where: {
        id: { in: documentIds },
        OR: [
          { userId: userId }, // Của mình
          { accessLevel: AccessLevelDoc.PUBLIC }, // Hoặc thư viện công cộng
        ],
      },
      select: { id: true }, // Chỉ select ID cho nhẹ query
    });

    const validDocIds = validDocuments.map((doc) => doc.id);

    if (validDocIds.length === 0) {
      throw new NotFoundException(
        'No valid documents found to add (Check ownership or ID)',
      );
    }

    // 3. Prepare data for bulk insert
    const dataToInput = validDocIds.map((docId) => ({
      projectId: projectId,
      documentId: docId,
      isSelected: true,
    }));

    // 4. Create links
    return await this.prisma.project_resources.createMany({
      data: dataToInput,
      skipDuplicates: true,
    });
  }

  // -- Unlink ALL DOCUMENTS IN PROJECT --
  async unlinkAllDocumentsInProject(projectId: string) {
    return await this.prisma.project_resources.deleteMany({
      where: {
        projectId: projectId,
      },
    });
  }

  // -- GET DOCUMENT IN PROJECT --
  async getDocumentsInProject(userId: string, projectId: string) {
    // Check exist project

    const docsRaw = await this.prisma.project_resources.findMany({
      where: { projectId: projectId, document: { userId: userId } },
      include: {
        document: {
          omit: { userId: true, indexedAt: true },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    console.log(docsRaw);
    // return docsRaw;
    return docsRaw.map((item) => {
      return {
        // 1. Các trường từ bảng trung gian (project_resources)
        addedAt: item.addedAt,
        isSelected: item.isSelected,
        linkId: item.id, //  sau này dùng chức năng "Unlink"

        // 2. Spread trực tiếp các trường của document ra ngoài
        ...item.document,
      };
    });
  }

  // -- GET DOCUMENT NOT IN PROJECT --
  async getDocumentsNotInProject(userId: string, projectId: string) {
    return await this.prisma.documents.findMany({
      where: {
        OR: [{ userId: userId }, { accessLevel: AccessLevelDoc.PUBLIC }],
        NOT: {
          linkedProjects: {
            some: { projectId: projectId },
          },
        },
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        createdAt: true,
        mimeType: true,
      },
      orderBy: {
        createdAt: 'desc', // Mới nhất lên đầu
      },
    });
  }

  // -- GET ALL DOCUMENTS --
  async getAllDocuments(userId: string) {
    return await this.prisma.documents.findMany({
      where: {
        userId: userId,
      },
      include: {
        linkedProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  // -- GET DOCUMENT DETAIL --
  async getDocumentDetail(userId: string, id: string) {
    return await this.prisma.documents.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        linkedProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  // -- UPDATE DOCUMENT --
  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto) {
    return await this.prisma.documents.update({
      where: { id: id },
      data: {
        title: updateDocumentDto.title,
      },
    });
  }
  // -- UPDATE DOCUMENT STATUS --
  async updateDocumentStatus(id: string, status: DocumentStatus) {
    // Validate status
    if (!Object.values(DocumentStatus).includes(status)) {
      throw new Error('Invalid status value');
    }

    return await this.prisma.documents.update({
      where: { id: id },
      data: {
        status: status,
      },
    });
  }
}

```

### src\document\dto\add-doc2pj.dto.ts

```ts
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AddDocumentToProjectDto {
  @IsArray()
  @IsUUID('4', { each: true }) // Validate từng phần tử trong mảng phải là UUID
  @IsNotEmpty()
  documentIds: string[];
}

```

### src\document\dto\create-document.dto.ts

```ts
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccessLevelDoc } from '../../constant/index.constant';
import { DocumentStatus } from '@prisma/client';

export class CreateDocumentDto {
  // Out info
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  // Basic Info

  @IsString({ message: 'userId must be a string' })
  userId: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 255 characters' })
  title?: string;

  @IsString({ message: 'description must be a string' })
  @Length(1, 500, {
    message: 'description must be between 1 and 500 characters',
  })
  description?: string;

  @IsString({ each: true, message: 'each author must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each author must be at most 50 characters',
  })
  authors?: string[];

  @IsString({ each: true, message: 'each subject must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each subject must be at most 50 characters',
  })
  subjects?: string[];

  @IsString({ each: true, message: 'each tag must be a string' })
  @MaxLength(30, {
    each: true,
    message: 'each tag must be at most 30 characters',
  })
  tags?: string[];

  @IsString({ message: 'documentType must be a string' })
  documentType?: string;

  @IsInt({ message: 'publishedYear must be an integer' })
  publishedYear?: number;

  @IsEnum(AccessLevelDoc, { message: 'accessLevel must be a valid enum value' })
  accessLevel: AccessLevelDoc;

  //
  @IsString({ message: 'originalName must be a string' })
  @MinLength(1, { message: 'originalName must not be empty' })
  originalName: string;

  @IsString({ message: 'filePath must be a string' })
  filePath: string;

  @IsString({ message: 'originalFileName must be a string' })
  mimeType?: string;

  @IsInt({ message: 'size must be an integer' })
  size?: number;

  @IsInt({ message: 'pageCount must be an integer' })
  pageCount?: number;

  // More Info
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus = DocumentStatus.PROCESSING;

  @IsInt({ message: 'viewCount must be an integer' })
  viewCount: number;

  metadata?: any;

  @IsDate({ message: 'indexedAt must be a valid date' })
  indexedAt?: Date;
}

```

### src\document\dto\update-document.dto.ts

```ts
export class UpdateDocumentDto {
  title?: string;
}

```

### src\document\dto\upload-document.dto.ts

```ts
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccessLevelDoc } from '../../constant/index.constant';

export class UploadMetadataDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsEnum(AccessLevelDoc)
  accessLevel?: AccessLevelDoc;

  @IsOptional()
  @IsInt()
  @Type(() => Number) // Convert string "2024" to number 2024
  publishedYear?: number;
}

```

### src\document\entities\document.entity.ts

```ts
export class Document {}

```

### src\document\oss.ts

```ts
// Object storage server (OSS) configuration

import * as fs from 'fs';
import * as multer from 'multer';
import path from 'path';

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      fs.mkdirSync('uploads/documents', { recursive: true });
    } catch (error) {}
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Latin1 to utf-8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    cb(null, uniqueSuffix + ext);
  },
});

// Delete file function
export const deleteFile = (filePath: string) => {
  const normalizedPath = path.normalize(filePath);
  fs.unlink(normalizedPath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
    } else {
      console.log('File deleted successfully');
    }
  });
};

```

### src\chat\chat.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatDto } from './dto/chat.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // -- CHAT LITE --
  @Post('/global')
  chatGlobal(
    @Req() req: { user: JwtPayloadWithRt },
    @Query('chatId') chatId: string | undefined,
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    chatDto.chatId = chatId;
    return this.chatService.chatGlobal(chatDto);
  }

  // -- CHAT HISTORY --
  @Post('/')
  chatHistory(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    return this.chatService.chatHistory(chatDto);
  }

  // -- GET CHAT DETAIL BY ID --
  @Get(':chatId/messages')
  getChatById(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.getChatById(req.user.userId, chatId);
  }

  // -- GET ALL USER CHATS --
  // @Get('/user/global')
  // getAllUserChat(@Req() req: { user: JwtPayloadWithRt }) {
  //   return this.chatService.getAllUserChat(req.user.userId);
  // }

  // -- GET GLOBAL USER CHATS --
  @Get('/user/global')
  getGlobalUserChat(@Req() req: { user: JwtPayloadWithRt }) {
    return this.chatService.getGlobalUserChat(req.user.userId);
  }

  // -- UPDATE CHAT: TITLE OR MOVE IN PROJECT --
  @Patch('/user/:id')
  update(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatService.update(req.user.userId, id, updateChatDto);
  }

  // -- DELETE CHAT --
  @Delete('/user/:id')
  remove(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    return this.chatService.remove(req.user.userId, id);
  }
}

```

### src\chat\chat.module.ts

```ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { OpenaiService } from '../llm/openai/openai.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [RetrievalModule],
  controllers: [ChatController],
  providers: [ChatService, OpenaiService, PrismaService],
})
export class ChatModule {}

```

### src\chat\chat.service.ts

```ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OpenaiService } from '../llm/openai/openai.service';
import { ChatDto } from './dto/chat.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ContentBlock } from '@langchain/core/messages';
import {
  RetrievalService,
  ScoredDocument,
} from '../retrieval/retrieval.service';

type MessageType = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CitationType = {
  index: number;
  snippet: string;
  text: string;
  fileId: string;
  fileUrl: string;
  page: number;
  startOffset: number;
  endOffset: number;
  score?: number;
  projectId: string;
};

type BaseMessage =
  | {
      answer: string;
      citations?: undefined;
      chat?: undefined;
    }
  | {
      answer: string | (ContentBlock | ContentBlock.Text)[];
      citations: CitationType[];
      // chat: {
      //   id: string;
      //   userId: string;
      //   title: string;
      //   messages: JsonValue[];
      //   createdAt: Date;
      //   updatedAt: Date;
      //   projectId: string | null;
      // };
      chatId: string;
    };

// 1. Grouping: Gom các chunk về theo từng File
// Mục đích: Không để chunk của file A nằm xen kẽ file B, gây lú ngữ cảnh.
type FileGroup = {
  fileId: string;
  fileName: string; // Để hiển thị cho LLM hiểu
  maxScore: number; // Điểm cao nhất mà file này đạt được (để đánh giá độ quan trọng của cả file)
  chunks: { content: string; index: number; score: number }[];
};
@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
  ) {}

  // -- PRIVATE CHAT FUNC --

  private async createStandaloneQuestion(
    chatHistory: MessageType[],
    question: string,
  ) {
    if (!chatHistory || chatHistory.length === 0) return question;

    const historyContext = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const rephrasePrompt = `
    Dựa trên lịch sử trò chuyện và câu hỏi mới nhất của người dùng, hãy viết lại câu hỏi mới sao cho nó trở thành một câu hỏi ĐỘC LẬP, đầy đủ ngữ nghĩa mà không cần đọc lịch sử vẫn hiểu được.
    KHÔNG trả lời câu hỏi, chỉ viết lại hoặc giữ nguyên nếu đã rõ ràng.
    Ví dụ: 
    - History: "Ai là hiệu trưởng?" -> Current: "Ông ấy bao nhiêu tuổi?" -> Output: "Hiệu trưởng trường hiện tại bao nhiêu tuổi?"
    `;

    // Call llm
    const messages = [
      { role: 'system', content: rephrasePrompt.trim() },
      {
        role: 'user',
        content: `HISTORY:\n${historyContext}\n\nCURRENT QUESTION:\n${question}`,
      },
    ];

    const rewrittenQuestion = await this.openaiService
      .getRewriteModel()
      .invoke(messages)
      .then((res) => res.content as string);

    return rewrittenQuestion;
  }

  private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
    // -- VALIDATIONS -- TODO: update with joi
    console.log('ChatDto', JSON.stringify(chatDto));

    const historyNum = 6;
    let chatId = chatDto.chatId;
    let finalQuestion = chatDto.message;
    // Ensure chat exists or create it
    if (!chatId) {
      // ... Logic tạo chat mới ...
      const created = await this.prisma.chats.create({
        data: {
          messages: [],
          userId: chatDto.userId as string,
          projectId: chatDto.projectId as string,
        },
      });
      chatId = created.id;
    }

    // ---------------------------------------------------------
    // 1. RETRIEVAL & RERANK
    // ---------------------------------------------------------

    // Rewrite question to standalone if chatId provided
    const historyMessages = await this.prisma.chats.findUnique({
      where: { id: chatId },
      select: { messages: true },
    });

    const contentHistory: MessageType[] = (
      (historyMessages?.messages ?? []) as MessageType[]
    )
      .slice(-historyNum)
      .filter((m) => m.role && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    if (contentHistory.length > 0) {
      finalQuestion = await this.createStandaloneQuestion(
        contentHistory,
        chatDto.message,
      );
    }

    // Gọi hàm mới retrieveAndRerank
    const scoredDocs: ScoredDocument[] =
      await this.retrievalService.retrieveAndRerank(
        finalQuestion,
        chatDto.userId as string,
        chatDto.projectId,
      );

    // Xử lý trường hợp không có tài liệu nào
    if (!scoredDocs || scoredDocs.length === 0) {
      // Return with not save
      return {
        answer:
          'Tôi không tìm thấy thông tin nào phù hợp trong tài liệu của bạn để trả lời câu hỏi này.',
      };
    }

    // Debug: Log kết quả sau khi Rerank
    console.log(`📋 Top ${scoredDocs.length} Documents after Rerank:`);
    scoredDocs.slice(0, 3).forEach((doc, idx) => {
      console.log(
        `  ${idx + 1}. [Score=${doc.finalScore?.toFixed(3)}] ${doc.pageContent.substring(0, 50)}...`,
      );
    });

    // ---------------------------------------------------------
    // 2. CONTEXT CONSTRUCTION (Learn Logic from "NotebookLM")
    // ---------------------------------------------------------
    // Gom nhóm chunk theo File để LLM hiểu ngữ cảnh của từng tài liệu
    const fileGroups = new Map<string, FileGroup>();

    // Lưu ý: scoredDocs bây giờ là mảng object, không phải [doc, score] nữa
    scoredDocs.forEach((doc) => {
      // Lọc nhiễu cơ bản
      if (doc.pageContent.length < 30) return;

      const fileId = doc.metadata.fileId as string;
      const fileName =
        doc.metadata['originalFileName'] ||
        `File_${fileId?.substring(0, 5) ?? 'Unknown'}`;
      const chunkIndex = doc.metadata.chunkIndex as number;
      const score = doc.finalScore || 0;

      if (!fileGroups.has(fileId)) {
        fileGroups.set(fileId, {
          fileId,
          fileName,
          maxScore: 0,
          chunks: [],
        });
      }

      const group = fileGroups.get(fileId)!;
      // Cập nhật maxScore để biết file nào quan trọng nhất
      // TODO: Nên lấy trung bình score của tất cả chunk trong file thay vì maxScore?
      if (score > group.maxScore) group.maxScore = score;

      group.chunks.push({
        content: doc.pageContent,
        index: chunkIndex,
        score: score,
      });
    });

    // Sắp xếp các FILE theo độ quan trọng giảm dần
    const sortedFiles = Array.from(fileGroups.values()).sort(
      (a, b) => b.maxScore - a.maxScore,
    );

    // Tạo chuỗi Context mạch lạc
    const contextParts: string[] = [];

    sortedFiles.forEach((group) => {
      // Trong 1 file, sắp xếp chunk theo thứ tự xuất hiện (index) để đọc như văn bản thường
      group.chunks.sort((a, b) => a.index - b.index);

      // Header rõ ràng cho LLM nhận biết nguồn
      let fileContext = `--- NGUỒN TÀI LIỆU: "${group.fileName}" (Độ phù hợp: ${(group.maxScore * 100).toFixed(0)}%) ---\n`;

      fileContext += group.chunks
        .map((c) => `(Trích đoạn #${c.index}): ${c.content}`) // Format: (Trích đoạn #1): Nội dung
        .join('\n\n');

      contextParts.push(fileContext);
    });

    const context = contextParts.join('\n\n');

    // console.log('Final Context passed to LLM:\n', context);

    // ---------------------------------------------------------
    // 3. PROMPT ENGINEERING (Tinh chỉnh cho Rerank)
    // ---------------------------------------------------------
    const SYSTEM_PROMPT = `
      Bạn là trợ lý AI chuyên nghiệp, nhiệm vụ là trả lời câu hỏi dựa trên các tài liệu được cung cấp.

      HƯỚNG DẪN XỬ LÝ THÔNG TIN:
      1. **Ưu tiên**: Các tài liệu được liệt kê đầu tiên trong Context là quan trọng nhất (đã được xếp hạng). Hãy dùng chúng làm cơ sở chính.
      2. **Tổng hợp**: Nếu thông tin nằm rải rác ở nhiều tài liệu, hãy tổng hợp lại một cách mạch lạc.
      3. **Mâu thuẫn**: Nếu các tài liệu mâu thuẫn nhau, hãy tin tưởng tài liệu có "Độ phù hợp" cao hơn (nằm trên cùng).
      4. **Trung thực**: Nếu không tìm thấy thông tin để trả lời, hãy nói "Tài liệu hiện tại không chứa thông tin về vấn đề này". Đừng bịa đặt.
      5. Nếu câu hỏi độc lập (rephrased) có vẻ sai lệch so với ý định ban đầu, hãy ưu tiên trả lời theo ngữ cảnh tài liệu tìm được.

      QUY TẮC: BẮT BUỘC TRÍCH DẪN (CITATION) :
      - Đã trích dẫn thì phải chính xác
      - Mọi thông tin đưa ra phải có dẫn chứng.
      - Sử dụng format **[#index]** ngay sau câu thông tin liên quan.
      - Ví dụ: "Doanh thu năm nay tăng 20% [#12]"
      - Chỉ sử dụng số index đã có trong context (Trích đoạn #...).
    `;

    const FINAL_USER_PROMPT = `
      CONTEXT TÀI LIỆU:
      ${context}

      ---
      CÂU HỎI CỦA TÔI: 
      ${chatDto.message}
    `;

    // ---------------------------------------------------------
    // 4. HISTORY & LLM CALL (Logic giữ nguyên, chỉ thay đổi input)
    // ---------------------------------------------------------

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT.trim() },
      ...contentHistory,
      { role: 'user', content: FINAL_USER_PROMPT.trim() },
    ];

    // Call LLM
    const response = await this.openaiService.getChatModel().invoke(messages);
    const aiAnswer = response.content as string;

    // ---------------------------------------------------------
    // 5. PREPARE CITATIONS (FE will controll it)
    // ---------------------------------------------------------
    // Map từ ScoredDocument sang CitationType
    const citations: CitationType[] = scoredDocs.map((doc) => ({
      index: doc.metadata.chunkIndex as number,
      snippet: doc.pageContent.substring(0, 150) + '...', // Preview ngắn
      text: doc.pageContent,
      fileId: doc.metadata.fileId as string,
      // Fallback các trường metadata nếu thiếu
      fileUrl: (doc.metadata.fileUrl as string) || '',
      page: (doc.metadata.page as number) || 0,
      score: doc.finalScore, // Trả về score để FE có thể hiện độ tin cậy
      startOffset: (doc.metadata.startOffset as number) || 0,
      endOffset: (doc.metadata.endOffset as number) || 0,
      projectId: doc.metadata.projectId as string,
    }));

    // ---------------------------------------------------------
    // 6. SAVE & RETURN
    // ---------------------------------------------------------
    const updatedMessages = [
      ...((historyMessages?.messages as MessageType[]) || []),
      { role: 'user', content: chatDto.message },
      {
        role: 'assistant',
        content: aiAnswer,
        citation: citations,
      },
    ];
    // Update async
    this.prisma.chats
      .update({
        where: { id: chatId },
        data: { messages: updatedMessages },
      })
      .catch((err) => {
        console.error('Error updating chat messages:', err);
      });

    return {
      answer: aiAnswer,
      citations,
      chatId: chatId,
    };
  }

  // -- PUBLIC CHAT FUNC --
  async chatGlobal(chatDto: ChatDto) {
    return await this.chatUtil(chatDto);
  }

  // -- Chat history --
  async chatHistory(chatDto: ChatDto) {
    // -- VALIDATIONS --
    // ... TODO: ...

    return await this.chatUtil(chatDto);
  }

  // -- Get all user chats --
  // async getAllUserChat(userId: string) {
  //   return await this.prisma.chats.findMany({
  //     orderBy: { updatedAt: 'desc' },
  //     where: { userId },
  //     omit: { messages: true, userId: true },
  //   });
  // }

  // -- Get global user chats --
  async getGlobalUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
      omit: { messages: true, userId: true },
    });
  }

  // -- Get Chat by ID --
  async getChatById(userId: string, chatId: string) {
    return await this.prisma.chats.findUnique({
      where: { id: chatId, userId },
    });
  }

  // -- Update chat (title, or move in project) --
  async update(userId: string, id: string, updateChatDto: UpdateChatDto) {
    return await this.prisma.chats.update({
      where: { id, userId },
      data: updateChatDto,
      omit: { userId: true, messages: true },
    });
  }

  // -- Delete chat --
  async remove(userId: string, id: string) {
    const chat = await this.prisma.chats.findUnique({
      where: { id },
    });
    if (!chat) throw new BadRequestException('Chat not found');
    if (chat.userId !== userId)
      throw new ForbiddenException('User Unauthorized!');

    return await this.prisma.chats.delete({
      where: { id },
      omit: { userId: true, messages: true },
    });
  }
}

```

### src\chat\dto\chat.dto.ts

```ts
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';
export class ChatDto {
  @IsString({ message: 'userId must be a string' })
  userId?: string;
  @IsString({ message: 'chatId must be a string' })
  chatId?: string;
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  @IsNotEmpty({ message: 'message should not be empty' })
  @IsString({ message: 'message must be a string' })
  @MaxLength(1000, { message: 'message must not exceed 1000 characters' })
  message: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 100 characters' })
  title?: string;
}

```

### src\chat\dto\update-chat.dto.ts

```ts
import { IsString } from 'class-validator';

export class UpdateChatDto {
  @IsString({ message: 'title must be a string' })
  title?: string;

  @IsString({ message: 'projectId must be a string' })
  projectId?: string | null;
}

```

### src\user\dto\create-user.dto.ts

```ts
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'email not valid!' })
  email: string;

  @IsString({ message: 'username must be a string' })
  username: string;

  @IsString({ message: 'name must be a string' })
  name?: string;

  @IsString({ message: 'password must be a string' })
  password: string;
}

```

### src\user\dto\update-user.dto.ts

```ts
export class UpdateUserDto {
  email?: string;
  username?: string;
  name?: string;
  password?: string;
}

```

### src\user\entities\user.entity.ts

```ts
export class User {}

```

### src\user\user.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../constant/index.constant';

@Controller('user')
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // === GET ===
  @Get()
  // @ApiBearerAuth()
  findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Get(':userId')
  // @ApiBearerAuth()
  findUserById(@Param('userId') id: string) {
    return this.userService.findUserById(id);
  }

  // === POST ===
  // TODO: Avatar image update
  @Post()
  createNewUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createNewUser(createUserDto);
  }

  // === PATCH ===
  @Patch(':userId')
  // @ApiBearerAuth()
  updateUser(
    @Param('userId') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  // === DELETE ===
  @Delete(':userId')
  // @ApiBearerAuth()
  removeUser(@Param('userId') id: string) {
    return this.userService.removeUser(id);
  }
}

```

### src\user\user.module.ts

```ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}

```

### src\user\user.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // -- ALL USERS: ADMIN ONLY --
  findAllUsers() {
    return this.prisma.users.findMany();
  }

  // -- FIND USER BY ID --
  findUserById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  // -- CREATE USER --
  createNewUser(createUserDto: CreateUserDto) {
    return this.prisma.users.create({
      data: createUserDto,
    });
  }

  // -- UPDATE USER --
  updateUser(id: string, updateUserDto: UpdateUserDto) {
    // TODO: logic update password
    return this.prisma.users.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // -- DELETE USER --
  removeUser(id: string) {
    // TODO: Projected logic del
    return this.prisma.users.delete({ where: { id } });
  }
}

```

### src\main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './response.interceptor';
import { HttpExceptionFilter } from './http-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Replace the default NestJS logger with Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // --- Config CORS ---
  // Dev mode: Allow all origins
  app.enableCors();

  /* //  Production mode: Restrict origins
  app.enableCors({
    origin: ['http://localhost:3000', 'https://chatnary.com'], // Add your allowed origins here
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies
  });
  */

  const config = new DocumentBuilder()
    .setTitle('Chatnary API')
    .setDescription('The Chatnary API description')
    .setVersion('1.0')
    .addTag('chatnary')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // -- Response interceptor --
  app.useGlobalInterceptors(new ResponseInterceptor());
  // -- HTTP exception filter --
  app.useGlobalFilters(new HttpExceptionFilter());
  // -- Prefix all routes with /api/v1 --
  app.setGlobalPrefix('api/v1');
  // -- Swagger setup --
  SwaggerModule.setup('api/v1/docs', app, documentFactory);
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();

```

### src\app.module.ts

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngestModule } from './ingest/ingest.module';
import { DocumentModule } from './document/document.module';
import { ChatModule } from './chat/chat.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { OpenaiModule } from './llm/openai/openai.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectModule } from './project/project.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { envConfig } from './config/env.config';
import { UserModule } from './user/user.module';
import * as Joi from 'joi';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { RetrievalModule } from './retrieval/retrieval.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file'; // Import if using rotation

@Module({
  imports: [
    // Serve static files from the "uploads" directory
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // PROJECT_ROOT/uploads
      serveRoot: '/uploads',
    }),
    // Environment configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: Joi.object({
        // API Keys
        OPENAI_API_KEY: Joi.string().required(),
        GOOGLE_API_KEY: Joi.string().optional(),

        // Database - Universal configuration (works with any PostgreSQL provider)
        DATABASE_URL: Joi.string().required(),
        DATABASE_DIRECT_URL: Joi.string().optional(), // For migrations (Neon, Supabase)

        // Database - Legacy individual parameters (optional, for backward compatibility)
        POSTGRES_HOST: Joi.string().optional(),
        POSTGRES_PORT: Joi.number().optional(),
        POSTGRES_DB: Joi.string().optional(),
        POSTGRES_USER: Joi.string().optional(),
        POSTGRES_PASSWORD: Joi.string().optional(),

        // Database - Connection pool settings (optional)
        DB_POOL_MAX: Joi.number().optional(),
        DB_POOL_MIN: Joi.number().optional(),
        DB_POOL_IDLE_TIMEOUT: Joi.number().optional(),
        DB_POOL_CONNECTION_TIMEOUT: Joi.number().optional(),
        DB_KEEPALIVE: Joi.boolean().optional(),
        DB_KEEPALIVE_DELAY: Joi.number().optional(),
        DB_SSL: Joi.boolean().optional(),
        DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().optional(),

        // PGVector settings (optional)
        PGVECTOR_TABLE: Joi.string().optional(),
        PGVECTOR_DISTANCE_STRATEGY: Joi.string()
          .valid('cosine', 'innerProduct', 'euclidean')
          .optional(),

        // JWT Authentication
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().optional().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().optional(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().optional().default('7d'),

        // Server configuration
        PORT: Joi.number().optional().default(8000),
        NODE_ENV: Joi.string()
          .valid('dev', 'prod', 'test')
          .optional()
          .default('dev'),

        // Model configuration
        GEMINI_MODEL: Joi.string().optional(),
        EMBEDDING_MODEL: Joi.string().optional(),

        // Performance settings
        API_TIMEOUT: Joi.number().optional(),
        RETRIEVER_K: Joi.number().optional(),
        MAX_HISTORY_MESSAGES: Joi.number().optional(),

        // Logging
        LOG_LEVEL: Joi.string()
          .valid('ERROR', 'WARN', 'INFO', 'DEBUG')
          .optional()
          .default('INFO'),
      }),
    }),
    WinstonModule.forRoot({
      transports: [
        // 1. Log to Console (so you can still see them while developing)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(), // Add colors for console
            winston.format.printf(
              ({ timestamp, level, message, context, ms }: any) => {
                return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${ms}`;
              },
            ),
          ),
        }),

        // 2. Save Errors to a separate file
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(), // JSON format is better for parsing later
          ),
        }),

        // 2.1 Save log dev to a separate file
        new winston.transports.File({
          filename: 'logs/dev.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(), // JSON format is better for parsing later
          ),
        }),

        // 3. Save ALL logs (info, debug, error) to a daily rotating file
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true, // Zip old logs to save space
          maxSize: '20m',
          maxFiles: '14d', // Keep logs for 14 days
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    // Application modules
    IngestModule,
    DocumentModule,
    ChatModule,
    PipelineModule,
    OpenaiModule,
    PrismaModule,
    ProjectModule,
    AuthModule,
    UserModule,
    RetrievalModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Role-based access control guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

```

### src\config\env.config.ts

```ts
export const envConfig = () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  database: {
    // Flexible: works with any PostgreSQL provider (Neon, Supabase, Docker, etc.)
    url: process.env.DATABASE_URL,
    // Optional: for migrations (required by some providers like Neon)
    directUrl: process.env.DATABASE_DIRECT_URL,
    // Connection pool settings (optional, provider-specific)
    pooling: {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
      ),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  jwtRefresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
});

```

### src\config\pg.config.ts

```ts
import { DistanceStrategy } from '@langchain/community/vectorstores/pgvector';
import { PoolConfig } from 'pg';

/**
 * Universal PostgreSQL Vector Store Configuration
 * Works with: Neon, Supabase, Docker, AWS RDS, Google Cloud SQL, etc.
 *
 * Configuration is driven by environment variables for maximum flexibility.
 */

// Get database configuration based on DATABASE_URL or individual params
const getDatabaseConfig = (): PoolConfig => {
  const databaseUrl =
    process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

  // If DATABASE_URL exists, use it directly - pg Pool handles parsing
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,

      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
      ),

      // Keepalive settings (important for cloud databases like NeonDB)
      keepAlive: process.env.DB_KEEPALIVE === 'true',
      keepAliveInitialDelayMillis: parseInt(
        process.env.DB_KEEPALIVE_DELAY || '10000',
      ),

      // SSL configuration - use sslmode from connection string or env var
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              rejectUnauthorized:
                process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
            }
          : undefined,
    };
  }

  // Fallback: individual connection parameters (legacy/Docker)
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(
      process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
    ),
    keepAlive: process.env.DB_KEEPALIVE === 'true',
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : undefined,
  };
};

/**
 * Universal PGVector configuration
 * Compatible with all PostgreSQL providers
 *
 * IMPORTANT: This must be a getter function to ensure environment variables
 * are loaded from ConfigModule before accessing them
 */
export const getPgConfig = () => ({
  postgresConnectionOptions: getDatabaseConfig(),
  tableName: process.env.PGVECTOR_TABLE || 'embeddings',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'embedding',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: (process.env.PGVECTOR_DISTANCE_STRATEGY ||
    'cosine') as DistanceStrategy,
});

/**
 * @deprecated Use getPgConfig() instead - lazy evaluation required for env vars
 */
export const pgConfig = getPgConfig();

/**
 * @deprecated Use getPgConfig() instead - it's now universal
 * Kept for backward compatibility
 */
export const getPgConfigNeon = getPgConfig;

```
