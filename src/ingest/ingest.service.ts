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
    4. Create embeddings => Store embeddings in vector database
    */
  async ingestDocument(filePath: string, fileId: string, projectId?: string) {
    const text = await this.pdfService.load(filePath);
    const chunks = await this.textSplitterService.splitText(text);

    await this.vectorService.addDocuments({
      chunks,
      metadata: { fileId, projectId },
    });
  }
}
