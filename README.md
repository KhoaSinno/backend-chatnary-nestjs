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

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Chatnary** is an advanced Retrieval-Augmented Generation (RAG) backend system designed to process documents, embed them into vector space, and provide powerful chat capabilities with or without history.

### Key Highlights

- 📊 **Intelligent Document Management** - Monitor documents, ingest new docs, and CRUD documents safety
- 🎯 **AI-Powered Search & Q&A** - Semantic with related to docs,
- 💰 **Role-based Access Control** - Support admin/student/teacher roles
- 🤖 **AI assistants** - Support AI assistants
- 🔐 **Secure & Scalable** - Built with enterprise-grade NestJS framework
- 📱 **RESTful API** - Clean, well-documented REST endpoints
- 🚀 **Production Ready** - Error handling, logging, and monitoring built-in

---

## ✨ Features

### 🔥 Core RAG Features

- **Chat (no history)**
  - Direct single-turn chat with the RAG pipeline.

- **Chat with history**
  - Multi-turn conversations stored in DB.

- **Automatic Ingest Pipeline**
  Upload any file → Backend automatically:

  1. Detects if file is scanned
  2. Performs OCR `Tesseract.js`
  3. Extracts text
  4. Chunks the text
  5. Embeds using OpenAI
  6. Stores vectors in pgvector

- **Semantic Retrieval**

  - KNN search via pgvector
  - [*] Hybrid search-ready

---

### 📁 Project & File Management

- **Project CRUD**
  - Similar ChatGPT Project function

- **File CRUD**
- Per-project isolation (documents, chats, embeddings)

---

### 🧰 Technical Features

- ✅ **Input Validation** - Comprehensive DTO validation with class-validator
- ✅ **Error Handling** - Global exception filter with consistent error responses
- ✅ **Request Logging** - Detailed HTTP request/response logging
- ✅ **API Documentation** - Interactive Swagger/OpenAPI documentation with full schema
- ✅ **Health Monitoring - PM2** - Health check endpoints for monitoring
- ✅ **CORS Support** - Configured for cross-origin requests
- ✅ **Type Safety - Prisma ORM** - ORM management with any DB
- ✅ **Database Abstraction/pgvector vector** - Interface-based database layer for easy swapping
- ✅ **Swagger documentation** - Visualize api document for FE
- ✅ **File-based storage + DB metadata** - `multer` package to handle Object storage server
- ✅ **Docker** - Build image so super lightweight
<!-- - ✅ **Walrus Integration** - Decentralized storage with collection management -->

---

## 🛠 Tech Stack

### Core Components

- **NestJS 11**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL + pgvector**
- **LangChainJS**
- **Docker**

### Document Processing

- Tesseract OCR or Gemini Vision (selectable)
- LangChain Recursive Character Splitter

### Documentation api

- **[Swagger/OpenAPI](https://swagger.io/)** - API documentation
- **[swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)** - Swagger UI

### Embeddings

- OpenAI (text-embedding-3)

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
 ├── project/        # Workspace CRUD
 ├── document/       # Upload, OCR, ingest
 ├── chat/           # Chat + history
 ├── llm/             # Retrieval + LangChain pipeline
 ├── pipeline/       # Ingest & chat pipelines
 ├── database/        # PrismaModule + Service
 ├── common/          # Filters, DTOs, utils
 └── main.ts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.x
- **pnpm** >= 9.x (or npm/yarn)

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

```bash
// copy .env.example => .env
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

### 6. Connect pgAdmin

``` bash
Host name/address: chatnary-db
Port: 5432
Maintenance database: api
Username: ChatnarySYS
Password: 123123
```

---

## 📚 API Documentation

Swagger UI available at:

```
http://localhost:3000/api/docs
```

Includes:

- DTO schemas
- Request/response examples
- Try-it-out
- Endpoints fully documented

---

## 📁 Project Structure

```
Chatnary-backend/
├── src/
│   ├── chats/
│   ├── documents/
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
| POST   | `/api/documents/upload?projectId=...` |
| GET    | `/api/documents/:id`                  |
| DELETE | `/api/documents/:id`                  |
| GET    | `/api/projects/:id/documents`         |

> Upload triggers auto ingest.

---

## 🚢 Deployment

### 🐳 Docker Compose (lightweight)

`docker-compose.dev.yml`

```yaml
services:
  api:
    container_name: chatnary-api-dev
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - .:/app # sync code
      - /app/node_modules # prevent overwrite
      - ./uploads:/app/uploads
    env_file: .env
    depends_on:
      - db
    networks:
      - app-net

  db:
    image: pgvector/pgvector:pg16
    container_name: chatnary-db
    environment:
      POSTGRES_DB: api
      POSTGRES_USER: ChatnarySYS
      POSTGRES_PASSWORD: 123123
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - app-net

  pgadmin:
    image: dpage/pgadmin4
    container_name: chatnary-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@chatnary.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - app-net

networks:
  app-net:

volumes:
  db_data:
  pgadmin_data:

```

### 🐳 Dockerfile

`Dockerfile.dev`

```yaml
FROM node:22-alpine

WORKDIR /app

# Install GraphicsMagick for pdf2pic
RUN apk add --no-cache graphicsmagick ghostscript

RUN npm install -g pnpm

# Copy package + lock file
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (dev + prod)
RUN pnpm install

# Copy all source
COPY . .

# Expose NestJS port
EXPOSE 8000

# Dev mode: Hot reload
CMD ["pnpm", "start:dev"]


```

---

## 🔮 Roadmap

### ✅ Completed

- [x] **PostgreSQL Database Integration** - Vector db vs SQL DB with collection management
- [x] **Swagger Documentation** - Complete API documentation with schemas and examples
- [x] **Database Abstraction Layer** - Interface-based design for easy database swapping
- [x] **Error Handling** - Global exception filter with consistent responses
- [x] **Request Logging** - Comprehensive HTTP request/response logging
- [x] **Input Validation** - DTO-based validation with class-validator

### 🚧 In Progress

- [ ] SSE streaming for real-time ingest
- [ ] Hybrid search (BM25 + vector)
- [ ] Background job queue (BullMQ)
- [ ] Auth system (JWT)

### 📋 Coming Soon

- [ ] **Authentication & Authorization** - JWT-based auth system
- [ ] **Blockchain Integration** - Smart contract interactions
- [ ] **WebSocket Support** - Real-time updates
- [ ] **Rate Limiting** - API protection
- [ ] **Caching Layer** - Performance optimization
- [ ] **CI/CD Pipeline** - Automated deployment
- [ ] **Database Migrations** - Schema versioning for Walrus collections

---

## 📞 Contact

- `ntakhoa.dev@gmail.com`
