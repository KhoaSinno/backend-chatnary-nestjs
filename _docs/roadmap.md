# ✅ **Mục tiêu hệ thống**

* RAG backend đơn giản – *tối ưu*, dễ scale
* Prisma ORM (không dùng TypeORM)
* API sạch, dễ mở rộng version sau
* Ingest tự động khi upload file (OCR nếu cần)
* CRUD Project giống ChatGPT Workspace
* CRUD File + embedding pipeline
* Chat có và không có history

---

# 🏗️ **PHẦN 1 — Cấu trúc thư mục NestJS tối ưu**

**Đây là kiến trúc chính thức, đã được tinh gọn cho RAG + Prisma + Ingest + Chat.**

```
src/
 ├── app.module.ts
 │
 ├── common/
 │    ├── dto/
 │    ├── utils/
 │    └── filters/
 │
 ├── database/
 │    ├── prisma.service.ts
 │    └── prisma.module.ts
 │
 ├── projects/
 │    ├── projects.module.ts
 │    ├── projects.controller.ts
 │    ├── projects.service.ts
 │    └── dto/
 │
 ├── files/
 │    ├── files.module.ts
 │    ├── files.controller.ts
 │    ├── files.service.ts
 │    ├── file-storage.service.ts     # Lưu file disk
 │    ├── file-ocr.service.ts         # OCR nhận dạng scanned
 │    ├── file-ingest.service.ts      # Chunk → Embed → Upsert vector
 │    └── dto/
 │
 ├── chats/
 │    ├── chats.module.ts
 │    ├── chats.controller.ts
 │    ├── chats.service.ts
 │    ├── chats-history.service.ts    # Chat with history
 │    ├── chats-direct.service.ts     # Chat none-history
 │    └── dto/
 │
 ├── rag/
 │    ├── rag.module.ts
 │    ├── rag.service.ts              # Retrieval + LangChainJS
 │    ├── vector-store.service.ts     # pgvector search
 │    ├── embed.service.ts            # Embedding OpenAI/Cohere
 │    └── chunk.service.ts            # Text splitter
 │
 ├── pipelines/
 │    ├── ingest.pipeline.ts          # upload → ocr → chunk → embed → upsert
 │    └── chat.pipeline.ts            # query → retrieve → llm → format
 │
 ├── storage/
 │    └── uploads/                    # <projectId>/<fileId>_filename.ext
 │
 └── main.ts
```

---

# 🧠 **PHẦN 2 — Prisma schema chuẩn cho 6 tính năng**

### `prisma/schema.prisma`

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  files       File[]
  chats       Chat[]
}

model File {
  id            String   @id @default(uuid())
  projectId     String
  originalName  String
  mimeType      String
  size          Int
  text          String?        // after OCR or extract
  embeddingDone Boolean @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id])
  chunks  Chunk[]
}

model Chunk {
  id       String   @id @default(uuid())
  fileId   String
  index    Int
  content  String
  embedding Float[] @db.Vector(1536)

  file File @relation(fields: [fileId], references: [id])
}

model Chat {
  id        String   @id @default(uuid())
  projectId String
  title     String?
  createdAt DateTime @default(now())

  project  Project @relation(fields: [projectId], references: [id])
  messages Message[]
}

model Message {
  id        String   @id @default(uuid())
  chatId    String
  role      String // user/assistant/system
  content   String
  createdAt DateTime @default(now())

  chat Chat @relation(fields: [chatId], references: [id])
}
```

---

# 🤖 **PHẦN 3 — Các module & API endpoints**

## 1) **Chat without history**

```
POST /api/chat/direct
↓
ragService.answer(question)
```

## 2) **Chat with history**

```
POST /api/chats/:chatId/messages
POST /api/chats (tạo chat mới)
GET  /api/chats/:projectId
```

---

## 3) **Upload file → ingest auto**

```
POST /api/files/upload?projectId=xxx
  → fileStorage.save()
  → fileOcr.detectScanned()
  → fileOcr.extractText()
  → chunkService.split()
  → embedService.embedChunks()
  → vectorStore.upsert()
```

---

## 4) **CRUD File**

```
GET /api/files/:id
DELETE /api/files/:id
GET /api/projects/:id/files
```

---

## 5) **CRUD Project (giống ChatGPT workspace)**

```
POST /api/projects
GET  /api/projects
PATCH /api/projects/:id
DELETE /api/projects/:id
```

---

# ⚙️ **PHẦN 4 — Docker Compose Version (siêu nhẹ)**

### 📦 `docker-compose.yml`

```yaml
version: "3.9"

services:
  api:
    build: .
    container_name: rag-nest-api
    env_file: .env
    ports:
      - "8000:3000"
    depends_on:
      - db
    volumes:
      - ./storage/uploads:/app/storage/uploads

  db:
    image: postgres:16-alpine
    container_name: pgvector-db
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    command: |
      sh -c "postgres -c shared_preload_libraries=pgvector"

volumes:
  pgdata:
```

**Nhẹ vì:**

* Postgres dùng alpine
* Node chỉ chạy API
* Không dùng queue nặng (BullMQ tùy chọn thêm)

---

# 🌊 **PHẦN 5 — Ingest Pipeline (upload là chạy luôn)**

### `ingest.pipeline.ts`

```ts
@Injectable()
export class IngestPipeline {
  constructor(
    private ocr: FileOcrService,
    private chunker: ChunkService,
    private embed: EmbedService,
    private vector: VectorStoreService,
    private prisma: PrismaService,
  ) {}

  async run(fileRecord: File) {
    // 1. Extract text or OCR
    const raw = await this.ocr.extract(fileRecord);

    // 2. Chunk
    const chunks = await this.chunker.split(raw);

    // 3. Embed
    const vectors = await this.embed.batchEmbed(chunks);

    // 4. Upsert
    await this.vector.upsert(fileRecord.id, vectors);

    // 5. Save state
    await this.prisma.file.update({
      where: { id: fileRecord.id },
      data: { embeddingDone: true, text: raw },
    });
  }
}
```

---

# 💬 **PHẦN 6 — Nếu thiếu gì thì hỏi**

Hiện mình cần bạn xác nhận 3 điều để xuất **FULL CODE skeleton**:

### **1️⃣ Bạn muốn dùng dịch vụ embedding nào?**

* OpenAI (text-embedding-3-large / small)
* Cohere (multilingual tốt tiếng Việt)
* Voyage AI
* Local model (nếu dùng)

### **2️⃣ OCR bạn muốn:**

* Tesseract local
* Google OCR
* Gemini OCR (Vision)
* Không cần OCR

### **3️⃣ Chat LLM bạn muốn dùng:**

* OpenAI GPT-4o / mini
* Gemini 1.5
* Groq + Llama3
* DeepSeek

---

# 👉 Hãy trả lời 3 câu trên

Mình sẽ generate **toàn bộ project NestJS scaffold** cho bạn (copy chạy ngay), gồm:

* 50+ file NestJS hoàn chỉnh
* Prisma schema + migrations
* Docker Compose
* Full routers
* Services
* Pipelines
* RagService với LangChainJS
* Auto-ingest pipeline hoạt động ngay

Chỉ cần bạn trả lời 3 câu đó.
