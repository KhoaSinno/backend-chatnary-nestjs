# 📘 Chatnary Backend API Endpoints

*(NestJS · Prisma · PGVector · LangChainJS)*

## Base URL

```
http://localhost:9000
```

---

# 🏠 Root

### **GET** `/`

* Welcome message

---

# ❤️ Health Check

## Basic Health Check

### **GET** `/health`

**Response**

```json
{
  "status": "ok",
  "timestamp": "2025-11-09T06:45:18.888Z",
  "uptime": 2.958539,
  "environment": "development",
  "version": "1.0.0"
}
```

## Detailed Health Check

### **GET** `/health/detailed`

**Response**

```json
{
  "status": "ok",
  "timestamp": "2025-11-09T06:45:19.374Z",
  "uptime": 3.444321,
  "environment": "development",
  "version": "1.0.0",
  "memory": {
    "used": 25.32,
    "total": 51.84,
    "unit": "MB"
  },
  "cpu": {
    "user": 366829,
    "system": 110151
  }
}
```

---

# 📁 Projects

*(Giống ChatGPT workspace — quản lý không gian dự án)*

## Create Project

### **POST** `/api/projects`

**Body**

```json
{
  "name": "My Workspace",
  "description": "Optional description",
  "color": "#4A90E2"
}
```

## List Projects

### **GET** `/api/projects`

## Update Project

### **PATCH** `/api/projects/:id`

**Body**

```json
{
  "name": "New Name",
  "description": "Updated description",
  "color": "#FF9900"
}
```

## Delete Project

### **DELETE** `/api/projects/:id`

---

# 📄 Documents

*(Upload → OCR → Chunk → Embed → Vector Store)*

## Upload File (Auto Ingest)

### **POST** `/api/documents/upload?projectId=<id>`

* Multipart form-data:

  * `document`: the document to upload
* Triggers:

  * Detect scanned PDF/image
  * OCR → text
  * Chunk → embeddings
  * Upsert pgvector

**Response**

```json
{
  "is_success": true,
  "data": {
    "fileId": "uuid",
    "status": "ingesting"
  }
}
```

## Get File Metadata

### **GET** `/api/documents/:id`

## Delete File

### **DELETE** `/api/documents/:id`

## List Documents in Project

### **GET** `/api/projects/:id/documents`

---

# 🧠 Chat (No History)

## Direct Chat

### **POST** `/api/chat/direct`

**Body**

```json
{
  "projectId": "string",
  "message": "Explain this document..."
}
```

**Response**

```json
{
  "is_success": true,
  "data": {
    "answer": "The document explains..."
  }
}
```

---

# 💬 Chat (With History)

## Create Chat Session

### **POST** `/api/chats`

**Body**

```json
{
  "projectId": "string",
  "title": "Research Notes"
}
```

## List Chats in Project

### **GET** `/api/chats?projectId=<id>`

## Send Message (History-based RAG)

### **POST** `/api/chats/:chatId/messages`

**Body**

```json
{
  "message": "What does section 3 mean?"
}
```

## Get Chat Messages

### **GET** `/api/chats/:chatId/messages`

---

# 📦 Embedding & Ingest (Internal but usable)

## Manual Re-Ingest File

### **POST** `/api/documents/:id/reingest`

---

# 📙 Response Format

## Success Response

```json
{
  "is_success": true,
  "data": {
    // payload
  }
}
```

## Error Response

```json
{
  "is_success": false,
  "error": "Error message"
}
```

## Validation Error

```json
{
  "message": ["field should not be empty"],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

# 📢 Status Codes

* `200` — Success
* `400` — Bad Request
* `404` — Not Found
* `500` — Internal Server Error
