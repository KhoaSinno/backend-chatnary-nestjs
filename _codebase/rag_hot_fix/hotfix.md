# Project Export

## Project Statistics

- Total files: 24

## Folder Structure

```
src
  llm
    openai
      openai.module.ts
      openai.service.ts
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
  chat
    chat.controller.ts
    chat.module.ts
    chat.service.ts
    dto
      chat.dto.ts
      update-chat.dto.ts
    entities
      chat.entity.ts
  pipeline
    pipeline.module.ts
    pipeline.service.ts
  document
    document.controller.ts
    document.module.ts
    document.service.ts
    dto
      create-document.dto.ts
      update-document.dto.ts
    entities
      document.entity.ts
    oss.ts

```

### src\llm\openai\openai.module.ts

```ts
import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Module({
  providers: [OpenaiService],
})
export class OpenaiModule {}

```

### src\llm\openai\openai.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenaiService {
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('openai.apiKey')!;
  }

  getChatModel(modelName = 'gpt-4.1') {
    return new ChatOpenAI({
      model: modelName,
      apiKey: this.apiKey,
      temperature: 0,
      maxRetries: 2,
    });
  }

  getEmbeddings(model = 'text-embedding-3-small') {
    return new OpenAIEmbeddings({
      model,
      apiKey: this.apiKey,
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

### src\ingest\loaders\ocr.loader.ts

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private workers: Tesseract.Worker[] = [];
  private readonly WORKER_COUNT = 4; // Số workers song song

  async onModuleInit() {
    // Tạo worker pool để OCR song song
    const workerPromises = Array.from({ length: this.WORKER_COUNT }, () =>
      Tesseract.createWorker('vie'),
    );
    this.workers = await Promise.all(workerPromises);
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
      const convert = fromPath(filePath, {
        density: 130, // dpi
        saveFilename: `ocr-${Date.now()}`, // Temporary filename
        savePath: tempDir,
        format: 'png',
        width: 1000, // upscale width
        height: 1000,
      });

      const convertPromises: Promise<any>[] = [];
      for (let page = 1; page <= pageCount; page++) {
        convertPromises.push(convert(page, { responseType: 'image' }));
      }
      const pageImages = await Promise.all(convertPromises);
      console.log('✅ PDF converted to images');

      // 5️⃣ OCR tất cả trang song song với worker pool
      console.log(`🔍 Running OCR on ${pageCount} pages...`);
      const ocrPromises = pageImages.map((img: any, index: number) => {
        const worker = this.getWorker(index); // Round-robin workers
        return worker.recognize(img.path).then((res) => ({
          text: res.data.text,
          path: img.path,
          page: index + 1,
        }));
      });

      const results = await Promise.all(ocrPromises);
      console.log('✅ OCR completed');

      // 6️⃣ Ghép text theo thứ tự trang
      const allText = results
        .sort((a, b) => a.page - b.page)
        .map((r) => r.text)
        .join('\n');

      // 7️⃣ Xoá file ảnh tạm
      results.forEach((r) => {
        try {
          if (fs.existsSync(r.path)) fs.unlinkSync(r.path);
        } catch {}
      });

      return { text: allText };
    } catch (error) {
      console.log('OCR Error: ', error);
      throw error;
    }
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

```

### src\ingest\vector\pgvector.client.ts

```ts
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { pgConfig, getPgConfigNeon } from '../../config/pg.config';

@Injectable()
export class PgvectorService {
  private vectorStore: PGVectorStore | null = null;

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: ConsoleLogger,
  ) {}
  async initVectorStore() {
    // Check singleton
    if (this.vectorStore) {
      return this.vectorStore;
    }

    // Use NeonDB if DATABASE_URL_NEON is set, otherwise use local
    const useNeon = !!process.env.DATABASE_URL_NEON;
    const config = useNeon ? getPgConfigNeon() : pgConfig;

    this.logger.log('🔧 PGVector Config:', {
      useNeon,
      connectionString: useNeon
        ? process.env.DATABASE_URL_NEON?.substring(0, 30) + '...'
        : `${process.env.POSTGRES_HOST || 'db'}:${process.env.POSTGRES_PORT || '5432'}`,
    });

    // Init ONCE
    this.vectorStore = await PGVectorStore.initialize(
      this.openaiService.getEmbeddings(),
      config,
    );

    this.logger.log('✅ Connected to PGVector successfully!');
    return this.vectorStore;
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
  @Get(':id')
  getChatById(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    return this.chatService.getChatById(req.user.userId, id);
  }

  // -- GET ALL USER CHATS --
  @Get('/user/all')
  getAllUserChat(@Req() req: { user: JwtPayloadWithRt }) {
    return this.chatService.getAllUserChat(req.user.userId);
  }

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
import { IngestModule } from '../ingest/ingest.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [IngestModule],
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
import { VectorService } from '../ingest/vector/vector.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContentBlock } from '@langchain/core/messages';
import { DocumentInterface } from '@langchain/core/documents';
import { JsonValue } from '@prisma/client/runtime/library';

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
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
};

// type ChatType = {
//   id: string;
//   title: string;
//   messages: JSON[];
//   createdAt: Date;
//   updatedAt: Date;
//   userId: string;
//   projectId: string | null;
// };

type BaseMessage =
  | {
      answer: string;
      relateDocs: never[];
      citations?: undefined;
      chat?: undefined;
    }
  | {
      answer: string | (ContentBlock | ContentBlock.Text)[];
      citations: CitationType[];
      relateDocs: DocumentInterface<Record<string, any>>[];
      chat: {
        id: string;
        userId: string;
        title: string;
        messages: JsonValue[];
        createdAt: Date;
        updatedAt: Date;
        projectId: string | null;
      };
    };

@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly vectorService: VectorService,
    private prisma: PrismaService,
  ) {}

  // -- PRIVATE CHAT FUNC --

  private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
    // -- VALIDATIONS --
    // ... TODO: ...

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
    // console.log('Related Docs: ', relateDocs);

    // 2. Clean context
    const context = relateDocs
      .map((d) => `### Chunk ${d.metadata.chunkIndex}\n${d.pageContent}`)
      .join('\n\n');
    // console.log('Context: ', context);

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
    // console.log('clean mess', historyMessages.messages);

    const contentHistory: MessageType[] = (
      (historyMessages.messages ?? []) as MessageType[]
    )
      .slice(-historyNum)
      .filter((m: MessageType) => m && m.role && m.content) // Filter out invalid messages
      .map((m: MessageType) => ({
        role: m.role,
        content: m.content,
      }));

    const messages = [
      ...contentHistory, // Last up to 6 messages
      { role: 'system' as const, content: SYSTEM_PROMPT.trim() },
      { role: 'user' as const, content: FINAL_USER_PROMPT.trim() },
    ];

    console.log('message var:', messages);

    // 3. Call LLM
    const response = await this.openaiService.getChatModel().invoke(messages);

    const citations: CitationType[] = relateDocs.map((doc) => ({
      index: doc.metadata.chunkIndex as number,
      snippet: doc.pageContent.substring(0, 200) + '...',
      text: doc.pageContent,
      fileId: doc.metadata.fileId as string,
      fileUrl: doc.metadata.fileUrl as string,
      page: doc.metadata.page as number,
      chunkIndex: doc.metadata.chunkIndex as number,
      startOffset: doc.metadata.startOffset as number,
      endOffset: doc.metadata.endOffset as number,
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
      {
        role: 'assistant' as const,
        content: response.content as string,
        citation: citations,
      },
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

  // async chatGlobal(chatDto: ChatDto): Promise<BaseMessage> {
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
  async getAllUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId },
    });
  }

  // -- Get global user chats --
  async getGlobalUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
    });
  }

  // -- Get Chat by ID --
  async getChatById(userId: string, id: string) {
    return await this.prisma.chats.findUnique({
      where: { id, userId },
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

### src\chat\entities\chat.entity.ts

```ts
export class Chat {}

```

### src\pipeline\pipeline.module.ts

```ts
import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Module({
  providers: [PipelineService],
})
export class PipelineModule {}

```

### src\pipeline\pipeline.service.ts

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PipelineService {}

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

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // -- UPLOAD FILES --
  @Post('upload/files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      dest: 'uploads/documents',
      storage: storage,
      limits: { fileSize: 20 * 1024 * 1024 },
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
    @Body('projectId') projectId?: string,
  ) {
    Logger.log('Uploaded files:', files);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    await this.documentService.uploadFiles(req.user.userId, files, projectId);
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
import { project_documents } from '@prisma/client';
import { AccessLevelDoc } from '../constant/index.constant';

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
  ): Promise<void> {
    for (const file of files) {
      let document: project_documents | null = null;
      try {
        // Pre create document record with 'processing' status
        document = await this.createDocument({
          projectId: projectId as string,
          name: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing',
          userId: userId,
          accessLevel: AccessLevelDoc.PRIVATE,
          viewCount: 0,
        });

        const chunksCount = await this.ingestService.ingestDocument(
          file.path,
          document.id,
          userId,
          projectId,
        );

        this.logger.log(
          `✅ Ingested ${chunksCount} chunks for: ${file.originalname}`,
        );

        // If ingestion successful (has chunks), save document record in DB
        if (chunksCount > 0) {
          // update 'done' status
          await this.updateDocumentStatus(document.id, 'done');

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
          await this.updateDocumentStatus(document.id, 'error');
        }
      }
    }
  }
  // -- REMOVE --
  async removeDocument(fileId: string, userId: string) {
    // Check doc exists
    const document = await this.prisma.project_documents.findUnique({
      where: { id: fileId },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (document.userId !== userId)
      throw new NotFoundException('Document not found');

    // Remove vectors
    await this.vectorService.removeVectorByFileId(fileId);

    // Delete physical file
    try {
      deleteFile(path.join(process.cwd(), document.filePath));
    } catch (error) {
      console.error('⚠️ File delete error:', error);
      throw new NotFoundException('Delete file uploads error');
    }

    // project_documents
    return await this.prisma.project_documents.delete({
      where: { id: fileId },
    });
  }

  // Remove all documents in a project
  async removeDocumentInProject(projectId: string, userId: string) {
    // Get all documents in project
    const documents = await this.prisma.project_documents.findMany({
      where: { projectId: projectId, userId: userId },
    });

    if (documents.length === 0) {
      return {
        count: 0,
        isDeleted: true,
      };
    }

    // Remove each document's vector and physical file
    for (const document of documents) {
      // Remove vectors
      try {
        await this.vectorService.removeVectorByFileId(document.id);
        this.logger.log(`🗑️ Deleted vectors for document: ${document.name}`);
      } catch (error) {
        this.logger.error(
          `⚠️ Vector delete error for ${document.name}:`,
          error,
        );
      }

      // Delete physical file
      try {
        deleteFile(path.join(process.cwd(), document.filePath));
        this.logger.log(`🗑️ Deleted file: ${document.filePath}`);
      } catch (error) {
        this.logger.error(
          `⚠️ File delete error for ${document.filePath}:`,
          error,
        );
      }
    }

    // Delete all document records from DB
    const deleteResult = await this.prisma.project_documents.deleteMany({
      where: { projectId: projectId, userId: userId },
    });

    this.logger.log(
      `✅ Deleted ${deleteResult.count} document records from database`,
    );

    return {
      count: deleteResult.count,
      isDeleted: true,
    };
  }

  // -- CREATE DOCUMENT MAPPING --
  async createDocument(documentDto: CreateDocumentDto) {
    return await this.prisma.project_documents.create({
      data: {
        projectId: documentDto.projectId,
        name: documentDto.name,
        filePath: documentDto.filePath,
        mimeType: documentDto.mimeType,
        size: documentDto.size,
        status: documentDto.status,
        userId: documentDto.userId,
      },
    });
  }

  // -- GET DOCUMENT IN PROJECT --
  async getDocumentsInProject(projectId: string) {
    // Check exist project

    return await this.prisma.project_documents.findMany({
      where: { projectId: projectId },
      omit: {
        projectId: true,
        userId: true,
      },
    });
  }

  // -- GET ALL DOCUMENTS --
  async getAllDocuments(userId: string) {
    return await this.prisma.project_documents.findMany({
      where: {
        userId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            isArchived: true,
          },
        },
      },
    });
  }

  // -- GET DOCUMENT DETAIL --
  async getDocumentDetail(userId: string, id: string) {
    return await this.prisma.project_documents.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            isArchived: true,
          },
        },
      },
    });
  }

  // -- UPDATE DOCUMENT --
  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto) {
    return await this.prisma.project_documents.update({
      where: { id: id },
      data: {
        name: updateDocumentDto.name,
      },
    });
  }
  // -- UPDATE DOCUMENT STATUS --
  async updateDocumentStatus(id: string, status: string) {
    // Validate status
    if (!['processing', 'done', 'error'].includes(status)) {
      throw new Error('Invalid status value');
    }

    return await this.prisma.project_documents.update({
      where: { id: id },
      data: {
        status: status,
      },
    });
  }
}

```

### src\document\dto\create-document.dto.ts

```ts
import {
  IsDate,
  IsEnum,
  IsInt,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccessLevelDoc } from '../../constant/index.constant';

export class CreateDocumentDto {
  @IsString({ message: 'projectId must be a string' })
  projectId: string;

  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsString({ message: 'filePath must be a string' })
  filePath: string;

  @IsString({ message: 'originalFileName must be a string' })
  mimeType?: string;

  @IsInt({ message: 'size must be an integer' })
  size?: number;

  @IsString({ message: 'status must be a string' })
  status: string;

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

  metadata?: any;

  @IsDate({ message: 'indexedAt must be a valid date' })
  indexedAt?: Date;

  @IsInt({ message: 'viewCount must be an integer' })
  viewCount: number;
}

```

### src\document\dto\update-document.dto.ts

```ts
export class UpdateDocumentDto {
  name?: string;
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
