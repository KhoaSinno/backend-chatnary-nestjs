# Chatnary RAG Backend API

<div align="center">

**A high-performance Retrieval-Augmented Generation backend built with NestJS + Prisma + pgvector**

[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs\&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript\&logoColor=white)]()
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma\&logoColor=white)]()
[![Postgres](https://img.shields.io/badge/Postgres-PGVector-336791?logo=postgresql\&logoColor=white)]()
[![License](https://img.shields.io/badge/License-UNLICENSED-red)]()

[API Documentation](#-api-documentation) • [Quick Start](#-quick-start) • [Architecture](#-architecture)

</div>

---

## 🎯 Overview

**Chatnary** is an advanced Retrieval-Augmented Generation backend system designed to process documents, embed them into vector space, and provide powerful chat capabilities with or without history.
It supports:

* Automated OCR → Chunk → Embedding → Vector upsert pipeline
* Project-based organization (like ChatGPT Workspaces)
* High-performance semantic retrieval with **pgvector**
* LangChainJS-powered pipelines
* Clean modular architecture built with NestJS + Prisma

This backend is ideal for:
📄 internal knowledge bases • 🔍 enterprise search • 🤖 AI assistants • 📚 document Q&A

---

## ✨ Features

### 🔥 Core RAG Features

* **Chat (no history)**
  Direct single-turn chat with the RAG pipeline.

* **Chat with history**
  Multi-turn conversations stored in DB.

* **Automatic Ingest Pipeline**
  Upload any file → Backend automatically:

  1. Detects if file is scanned
  2. Performs OCR (Tesseract / Gemini Vision)
  3. Extracts text
  4. Chunks the text
  5. Embeds using OpenAI/Cohere/Voyage
  6. Stores vectors in pgvector

* **Semantic Retrieval**

  * KNN search via pgvector
  * Hybrid search-ready (optional BM25)

---

### 📁 Project & File Management

* **Project CRUD** (similar to ChatGPT folders)
* **File CRUD**
* Per-project isolation (files, chats, embeddings)

---

### 🧰 Technical Features

* 🚀 NestJS modular architecture
* 🧠 Prisma ORM with PostgreSQL
* 🔎 pgvector vector search
* 📄 Swagger documentation
* ❇️ File-based storage + DB metadata
* ⚡ Docker (super lightweight)
* 📦 Clean Service + Controller separation
* 🧹 DTO validation via class-validator

---

## 🛠 Tech Stack

### Core Components

* **NestJS 11**
* **TypeScript**
* **Prisma ORM**
* **PostgreSQL + pgvector**
* **LangChainJS**

### Document Processing

* Tesseract OCR or Gemini Vision (selectable)
* LangChain Recursive Character Splitter

### Embeddings

* ❗ Choose your provider:

  * OpenAI (text-embedding-3)
  * Cohere (multilingual)
  * Voyage AI
  * Local model (optional)

---

## 🏗 Architecture

### High-Level Overview

```
┌─────────────────────┐
│      Client App      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│     NestJS Backend      │
│  (Controllers/Services) │
└──────────┬──────────────┘
           │
           ▼
┌────────────────────────────┐
│       RAG Pipeline         │
│ OCR → Chunk → Embed → Vec  │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ PostgreSQL + PGVector      │
│ Files | Chunks | Embedding │
└────────────────────────────┘
```

---

## 🧬 Module Structure

```
src/
 ├── projects/        # Workspace CRUD
 ├── files/           # Upload, OCR, ingest
 ├── chats/           # Chat + history
 ├── rag/             # Retrieval + LangChain pipeline
 ├── pipelines/       # Ingest & chat pipelines
 ├── database/        # PrismaModule + Service
 ├── common/          # Filters, DTOs, utils
 ├── storage/         # Uploaded files
 └── main.ts
```

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <your-repo>
cd Chatnary-backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

`.env`

```env
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/Chatnary"

# Embedding
EMBED_PROVIDER=openai
OPENAI_API_KEY=sk-...

# OCR
OCR_PROVIDER=tesseract
```

---

### 4. Setup Database

```bash
pnpm prisma migrate dev
```

---

### 5. Start Dev Server

```bash
pnpm start:dev
```

---

## 📚 API Documentation

Swagger UI available at:

```
http://localhost:3000/api/docs
```

Includes:

* DTO schemas
* Request/response examples
* Try-it-out
* Endpoints fully documented

---

## 📁 Project Structure

```
Chatnary-backend/
├── src/
│   ├── chats/
│   ├── files/
│   ├── projects/
│   ├── rag/
│   ├── pipelines/
│   ├── database/
│   ├── common/
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── storage/uploads/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 💬 Endpoint Overview

### 🔹 Chat

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| POST   | `/api/chat/direct`        | Chat without history |
| POST   | `/api/chats`              | Create chat session  |
| POST   | `/api/chats/:id/messages` | Add message to chat  |
| GET    | `/api/chats/:projectId`   | List chats           |

---

### 🔹 Projects

| Method | Endpoint            |
| ------ | ------------------- |
| POST   | `/api/projects`     |
| GET    | `/api/projects`     |
| PATCH  | `/api/projects/:id` |
| DELETE | `/api/projects/:id` |

---

### 🔹 Files

| Method | Endpoint                          |
| ------ | --------------------------------- |
| POST   | `/api/files/upload?projectId=...` |
| GET    | `/api/files/:id`                  |
| DELETE | `/api/files/:id`                  |
| GET    | `/api/projects/:id/files`         |

> Upload triggers auto ingest.

---

## 🚢 Deployment

### 🐳 Docker Compose (lightweight)

`docker-compose.yml`

```yaml
version: "3.9"
services:
  api:
    build: .
    env_file: .env
    ports:
      - "8000:3000"
    volumes:
      - ./storage/uploads:/app/storage/uploads
    depends_on:
      - db

  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 🔮 Roadmap

* [ ] SSE streaming for real-time ingest
* [ ] Hybrid search (BM25 + vector)
* [ ] Background job queue (BullMQ)
* [ ] Rate limiting
* [ ] Auth system (JWT)

---

## 📞 Support

* Open a GitHub issue
* Contact the dev team

---

If bạn muốn, mình có thể tiếp tục:

✅ Tạo toàn bộ **folder + files** theo README
✅ Generate **NestJS skeleton** hoàn chỉnh
✅ Thêm swagger decorators
✅ Viết sample controller + service
✅ Viết Dockerfile tối ưu 50MB

Bạn có muốn mình **xuất toàn bộ project template (code đầy đủ)** không?
