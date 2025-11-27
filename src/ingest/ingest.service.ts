import { Injectable } from '@nestjs/common';
import { VectorService } from './vector/vector.service';
import { PdfService } from './loaders/pdf.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { OcrService } from './loaders/ocr.loader';

@Injectable()
export class IngestService {
  constructor(
    private pdfService: PdfService,
    private ocrService: OcrService,
    private textSplitterService: TextSplitterService,
    private vectorService: VectorService,
  ) {}
  /* 
    1. Load PDF document
    2. Split text into chunks
    3. Create embeddings => Store embeddings in vector database
    */
  async ingestDocument(filePath: string, fileId: string, projectId?: string) {
    // 1. Load PDF document
    // const text = await this.pdfService.load(filePath);
    const { text } = await this.ocrService.load(filePath);
    // 2. Split text into chunks
    const chunks = await this.textSplitterService.splitText(text);
    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata: { fileId, projectId },
    });
  }
}
