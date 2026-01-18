import { Injectable } from '@nestjs/common';
import { VectorService } from './vector/vector.service';
import { TextSplitterService } from './splitters/text-splitter';
import { CloudService } from './loaders/cloud.loader';

@Injectable()
export class IngestService {
  constructor(
    private cloudService: CloudService,
    private textSplitterService: TextSplitterService,
    private vectorService: VectorService,
  ) { }
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
    const markdownResult = await this.cloudService.load(filePath);

    // console.log(JSON.stringify(markdownResult));

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


    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata,
    });

    // Return number of chunks processed
    return chunks;
  }
}
