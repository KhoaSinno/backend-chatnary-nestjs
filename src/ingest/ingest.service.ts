import { Injectable } from '@nestjs/common';
import { VectorService } from './vector/vector.service';
import { PdfService } from './loaders/pdf.loader';
import { TextSplitterService } from './splitters/text-splitter';

@Injectable()
export class IngestService {
  constructor(
    private pdfService: PdfService,
    // private ocrLoader: OcrLoader,
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
    const text = await this.pdfService.load(filePath);
    // 2. Split text into chunks
    const chunks = await this.textSplitterService.splitText(text);
    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata: { fileId, projectId },
    });
  }
}
