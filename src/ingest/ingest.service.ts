import { Injectable } from '@nestjs/common';
import { VectorService } from './vector/vector.service';
import { PdfService } from './loaders/pdf.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { OcrService } from './loaders/ocr.loader';
import { CloudService } from './loaders/cloud.loader';
// import * as fs from 'fs';

@Injectable()
export class IngestService {
  constructor(
    // private pdfService: PdfService,
    // private ocrService: OcrService,
    private cloudService: CloudService,
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
    // const pdfPages = await this.pdfService.load(filePath);
    const markdownResult = await this.cloudService.load(filePath);

    // console.log(JSON.stringify(markdownResult));

    // // OCR handle
    // let pagesToSplit = pdfPages;
    // if (
    //   !pdfPages ||
    //   pdfPages.length === 0 ||
    //   pdfPages.every((p) => p.text.trim().length < 5)
    // ) {
    //   console.log('📄 PDF scanned → OCR');
    //   const ocrResult = await this.ocrService.load(filePath);
    //   pagesToSplit = [{ page: 1, text: ocrResult.text }];
    // }

    // 2. Split text into chunks
    // Extract markdown text from ParseResult array
    const markdownList = markdownResult
      .flatMap((result) =>
        result.pages.map((page) => ({
          content: (page.md || page.text || '') as string,
          page: page.page as number,
        })),
      )
      .filter((item) => item.content.trim().length > 0); // Filter dựa trên thuộc tính .content

    const chunks = await this.textSplitterService.splitToMarkdown(markdownList);

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
    // console.log('📦 Total chunks:', chunks);

    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata,
    });

    // Return number of chunks processed
    return chunks;
  }
}
