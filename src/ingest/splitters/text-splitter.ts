import { Injectable } from '@nestjs/common';
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
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
  // splitter = new RecursiveCharacterTextSplitter({
  //   chunkSize: 1000,
  //   chunkOverlap: 200,
  // });

  // async splitText(text: string) {
  //   return this.splitter.splitText(text);
  // }

  splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    let globalOffset = 0;
    let chunkIndex = 0;

    for (const p of pages) {
      const pageText = p.text.trim();
      if (!pageText) {
        continue;
      }

      let localStart = 0;

      while (localStart < pageText.length) {
        const end = Math.min(localStart + CHUNK_SIZE, pageText.length);
        const chunkText = pageText.slice(localStart, end);

        const chunk: ChunkResult = {
          text: chunkText,
          page: p.page,
          chunkIndex: chunkIndex,
          startOffset: globalOffset + localStart,
          endOffset: globalOffset + end,
        };

        chunks.push(chunk);
        chunkIndex++;

        // next chunk start
        localStart += CHUNK_SIZE - CHUNK_OVERLAP;
      }

      globalOffset += pageText.length;
    }

    return chunks;
  }

  // If user sends plain text instead of PDF
  splitText(text: string): ChunkResult[] {
    const pages = [{ page: 1, text }];
    return this.splitPdfPages(pages);
  }
}
