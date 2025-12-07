# Citation function - BE

## `src\chat\chat.service.ts`

```typescript

type MessageType = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
@Injectable()
export class ChatService {
  // ...

  // -- Chat history --
  async chatHistory(chatDto: ChatDto) {

    const topK = 5;
    const historyNum = 6;

    // 1. Get relevant docs from vector DB
    const relateDocs = await this.vectorService.getRetrievals(
      chatDto.message,
      topK,
      chatDto.userId as string,
      chatDto.projectId,
    );
    // Empty docs => return "Chatbot Don't know"
    if (!relateDocs || relateDocs.length === 0) {
      return {
        answer: 'Tôi không tìm thấy thông tin trong tài liệu.',
        relateDocs: [],
      };
    }

    // 2. Clean context
    const context = relateDocs
      .map((d) => `### Chunk ${d.metadata.chunkIndex}\n${d.pageContent}`)
      .join('\n\n');

    const SYSTEM_PROMPT = `
      Bạn là một assistant chỉ trả lời dựa trên thông tin trong "Context".
      Nếu không thấy câu trả lời trong Context thì trả lời "Tôi không tìm thấy thông tin trong tài liệu."

      QUY TẮC TRÍCH DẪN (CITATION):

      1. Mỗi đoạn trong Context có dạng:
        ### Chunk {chunkIndex}
        Nội dung...

      2. Khi sử dụng thông tin từ chunk nào, bạn phải chèn citation
        theo format: [chunkIndex]
        ngay SAU câu, hoặc SAU bullet point sử dụng thông tin đó.

      3. Chỉ chèn citation khi thông tin thật sự đến từ chunk đó.
        Tuyệt đối không bịa, không chèn sai chunk.

      4. Tránh lặp lại citation không cần thiết (nếu cùng chunk được dùng
        liên tục trong nhiều câu liên tiếp, bạn có thể gộp cuối đoạn).

      5. KHÔNG bao giờ tạo chunkIndex mới.
        Bạn chỉ được dùng chunkIndex đã có trong Context.

      6. Câu trả lời phải rõ ràng, mạch lạc, và có citations chính xác
        theo đúng vị trí sử dụng thông tin.
      `;

    const FINAL_USER_PROMPT = `
          Context:

          ${context}

          ---

          Câu hỏi: ${chatDto.message}
      `;
    // 3. Get history messages
    // Ensure chat exists or create it
    let chatId = chatDto.chatId;
    if (
      !chatId ||
      chatId == null ||
      chatId === 'null' ||
      chatId === 'undefined'
    ) {
      const created = await this.prisma.chats.create({
        data: {
          messages: [],
          userId: chatDto.userId as string,
          projectId: chatDto.projectId as string,
        },
      });
      chatId = created.id;
    }

    const historyMessages = await this.prisma.chats.findUnique({
      where: { id: chatId },
    });

    if (!historyMessages) {
      throw new Error('Chat not found');
    }

    const contentHistory: MessageType[] = (historyMessages.messages ?? [])
      .slice(-historyNum)
      .filter((m: any) => m && m.role && m.content) // Filter out invalid messages
      .map((m: any) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

    const messages = [
      ...contentHistory, // Last up to 6 messages
      { role: 'system' as const, content: SYSTEM_PROMPT.trim() },
      { role: 'user' as const, content: FINAL_USER_PROMPT.trim() },
    ];

    console.log('message var:', messages);

    // 3. Call LLM
    const response = await this.openaiService.model.invoke(messages);

    const citations = relateDocs.map((doc) => ({
      index: doc.metadata.chunkIndex,
      snippet: doc.pageContent.substring(0, 200) + '...',
      text: doc.pageContent,
      fileId: doc.metadata.fileId,
      fileUrl: doc.metadata.fileUrl,
      page: doc.metadata.page,
      chunkIndex: doc.metadata.chunkIndex,
      startOffset: doc.metadata.startOffset,
      endOffset: doc.metadata.endOffset,
    }));

    // 4. Save assistant response to history
    // Get current messages and append new ones (avoid nested arrays)
    const currentChat = await this.prisma.chats.findUnique({
      where: { id: chatId },
      select: { messages: true },
    });

    const updatedMessages = [
      ...((currentChat?.messages as MessageType[]) || []),
      { role: 'user' as const, content: chatDto.message },
      { role: 'assistant' as const, content: response.content as string },
    ];

    const chat = await this.prisma.chats.update({
      where: { id: chatId },
      data: {
        messages: updatedMessages,
      },
    });

    return {
      answer: response.content,
      citations,
      relateDocs,
      chat,
    };
  }
```

## `src\ingest\ingest.service.ts`

```typescript

@Injectable()
export class IngestService {
  //...
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
```

## `src\ingest\loaders\pdf.loader.ts`

```typescript
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

## `src\ingest\splitters\text-splitter.ts`

```typescript
//... import
export type ChunkResult = {
  text: string;
  page: number;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
};

@Injectable()
export class TextSplitterService {
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
```

## `src\ingest\vector\vector.service.ts`

```typescript
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
  async getRetrievals(
    query: string,
    k = 10,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearch(query, k, filter);
    return results;
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}
```
