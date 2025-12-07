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
  ) {
    // 1. Load document based on file type
    // let text: string;
    // const ext = filePath.toLowerCase();

    // if (ext.endsWith('.txt')) {
    //   // Plain text file => .txt
    //   text = fs.readFileSync(filePath, 'utf-8');
    // } else if (ext.endsWith('.pdf')) {
    //   // Try PDF first
    //   text = await this.pdfService.load(filePath);

    //   // If PDF has no text (scanned), use OCR
    //   if (!text || text.trim().length < 20) {
    //     console.log('📄 PDF has no text, using OCR...');
    //     const result = await this.ocrService.load(filePath);
    //     text = result.text;
    //   }
    // } else if (/\.(jpg|jpeg|png|bmp|tiff|webp)$/i.test(ext)) {
    //   // Image files - use OCR
    //   const result = await this.ocrService.load(filePath);
    //   text = result.text;
    // } else {
    //   throw new Error(`Unsupported file type: ${ext}`);
    // }
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
    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata: {
        fileId,
        projectId,
        userId,
        fileUrl: filePath,
      },
    });

    // Return number of chunks processed
    return chunks.length;
  }
}
