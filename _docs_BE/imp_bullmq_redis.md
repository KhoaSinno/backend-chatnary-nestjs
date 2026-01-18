Chào bạn, tôi đã phân tích kỹ codebase `Chatnary` của bạn. Đây là một project có nền tảng tốt (NestJS, Prisma, PgVector). Tuy nhiên, đúng như bạn nhận định, nó đang gặp các vấn đề về **Blocking I/O** (khi ingest), **Manual State Management** (Chat history xử lý thủ công), và **Hardcoding**.

Dưới đây là bản kế hoạch **Refactoring toàn diện** và **Code triển khai mẫu** tập trung vào hiệu suất (BullMQ), kiến trúc sạch (Clean Architecture) và tận dụng sức mạnh của LangChain (Runnable, Memory).

---

### 🏛️ PHẦN 1: KẾ HOẠCH REFACTOR & KIẾN TRÚC MỚI

#### 1. Thay đổi Kiến trúc Database (DB Schema)

Để tối ưu hóa truy vấn và hỗ trợ LangChain Memory tốt hơn, chúng ta cần tách biệt rõ ràng giữa `Session` (Cuộc hội thoại) và `Message` (Tin nhắn).

- **Hiện tại:** Có vẻ bạn đang lưu `messages` dạng JSON trong bảng `Chats`. Điều này khó query, khó search và không tối ưu khi hội thoại dài.
- **Refactor:** Tách thành bảng `ChatSession` và `ChatMessage` riêng biệt.
- **Tối ưu:** Thêm Index cho `sessionId` và `createdAt`.

#### 2. Kiến trúc Xử lý Bất đồng bộ (Async Processing with BullMQ)

Hiện tại luồng Upload -> LlamaParse -> Embed đang chạy **Synchronous** (đồng bộ). Nếu file lớn, API sẽ timeout hoặc block event loop.

- **Giải pháp:**
- API chỉ nhận file, lưu tạm, bắn job vào `BullMQ` và trả về `JobId` ngay lập tức.
- **Worker** sẽ chạy ngầm: Tải file -> LlamaParse -> Split -> Embed -> Save Vector DB.
- User có thể poll trạng thái qua `JobId` hoặc qua socket.

#### 3. Tận dụng LangChain Runnable & Memory

Thay vì cộng chuỗi thủ công (`createFinalInputLlm` cũ), ta sẽ dùng **LCEL (LangChain Expression Language)**.

- Sử dụng `RunnableWithMessageHistory`: Tự động inject lịch sử chat từ DB vào Prompt.
- Tự viết `PrismaChatMessageHistory`: Một class Adapter để LangChain tự động `saveContext` và `loadContext` từ Prisma DB của bạn.

---

### 💻 PHẦN 2: TRIỂN KHAI CHI TIẾT (CODE)

#### 1. Refactor Database (Prisma Schema)

Thêm các bảng mới và Index để tối ưu tốc độ đọc/ghi lịch sử.

_File: `prisma/schema.prisma_`

```prisma
// ... Các phần config datasource giữ nguyên

// Thêm Enum trạng thái xử lý document cho Queue
enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model Documents {
  id            String           @id @default(uuid())
  // ... các field cũ
  status        ProcessingStatus @default(PENDING) // Đổi từ String sang Enum
  errorMessage  String?          // Lưu lỗi nếu Ingest thất bại
  // ...
}

// Tách Message ra khỏi Chat session để query nhanh hơn và support Streaming tốt hơn
model ChatSession {
  id        String        @id @default(uuid())
  userId    String
  projectId String?
  title     String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  messages  ChatMessage[]

  @@index([userId])
}

model ChatMessage {
  id        String      @id @default(uuid())
  sessionId String
  role      String      // 'user' | 'assistant' | 'system'
  content   String      @db.Text
  metadata  Json?       // Lưu citations, token usage...
  createdAt DateTime    @default(now())

  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt]) // Index quan trọng để load history theo thứ tự
}

```

---

#### 2. Tích hợp BullMQ (Ingestion Worker)

Tách logic xử lý nặng ra khỏi `DocumentService`.

_Cài đặt:_ `npm install @nestjs/bull bull`

_File: `src/ingest/ingest.processor.ts` (Tạo mới)_

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessingStatus } from '@prisma/client';

@Processor('ingest-queue')
export class IngestProcessor {
  private readonly logger = new Logger(IngestProcessor.name);

  constructor(
    private readonly ingestService: IngestService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('process-document')
  async handleIngest(
    job: Job<{
      fileId: string;
      filePath: string;
      userId: string;
      projectId?: string;
    }>,
  ) {
    const { fileId, filePath, userId, projectId } = job.data;

    this.logger.log(`🚀 Start processing job ${job.id} for file ${fileId}`);

    try {
      // 1. Update Status: PROCESSING
      await this.prisma.documents.update({
        where: { id: fileId },
        data: { status: ProcessingStatus.PROCESSING },
      });

      // 2. Gọi Logic Ingest cũ (Cloud loader -> Split -> Embed -> PGVector)
      const chunks = await this.ingestService.ingestDocument(
        filePath,
        fileId,
        userId,
        projectId,
      );

      // 3. Update Status: COMPLETED
      await this.prisma.documents.update({
        where: { id: fileId },
        data: {
          status: ProcessingStatus.COMPLETED,
          pageCount: 0, // Update logic đếm trang từ chunks nếu cần
        },
      });

      this.logger.log(
        `✅ Completed job ${job.id}. Processed ${chunks.length} chunks.`,
      );
    } catch (error) {
      this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);

      // 4. Update Status: FAILED
      await this.prisma.documents.update({
        where: { id: fileId },
        data: {
          status: ProcessingStatus.FAILED,
          errorMessage: error.message,
        },
      });
      throw error; // Để BullMQ biết job fail và có thể retry
    }
  }
}
```

_Refactor `DocumentService.uploadFiles` để đẩy vào Queue:_

```typescript
// Trong DocumentService
constructor(
  @InjectQueue('ingest-queue') private ingestQueue: Queue, // Inject Queue
  // ...
) {}

async uploadFiles(userId: string, files: Express.Multer.File[], projectId?: string, metadata?: UploadMetadataDto) {
    for (const file of files) {
        // 1. Tạo bản ghi DB trước (Status = PENDING)
        const document = await this.createDocument({
           // ... (giữ nguyên logic mapping)
           status: ProcessingStatus.PENDING,
        });

        // 2. Đẩy job vào Queue (Trả về ngay lập tức, không await kết quả xử lý)
        await this.ingestQueue.add('process-document', {
            fileId: document.id,
            filePath: file.path,
            userId,
            projectId
        }, {
            attempts: 3, // Tự động retry 3 lần nếu lỗi
            backoff: 5000, // Đợi 5s trước khi retry
            removeOnComplete: true,
        });
    }
}

```

---

#### 3. Advanced Chat Service (LangChain Runnable & Memory)

Đây là phần **Clean Code** nhất. Chúng ta sẽ viết một Adapter để LangChain giao tiếp với Prisma.

_File: `src/chat/memory/prisma-history.store.ts` (Tạo mới)_

```typescript
import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { PrismaService } from '../../prisma/prisma.service';

// Class này giúp LangChain TỰ ĐỘNG save/load từ Prisma
export class PrismaChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ['chat', 'memory'];

  constructor(
    private readonly sessionId: string,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  // 1. Load messages từ DB -> Convert sang LangChain format
  async getMessages(): Promise<BaseMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId: this.sessionId },
      orderBy: { createdAt: 'asc' },
      // Lấy 20 tin nhắn gần nhất để tránh tràn Context Window
      take: 20,
    });

    return messages.map((msg) => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      if (msg.role === 'assistant') return new AIMessage(msg.content);
      return new SystemMessage(msg.content);
    });
  }

  // 2. Save message mới từ LLM/User vào DB
  async addMessage(message: BaseMessage): Promise<void> {
    let role = 'user';
    if (message instanceof AIMessage) role = 'assistant';
    if (message instanceof SystemMessage) role = 'system';

    await this.prisma.chatMessage.create({
      data: {
        sessionId: this.sessionId,
        role,
        content: message.content as string,
        // Có thể lưu thêm token usage từ message.response_metadata nếu cần
      },
    });
  }
}
```

_File: `src/chat/chat.service.ts` (Refactor toàn bộ)_

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaChatMessageHistory } from './memory/prisma-history.store';
import { RetrievalService } from '../retrieval/retrieval.service';

@Injectable()
export class ChatService {
  private llm: ChatOpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private retrievalService: RetrievalService,
  ) {
    // Config LLM từ env, không hardcode
    this.llm = new ChatOpenAI({
      modelName: this.config.get('GEMINI_MODEL') || 'gpt-4o',
      apiKey: this.config.get('OPENAI_API_KEY'),
      temperature: 0.3,
      streaming: true, // Bật streaming mặc định
    });
  }

  // --- CORE CHAIN FACTORY ---
  // Tạo Chain xử lý logic RAG
  private createRagChain() {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `Bạn là trợ lý AI thông minh. Hãy trả lời dựa trên context sau:
      {context}
      
      Nếu không có thông tin, hãy nói không biết.
      `,
      ],
      new MessagesPlaceholder('history'), // LangChain tự điền lịch sử vào đây
      ['human', '{input}'],
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    return new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: (sessionId) =>
        new PrismaChatMessageHistory(sessionId, this.prisma),
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    });
  }

  // --- 1. NORMAL RESPONSE (Block wait) ---
  async chatNormal(
    userId: string,
    sessionId: string,
    message: string,
    projectId: string,
  ) {
    // 1. Retrieve Context
    const contextDocs = await this.retrievalService.retrieveAndRerank(
      message,
      userId,
      projectId,
    );
    const contextText = contextDocs.map((d) => d.pageContent).join('\n\n');

    // 2. Invoke Chain
    const chain = this.createRagChain();

    // Configurable sessionId dùng để load/save history
    const response = await chain.invoke(
      { input: message, context: contextText },
      { configurable: { sessionId } },
    );

    return {
      answer: response,
      citations: contextDocs.map((d) => d.metadata), // Trả về citation
    };
  }

  // --- 2. STREAMING RESPONSE (SSE) ---
  async *chatStream(
    userId: string,
    sessionId: string,
    message: string,
    projectId: string,
  ) {
    // 1. Retrieve
    const contextDocs = await this.retrievalService.retrieveAndRerank(
      message,
      userId,
      projectId,
    );
    const contextText = contextDocs.map((d) => d.pageContent).join('\n\n');

    // Gửi event citations trước để FE hiển thị nguồn (Optional)
    yield JSON.stringify({
      type: 'citations',
      data: contextDocs.map((d) => d.metadata),
    });

    const chain = this.createRagChain();

    // 2. Stream
    const stream = await chain.stream(
      { input: message, context: contextText },
      { configurable: { sessionId } },
    );

    for await (const chunk of stream) {
      yield JSON.stringify({ type: 'content', data: chunk });
    }
  }
}
```

---

#### 4. Streaming Controller (Server-Sent Events)

_File: `src/chat/chat.controller.ts_`

```typescript
import { Controller, Post, Body, Res, Sse, MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // 1. Normal Request (Request - Response)
  @Post('message')
  async sendMessage(
    @Body()
    body: {
      sessionId: string;
      message: string;
      projectId: string;
      userId: string;
    },
  ) {
    return await this.chatService.chatNormal(
      body.userId,
      body.sessionId,
      body.message,
      body.projectId,
    );
  }

  // 2. Streaming Request (SSE)
  // Client sẽ dùng EventSource để kết nối tới endpoint này
  @Sse('stream')
  streamMessage(
    @Body()
    body: {
      sessionId: string;
      message: string;
      projectId: string;
      userId: string;
    },
  ): Observable<MessageEvent> {
    return new Observable((observer) => {
      (async () => {
        try {
          const stream = this.chatService.chatStream(
            body.userId,
            body.sessionId,
            body.message,
            body.projectId,
          );

          for await (const chunk of stream) {
            observer.next({ data: chunk });
          }
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }
}
```

---

### 📝 TỔNG KẾT CÁC CẢI TIẾN

1. **Hiệu suất (Performance):** Sử dụng `BullMQ` giúp API trả về ngay lập tức khi upload file, không bắt user chờ xử lý AI.
2. **Clean Code:**

- Tách biệt logic DB History vào `PrismaChatMessageHistory` (Adapter Pattern).
- Tách biệt logic AI Chain vào `createRagChain`.
- Không còn cộng chuỗi Prompt thủ công.

3. **Khả năng mở rộng:**

- Hỗ trợ cả Streaming và Normal response.
- Dễ dàng thay đổi LLM Model thông qua config (LangChain abstraction).

4. **Database Logic:** Schema Message/Session tách biệt giúp query history nhanh hơn và quản lý bộ nhớ (Context Window) tốt hơn (dùng `take: 20`).

Bạn có thể bắt đầu bằng việc cài đặt BullMQ và Redis, sau đó cập nhật `schema.prisma` và migrate DB. Chúc project của bạn thành công!
