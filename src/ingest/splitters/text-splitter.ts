import { Injectable, Logger } from '@nestjs/common';
import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constant/index.constant.js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export type ChunkResult = {
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
};

export type MarkdownProp = { content: string; page: number };

@Injectable()
export class TextSplitterService {
  private readonly logger = new Logger(TextSplitterService.name);

  async splitToMarkdown(
    markdownInputs: MarkdownProp[],
  ): Promise<ChunkResult[]> {
    if (!markdownInputs || markdownInputs.length === 0) {
      this.logger.warn('Empty markdown text received for splitting.');
      return [];
    }

    const texts = markdownInputs.map((item) => item.content);
    const metadata = markdownInputs.map((item) => ({
      page: item.page,
    }));

    // Logic: Cố gắng giữ văn bản liền mạch, chỉ cắt khi vượt quá CHUNK_SIZE
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE || 1000,
      chunkOverlap: CHUNK_OVERLAP || 200,
      separators: [
        '\n\n', // Ưu tiên 1: Cắt theo đoạn văn (giữ header dính với body)
        '\n', // Ưu tiên 2: Xuống dòng
        '. ', // Ưu tiên 3: Kết thúc câu
        '? ',
        '! ',
        ' ', // Ưu tiên 4: Dấu cách
        '', // Cuối cùng: Cắt ký tự
      ],
      // keepSeparator: true, // Giữ lại ký tự phân cách để văn bản tự nhiên hơn
    });

    const docsSplitted = await splitter.createDocuments(texts, metadata);

    this.logger.log(
      `Splitting completed: Processed ${texts.length} pages into ${docsSplitted.length} chunks.`,
    );

    let globalChildIndex = 0;

    return docsSplitted.map((doc) => ({
      content: doc.pageContent,
      chunkIndex: globalChildIndex++,
      metadata: doc.metadata || {},
    }));
  }
}
