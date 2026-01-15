# 📘 Chatnary Backend API Endpoints

_(NestJS · Prisma · PGVector · LangChainJS)_

## Base URL

```
http://localhost:8080/api/v1
```

---

# 🏠 Root

### **GET** `/docs`

- API documents Backend

---

# 🔑 Authentication

## Register

### **POST** `/auth/register`

**Body**

```json
{
  "email": "user1@example.com",
  "password": "123456"
}
```

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "message": "User registered successfully"
  }
}

// Error
{
  "statusCode": 403,
  "success": false,
  "message": {
    "message": "User already exists",
    "error": "Forbidden",
    "statusCode": 403
  },
  "timestamp": "2025-12-13T08:34:50.308Z",
  "path": "/api/v1/auth/register"
}
```

## Login

### **POST** `/auth/login`

**Body**

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY1NTk5ODYyLCJleHAiOjE3NjU2MDA3NjJ9.OlDUVXNx2FNlF7g7ldbuiHFFueiexPW6dvSj0jIQNsM",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY1NTk5ODYyLCJleHAiOjE3NjYyMDQ2NjJ9.tiCXjCNmMOrzdZYKmgoEXQvgFvViZAWd8IhFn8bIYIE",
    "user": {
      "id": "bbe027d0-74ea-4630-a846-5040a9772d19",
      "email": "admin@example.com",
      "username": "admin",
      "name": "Administrator",
      "refreshToken": "$2b$10$L/FBJkavJpoQMrz3dgjg7.MdglrEahBl6dS77syc.P08fkXyHjGuu",
      "role": "ADMIN"
    }
  }
}

// Error
{
  "statusCode": 500,
  "success": false,
  "message": "Invalid credentials",
  "timestamp": "2025-12-13T08:58:05.663Z",
  "path": "/api/v1/auth/login"
}
```

## Refresh token

### **POST** `/auth/refresh`

**Headers(Bearer header)**
authentication = Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1NDQzMTE5LCJleHAiOjE3NjYwNDc5MTl9.0QkgBkk39vVfY1vUWNDB57Rk3eQ0VSz_cnRibutD_Ro

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1NDQzMTE5LCJleHAiOjE3NjU0NDQwMTl9.822N8k9AZQ5Yk3KT1gwd-NI77ujFDFd7TjR_yainwQk",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1NDQzMTE5LCJleHAiOjE3NjYwNDc5MTl9.0QkgBkk39vVfY1vUWNDB57Rk3eQ0VSz_cnRibutD_Ro"
  }
}

// Error
{
  "statusCode": 403,
  "success": false,
  "message": {
    "message": "Access Denied",
    "error": "Forbidden",
    "statusCode": 403
  },
  "timestamp": "2025-12-13T09:00:00.471Z",
  "path": "/api/v1/auth/refresh"
}
```

## Logout

### **POST** `/auth/logout`

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "message": "User logged out successfully"
  }
}
```

# 📁 Projects

_(Giống ChatGPT workspace — quản lý không gian dự án)_

## Create Project

### **POST** `/project`

**Body**

```json
{
  "name": "Sinoo khung bo",
  "description": "Desc ...",
  "color": "#3B82F6",
  "isArchived": false
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": "0c08f09e-f996-454c-a9b0-055c35658fea",
    "name": "Sinoo khung bo",
    "description": "Desc ...",
    "color": "#3B82F6",
    "isArchived": false,
    "createdAt": "2025-12-25T05:33:54.970Z",
    "updatedAt": "2025-12-25T05:33:54.970Z"
  }
}
```

## List Projects by user

### **GET** `/project`

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "cf3ad296-3044-451f-84db-9fc99c9e327d",
      "name": "AI Văn Bản",
      "description": "Project dùng để test RAG + OCR",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-23T16:52:10.813Z",
      "updatedAt": "2025-12-23T16:52:10.813Z"
    },
    {
      "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
      "name": "Thư Viện Số",
      "description": "Project số hóa tài liệu PDF",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-23T16:52:10.972Z",
      "updatedAt": "2025-12-23T16:52:10.972Z"
    },
    {
      "id": "0c08f09e-f996-454c-a9b0-055c35658fea",
      "name": "Sinoo khung bo",
      "description": "Desc ...",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-25T05:33:54.970Z",
      "updatedAt": "2025-12-25T05:33:54.970Z"
    }
  ]
}
```

## Update Project

### **PATCH** `/project/:projectId`

**Param**
projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Body**

```json
// some fields:  name, description, color, isArchived
{
  "name": "Sinoo khung bo 1101"
  // ... some fields to update
}
```

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "eae33420-8426-4f3e-b055-d4afeefad60b",
    "name": "Sinoo khung bo 1101",
    "description": "Desc ...",
    "color": "#3B82F6",
    "isArchived": false,
    "createdAt": "2025-12-08T15:48:49.375Z",
    "updatedAt": "2025-12-08T15:53:24.488Z",
    "userId": "bbe027d0-74ea-4630-a846-5040a9772d19"
  }
}
```

## Delete Project

### **DELETE** `/project/:projectId`

**Param**
projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "8a4457cd-9c0d-4346-a88e-16b0b1aed99e",
      "name": "MGHP HK1(2025-2026).pdf",
      "filePath": "uploads\\documents\\1765080486331-485462277.pdf",
      "mimeType": "application/pdf",
      "size": 2751843,
      "status": "done",
      "createdAt": "2025-12-07T04:08:06.354Z"
    }
  ]
}
```

## List Chats in Project

### **GET** `/project/:projectId/chats`

**Param**:
projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "1d86b1ef-f248-420b-9413-21747c92bd9c",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:54:02.583Z",
      "updatedAt": "2025-12-25T06:54:05.592Z"
    },
    {
      "id": "62dc4be3-deeb-4360-bf90-c6613efaea4a",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:52:14.196Z",
      "updatedAt": "2025-12-25T06:52:16.691Z"
    },
    {
      "id": "3538ea80-e655-45e2-ad7a-5952871e1f2c",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:44:56.699Z",
      "updatedAt": "2025-12-25T06:45:04.120Z"
    },
    {
      "id": "84cf2155-4fde-4f61-ae96-21a9f113bc85",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:44:08.271Z",
      "updatedAt": "2025-12-25T06:44:11.607Z"
    },
    {
      "id": "e2c71722-deea-4568-ad41-e385493ab389",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:43:52.259Z",
      "updatedAt": "2025-12-25T06:43:54.114Z"
    }
  ]
}
```

## List Documents in Project

### **GET** `/project/:projectId/documents`

**Param**: projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "addedAt": "2025-12-25T06:42:10.797Z",
      "isSelected": true,
      "linkId": "bcc2b031-8d14-4fe2-9b66-190090faa263",
      "id": "b75e74c0-58a1-4d11-ba67-3842e938211e",
      "title": "MGHP HK1(2025-2026).pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "MGHP HK1(2025-2026).pdf",
      "filePath": "uploads\\documents\\1766638685745-591043014.pdf",
      "mimeType": "application/pdf",
      "size": 2751843,
      "pageCount": 0,
      "status": "done",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T04:58:05.759Z",
      "updatedAt": "2025-12-25T04:58:16.140Z"
    },
    {
      "addedAt": "2025-12-25T06:42:10.797Z",
      "isSelected": true,
      "linkId": "1169513b-68b6-44dd-9c62-8802e1a99ae3",
      "id": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
      "title": "LV_CTUET_ThinhNhat.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "LV_CTUET_ThinhNhat.pdf",
      "filePath": "uploads\\documents\\1766638903777-216667186.pdf",
      "mimeType": "application/pdf",
      "size": 2743322,
      "pageCount": 0,
      "status": "done",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T05:01:43.787Z",
      "updatedAt": "2025-12-25T05:01:58.145Z"
    },
    {
      "addedAt": "2025-12-23T17:06:25.989Z",
      "isSelected": true,
      "linkId": "866d7528-48f0-4a8b-9594-680f4551c0b4",
      "id": "1c375418-270c-4a60-ac88-13aa5fb885f9",
      "title": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "filePath": "uploads\\documents\\1766509585247-333190162.pdf",
      "mimeType": "application/pdf",
      "size": 39998,
      "pageCount": 0,
      "status": "done",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-23T17:06:25.897Z",
      "updatedAt": "2025-12-23T17:06:30.157Z"
    }
  ]
}
```

## Add documents to Project

### **POST** `/project/:projectId/documents`

**Param**
projectId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Body**

```json
{
  "documentIds": [
    "7dba30eb-d4d3-4bc4-bcd3-96ccd3ef49d4",
    "8a4457cd-9c0d-4346-a88e-16b0b1aed99e"
  ]
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "count": 1
  }
}
```

## Remove documents from Project

### **DELETE** `/project/:projectId/documents/unlink`

**Param**
projectId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Body**

```json
{
  "documentIds": [
    "7dba30eb-d4d3-4bc4-bcd3-96ccd3ef49d4",
    "8a4457cd-9c0d-4346-a88e-16b0b1aed99e"
  ]
}
```

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "count": 1
  }
}
```

---

# 📄 Documents

## Access static file

`http://localhost:8000/uploads/documents/1765080486331-485462277.pdf`

## Upload Document (Auto Ingest)

### **POST** `/document/upload/files`

**Headers**: Content-Type: multipart/form-data

**Mulit-Part (Body)**

```json
// multi part
{
  "files": "File[]",// multi-part... from form input
  "data": //Chuỗi JSON String. FE cần JSON.stringify(metadataObj) trước khi gửi.
}

// "data" exmaple
// {
//   "projectId": "eae33420-8426-4f3e-b055-d4afeefad60b", // Nếu muốn nằm ở trong project và muốn thêm file sau đó nó sẽ tự link
//   "title": "Tên hiển thị (Optional)",
//   "description": "Mô tả ngắn",
//   "authors": ["Tác giả A", "Tác giả B"],
//   "tags": ["Tag1", "Tag2"],
//   "subjects": ["Chủ đề 1"],
//   "publishedYear": 2024,
//   "accessLevel": "PRIVATE"  // hoặc "PUBLIC", "RESTRICTED"
// }

// FE phải stringify object này trước khi gửi
// formData.append('data', JSON.stringify(metadata));

```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": [
    {
      "url": "/uploads/documents/1764829198418-674679539.pdf"
    }
  ]
}
```

## Get All Document by user

### **GET** `/document`

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "1c375418-270c-4a60-ac88-13aa5fb885f9",
      "title": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "filePath": "uploads\\documents\\1766509585247-333190162.pdf",
      "mimeType": "application/pdf",
      "size": 39998,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-23T17:06:25.897Z",
      "updatedAt": "2025-12-23T17:06:30.157Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "866d7528-48f0-4a8b-9594-680f4551c0b4",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
          "isSelected": true,
          "addedAt": "2025-12-23T17:06:25.989Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    },
    {
      "id": "b75e74c0-58a1-4d11-ba67-3842e938211e",
      "title": "MGHP HK1(2025-2026).pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "MGHP HK1(2025-2026).pdf",
      "filePath": "uploads\\documents\\1766638685745-591043014.pdf",
      "mimeType": "application/pdf",
      "size": 2751843,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T04:58:05.759Z",
      "updatedAt": "2025-12-25T04:58:16.140Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "bcc2b031-8d14-4fe2-9b66-190090faa263",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "b75e74c0-58a1-4d11-ba67-3842e938211e",
          "isSelected": true,
          "addedAt": "2025-12-25T06:42:10.797Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    },
    {
      "id": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
      "title": "HTTT_CTDH_2022.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "HTTT_CTDH_2022.pdf",
      "filePath": "uploads\\documents\\1766638786657-7059145.pdf",
      "mimeType": "application/pdf",
      "size": 24305987,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T04:59:46.711Z",
      "updatedAt": "2025-12-25T05:01:02.794Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": []
    },
    {
      "id": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
      "title": "LV_CTUET_ThinhNhat.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "LV_CTUET_ThinhNhat.pdf",
      "filePath": "uploads\\documents\\1766638903777-216667186.pdf",
      "mimeType": "application/pdf",
      "size": 2743322,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T05:01:43.787Z",
      "updatedAt": "2025-12-25T05:01:58.145Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "1169513b-68b6-44dd-9c62-8802e1a99ae3",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
          "isSelected": true,
          "addedAt": "2025-12-25T06:42:10.797Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    },
    {
      "id": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
      "title": "Giáo trình AI",
      "description": "Demo upload",
      "authors": ["Teacher A"],
      "subjects": [],
      "tags": ["AI"],
      "documentType": "unknown",
      "publishedYear": 2024,
      "accessLevel": "PRIVATE",
      "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "filePath": "uploads\\documents\\1766670753505-891084681.pdf",
      "mimeType": "application/pdf",
      "size": 39998,
      "pageCount": 0,
      "status": "DONE",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T13:52:33.512Z",
      "updatedAt": "2025-12-25T13:52:37.474Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "5154c96d-c0a5-43d4-9452-c7a284e53963",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
          "isSelected": true,
          "addedAt": "2025-12-25T13:52:33.906Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    }
  ]
}
```

## Get Document Detail by user

### **GET** `/document/:documentId`

**Param**

documentId = 8a4457cd-9c0d-4346-a88e-16b0b1aed99e

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
    "title": "Giáo trình AI",
    "description": "Demo upload",
    "authors": ["Teacher A"],
    "subjects": [],
    "tags": ["AI"],
    "documentType": "unknown",
    "publishedYear": 2024,
    "accessLevel": "PRIVATE",
    "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
    "filePath": "uploads\\documents\\1766670753505-891084681.pdf",
    "mimeType": "application/pdf",
    "size": 39998,
    "pageCount": 0,
    "status": "DONE",
    "metadata": null,
    "viewCount": 0,
    "createdAt": "2025-12-25T13:52:33.512Z",
    "updatedAt": "2025-12-25T13:52:37.474Z",
    "indexedAt": null,
    "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
    "linkedProjects": [
      {
        "id": "5154c96d-c0a5-43d4-9452-c7a284e53963",
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
        "documentId": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
        "isSelected": true,
        "addedAt": "2025-12-25T13:52:33.906Z",
        "project": {
          "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "name": "Thư Viện Số",
          "description": "Project số hóa tài liệu PDF",
          "color": "#3B82F6"
        }
      }
    ]
  }
}
```

## Delete Document

### **DELETE** `/document/:documentId`

**Param**
documentId = 8a4457cd-9c0d-4346-a88e-16b0b1aed99e

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "6b4c5bb7-a05b-4661-8d1c-abf437e3ec9c",
    "title": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
    "description": "",
    "authors": [],
    "subjects": [],
    "tags": [],
    "documentType": "unknown",
    "publishedYear": null,
    "accessLevel": "PRIVATE",
    "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
    "filePath": "uploads\\documents\\1766654367238-651959962.pdf",
    "mimeType": "application/pdf",
    "size": 39998,
    "pageCount": 0,
    "status": "done",
    "metadata": null,
    "viewCount": 0,
    "createdAt": "2025-12-25T09:19:27.249Z",
    "updatedAt": "2025-12-25T09:19:33.060Z",
    "indexedAt": null,
    "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717"
  }
}
```

<!-- --------------------- CHAT MODULE --------------------- -->

# 💬 Chat RAG Module

## Chat global

\*Will have projectId = null

### **POST** `/chat/global`

**Query**
chatId = bbe027d0-74ea-4630-a846-5040a9772aaa

**Body**

```json
{
  "message": "Đối tượng nào được miễn giảm học phí năm 2025 2026"
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "answer": "Theo thông báo của Trường Đại học Kỹ thuật - Công nghệ Cần Thơ, các đối tượng được miễn, giảm học phí học kỳ I năm học 2025-2026 phải đáp ứng đủ 2 điều kiện:\n\n1. Thường trú tại thành phố Cần Thơ (sau sáp nhập).\n2. Thuộc đối tượng được miễn, giảm theo Nghị định số 238/2025/ND-CP.\n\nCụ thể, các đối tượng được miễn, giảm học phí bao gồm:\n\n### 1. Đối tượng được miễn học phí\n- Con của người hoạt động cách mạng trước tháng 08/1945; con của Anh hùng Lực lượng vũ trang nhân dân, Anh hùng Lao động trong thời kỳ kháng chiến; con của liệt sĩ, thương binh, bệnh binh được hưởng chính sách như thương binh, bệnh binh; con của người hoạt động kháng chiến bị nhiễm chất độc hóa học.\n- Sinh viên khuyết tật.\n- Sinh viên từ 16 đến 22 tuổi đang học văn bằng thứ nhất, không có nguồn nuôi dưỡng, thuộc đối tượng hưởng trợ cấp xã hội hàng tháng theo quy định tại khoản 1 và khoản 2 Điều 5 Nghị định số 20/2021/ND-CP.\n- Sinh viên là dân tộc thiểu số có cha hoặc mẹ hoặc cả cha và mẹ hoặc ông bà (trong trường hợp ở với ông bà) thuộc hộ nghèo và hộ cận nghèo theo quy định của Thủ tướng Chính phủ.\n- Sinh viên là dân tộc thiểu số rất ít người ở vùng có điều kiện kinh tế - xã hội khó khăn và đặc biệt khó khăn.\n\n### 2. Đối tượng được giảm 70% học phí\n- Sinh viên là người dân tộc thiểu số (ngoài đối tượng dân tộc thiểu số rất ít người) ở thôn/bản đặc biệt khó khăn, xã khu vực III vùng dân tộc và miền núi, xã đặc biệt khó khăn vùng bãi ngang ven biển hải đảo theo quy định của cơ quan có thẩm quyền.\n\n### 3. Đối tượng được giảm 50% học phí\n- Sinh viên là con cán bộ, công chức, viên chức, công nhân mà cha hoặc mẹ bị mắc bệnh nghề nghiệp hoặc tai nạn lao động được hưởng trợ cấp thường xuyên.\n\n**Lưu ý:** Nếu sinh viên thuộc nhiều diện miễn, giảm học phí thì chỉ được hưởng một chế độ ưu đãi cao nhất [#0][#1].",
    "citations": [
      {
        "index": 0,
        "snippet": "# THÔNG BÁO\n## Về các chế độ chính sách miễn, giảm học phí cho sinh viên chính quy học kỳ I năm học 2025 - 2026\n\nCăn cứ Nghị định số 238/2025/ND-CP ng...",
        "text": "# THÔNG BÁO\n## Về các chế độ chính sách miễn, giảm học phí cho sinh viên chính quy học kỳ I năm học 2025 - 2026\n\nCăn cứ Nghị định số 238/2025/ND-CP ngày 03 tháng 9 năm 2025 của Chính phủ quy định về chính sách học phí, miễn, giảm, hỗ trợ học phí, hỗ trợ chi phí học tập và giá dịch vụ trong lĩnh vực giáo dục, đào tạo, Trường Đại học Kỹ thuật - Công nghệ Cần Thơ thông báo đến lãnh đạo các khoa, cố vấn học tập và toàn thể sinh viên chính quy các nội dung sau:\n\n### I. Đối tượng được miễn, giảm: Sinh viên thuộc đối tượng được miễn, giảm học phí phải đủ 02 điều kiện sau:\n\n1. Thường trú tại thành phố Cần Thơ (sau sáp nhập).\n2. Thuộc đối tượng được miễn, giảm theo Nghị định số 238/2025/ND-CP (được nêu cụ thể tại phần \"Thủ tục thực hiện\").\n\n### II. Thủ tục thực hiện\n\nSinh viên thuộc đối tượng được miễn, giảm học phí cần nộp hồ sơ để được xét miễn, giảm học phí, cụ thể như sau:\n\n<table>\n  <thead>\n    <tr>\n        <th>1. Đối tượng miễn học phí</th>\n        <th>Hồ sơ cần thực hiện</th>\n    </tr>\n<tr>\n        <th>Đối tượng 1: (Khoản 2 - Điều 15)</th>\n        <th>-</th>\n    </tr>\n<tr>\n        <th>Con của người hoạt động cách mạng trước tháng 08/1945; Con của Anh hùng Lực lượng vũ trang nhân dân, Anh hùng Lao động trong thời kỳ kháng chiến; Con của liệt sĩ, thương binh, bệnh binh được hưởng chính sách như thương binh, bệnh binh; Con của người hoạt động kháng chiến bị nhiễm chất độc hóa học.</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);</th>\n    </tr>\n<tr>\n        <th></th>\n        <th>- Bản sao có công chứng Giấy xác nhận đối tượng do cơ quan quản lý đối với người có công.</th>\n    </tr>\n<tr>\n        <th>Đối tượng 2: (Khoản 3 - Điều 15)</th>\n        <th>-</th>\n    </tr>\n<tr>\n        <th>Sinh viên khuyết tật.</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);</th>\n    </tr>\n<tr>\n        <th></th>\n        <th>- Bản sao có công chứng Giấy xác nhận khuyết tật</th>\n    </tr>\n  </thead>\n</table>",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 1,
        "score": 0.96973956,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 1,
        "snippet": "2\n\n<table>\n  <thead>\n    <tr>\n        <th>**Đối tượng 3: (Khoản 4 - Điều 15)**</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;...",
        "text": "2\n\n<table>\n  <thead>\n    <tr>\n        <th>**Đối tượng 3: (Khoản 4 - Điều 15)**</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao có công chứng Quyết định về việc trợ cấp xã hội.</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n        <td>Sinh viên từ 16 tuổi đến 22 tuổi đang học văn bằng thứ nhất không có nguồn nuôi dưỡng thuộc đối tượng hưởng trợ cấp xã hội hàng tháng theo quy định tại khoản 1 và khoản 2 Điều 5 Nghị định số 20/2021/ND-CP.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**Đối tượng 4: (Khoản 7 - Điều 15)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Giấy chứng nhận hộ nghèo, hộ cận nghèo.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là dân tộc thiểu số có cha hoặc mẹ hoặc cả cha và mẹ hoặc ông bà (trong trường hợp ở với ông bà) thuộc hộ nghèo và hộ cận nghèo theo quy định của Thủ tướng Chính phủ.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**Đối tượng 5: (Khoản 10 - Điều 15)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao công chứng của Giấy khai sinh.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là dân tộc thiểu số rất ít người ở vùng có điều kiện kinh tế - xã hội khó khăn và đặc biệt khó khăn.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**2. Đối tượng giảm 70% học phí**</td>\n<td>**Hồ sơ cần thực hiện**</td>\n    </tr>\n<tr>\n        <td>**Đối tượng 6: (Khoản 1 - Điều 16)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao công chứng của Giấy khai sinh.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là người dân tộc thiểu số (ngoài đối tượng dân tộc thiểu số rất ít người) ở thôn/bản đặc biệt khó khăn, xã khu vực III vùng dân tộc và miền núi, xã đặc biệt khó khăn vùng bãi ngang ven biển hải đảo theo quy định của cơ quan có thẩm quyền.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**3. Đối tượng giảm 50% học phí**</td>\n<td>**Hồ sơ cần thực hiện**</td>\n    </tr>\n<tr>\n        <td>**Đối tượng 7: (Khoản 2 - Điều 16)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao công chứng của Quyết định hưởng trợ cấp hàng tháng của cha hoặc mẹ bị tai nạn lao động hoặc mắc bệnh nghề nghiệp do tổ chức Bảo hiểm xã hội cấp.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là con cán bộ, công chức, viên chức, công nhân mà cha hoặc mẹ bị mắc bệnh nghề nghiệp hoặc tai nạn lao động được hưởng trợ cấp thường xuyên.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**Lưu ý:**</td>\n<td></td>\n    </tr>\n<tr>\n        <td>(1) Sinh viên thuộc diện miễn, giảm học phí cùng lúc hưởng nhiều chính sách hỗ trợ khác nhau thì chỉ được hưởng một chế độ ưu đãi cao nhất.</td>\n<td></td>\n    </tr>\n  </tbody>\n</table>\n\nScanned with<br>CS CamScanner™",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 2,
        "score": 0.9009141,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 4,
        "snippet": "# ĐƠN ĐỀ NGHỊ MIỄN, GIẢM HỌC PHÍ\n\nKính gửi:- Ban Giám hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ;  \n- Phòng Công tác Chính trị - Quản lý sinh vi...",
        "text": "# ĐƠN ĐỀ NGHỊ MIỄN, GIẢM HỌC PHÍ\n\nKính gửi:- Ban Giám hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ;  \n- Phòng Công tác Chính trị - Quản lý sinh viên - Khối nghiệp;  \n- Cố vấn học tập: ……………………………………………\n\nHọ và tên sinh viên: ………………………………………… CC/CCCD: …………………………………………  \nNgày, tháng, năm sinh: …………………………………………  \nNơi sinh: …………………………………………  \nLớp: ………………………………………… Khoa: …………………………………………  \nMSSV: …………………………………………  \nSố điện thoại sinh viên: ………………………………………… Số điện thoại người thân: …………………………………………  \nĐịa chỉ thường trú cũ: …………………………………………  \nĐịa chỉ thường trú mới: …………………………………………  \nThuộc đối tượng: …………………………………………  \n\n(Ghi rõ đối tượng được quy định tại Nghị định 238/2025/ND-CP)\n\nCăn cứ vào Nghị định số 238/2025/ND-CP của Chính phủ, tôi làm đơn này đề nghị được Nhà trường xem xét để được miễn, giảm học phí theo quy định và chế độ hiện hành.\n\n……, ngày …… tháng …… năm ……\n\n**Xác nhận của CVHT**  \n………………………………………  \n………………………………………  \n………………………………………\n\n**Người làm đơn**  \n(Ký tên và ghi rõ họ tên)  \n………………………………………",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 5,
        "score": 0.84927243,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 2,
        "snippet": "(2) Danh mục vùng, địa bàn có điều kiện kinh tế - xã hội đặc biệt khó khăn áp dụng đối với đối tượng 5 và đối tượng 6 theo phụ lục đính kèm thông báo ...",
        "text": "(2) Danh mục vùng, địa bàn có điều kiện kinh tế - xã hội đặc biệt khó khăn áp dụng đối với đối tượng 5 và đối tượng 6 theo phụ lục đính kèm thông báo này. Sinh viên cần có theo địa chỉ thường trú trước sáp nhập để xét.\n\nIII. Thời gian và địa điểm nộp hồ sơ:\n\nSinh viên nộp trực tiếp tại Phòng Công tác Chính trị - Quản lý sinh viên - Khối nghiệp đến hết ngày 03/10/2025. Để biết thêm thông tin vui lòng liên hệ Phòng Công tác Chính trị - Quản lý sinh viên - Khối nghiệp (Cô Đinh Việt Tuyết Hiền, ĐT: 0919.232.577).\n\nNoi nhận:\n- Các đơn vị;\n- website Phòng QLSV;\n- Lưu: VT, QLSV.\n(Hiện)\n\nKT. HIỆU TRƯỞNG\nPHÓ HIỆU TRƯỞNG\nNguyễn Thị Yên Chi",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 3,
        "score": 0.7214293,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 3,
        "snippet": "# PHỤ LỤC\n## DANH MỤC VÙNG, ĐỊA BÀN CÓ ĐIỀU KIỆN KINH TẾ - XÃ HỘI ĐẶC BIỆT KHÓ KHĂN\n(Kèm theo Thông báo số 169/TB-DHKTGN ngày 16 tháng 9 năm 2025 của ...",
        "text": "# PHỤ LỤC\n## DANH MỤC VÙNG, ĐỊA BÀN CÓ ĐIỀU KIỆN KINH TẾ - XÃ HỘI ĐẶC BIỆT KHÓ KHĂN\n(Kèm theo Thông báo số 169/TB-DHKTGN ngày 16 tháng 9 năm 2025 của Trường Đại học Kỹ thuật – Công nghệ Cần Thơ)\n\n1. Quyết định số 353/QĐ-TTg ngày 15 tháng 3 năm 2022 của Thủ tướng Chính phủ: Phê duyệt danh sách huyện nghèo, xã đặc biệt khó khăn vùng bãi ngang, ven biển và hải đảo giai đoạn 2021 - 2025;\n\n2. Quyết định số 576/QĐ-TTg ngày 22 tháng 6 năm 2024 của Thủ tướng Chính phủ: Công nhận 09 xã đặc biệt khó khăn vùng bãi ngang, ven biển và hải đảo giai đoạn 2021 - 2025 thoát khỏi tình trạng đặc biệt khó khăn;\n\n3. Quyết định số 861/QĐ-TTg ngày 04 tháng 6 năm 2021 của Thủ tướng Chính phủ: Phê duyệt danh sách các xã khu vực III, khu vực II, khu vực I thuộc vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2025;\n\n4. Quyết định số 698/QĐ-TTg ngày 19 tháng 7 năm 2024 của Thủ tướng Chính phủ: Phê duyệt điều chỉnh, bổ sung và hiệu chỉnh danh sách xã khu vực III, khu vực II, khu vực I thuộc vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2025;\n\n5. Quyết định số 612/QĐ-UBDT ngày 16 tháng 9 năm 2021 phê duyệt danh sách các thôn đặc biệt khó khăn vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2025;\n\n6. Quyết định số 497/QĐ-UBDT ngày 30 tháng 7 năm 2024 phê duyệt điều chỉnh và hiệu chỉnh tên huyện, xã, thôn đặc biệt khó khăn; thôn thuộc vùng dân tộc thiểu số và miền núi giai đoạn 2021 - 2025.",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 4,
        "score": 0.6509999,
        "startOffset": 0,
        "endOffset": 0
      }
    ],
    "chatId": "53852a0e-6bb8-49c0-b17d-e5accb980355"
  }
}
```

## New chat and Chat Session

### **POST** `/project/:projectId/chats/messages`

**Param**:
projectId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Query**:

```json
// chatId null thì tạo mới chat, sau khi tạo xong gắng chatId vào để tiếp tục chat
chatId = bbe027d0-74ea-4630-a846-5040a9772aaa
```

Body and Response same with `/chat/global`

## Get Chat Detail

### **GET** `/chat/:chatId/messages`

**Param**
chatId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "bdb88320-5a0a-4153-8f9a-1d1a9e43d3eb",
    "title": "New Chat",
    "createdAt": "2025-12-28T08:17:52.074Z",
    "updatedAt": "2025-12-28T08:17:55.145Z",
    "userId": "977a368e-abfe-4a38-adbe-4625cce8d500",
    "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
    "messages": [
      {
        "role": "user",
        "content": "Cho tôi biết kiến trúc hệ thống và công nghệ của luận văn tốt nghiệp của tác giả Trường Thịnh và Minh Nhật. Vậy kiến trúc này có giống kiến trúc RAG không hay chỉ là một phiên bản đơn giản hơn"
      },
      {
        "role": "assistant",
        "content": "Tài liệu hiện tại không chứa thông tin về kiến trúc hệ thống và công nghệ của luận văn tốt nghiệp của tác giả Trường Thịnh và Minh Nhật, cũng như không đề cập đến việc kiến trúc này có giống kiến trúc RAG hay chỉ là một phiên bản đơn giản hơn. Nội dung tài liệu chủ yếu tập trung vào các mô hình ngôn ngữ lớn như ChatGPT và Gemini, cùng các công nghệ liên quan đến LLM hiện đại [#0][#5][#10][#12].",
        "citation": [
          {
            "page": 2,
            "text": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay.",
            "index": 12,
            "score": 0.9077052703255086,
            "fileId": "c65128ad-9272-46a3-a20d-9c3d83096727",
            "fileUrl": "uploads\\documents\\1766909856075-818194294.pdf",
            "snippet": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tu...",
            "endOffset": 7353,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 6616
          },
          {
            "page": 2,
            "text": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay.",
            "index": 12,
            "score": 0.907649701833725,
            "fileId": "24e58995-f414-4530-a863-56c3dc85e287",
            "fileUrl": "uploads\\documents\\1766727002595-897595108.pdf",
            "snippet": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tu...",
            "endOffset": 7353,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 6616
          }
          // ...
        ]
      }
    ]
  }
}
```

## Get Global Chats

### **GET** `/chat/user/global`

**Note:** Get all chats that have `projectId` = null

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "05db033f-643d-4cbc-92cc-8b13538eb217",
      "title": "New Chat",
      "createdAt": "2025-12-25T05:07:23.316Z",
      "updatedAt": "2025-12-25T05:07:32.142Z",
      "projectId": null
    },
    {
      "id": "65d1f823-e0d2-4e92-b32b-97351ce85561",
      "title": "New Chat",
      "createdAt": "2025-12-25T05:04:19.340Z",
      "updatedAt": "2025-12-25T05:04:23.696Z",
      "projectId": null
    }
  ]
}
```

## Update chat

### **PATCH** `/chat/user/:chatId`

**Param**
chatId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Body**

```json
{
  // Just update 2 fields
  "title": "Sinoo chat",
  "projectId": "46da89f2-401a-489c-98ea-4a4121d6ed91"
}
```

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "65d1f823-e0d2-4e92-b32b-97351ce85561",
    "title": "Sinoo chat moved",
    "createdAt": "2025-12-25T05:04:19.340Z",
    "updatedAt": "2025-12-25T14:23:51.997Z",
    "projectId": "cf3ad296-3044-451f-84db-9fc99c9e327d"
  }
}
```

## Delete chat

### **DELETE** `/chat/user/:chatId`

**Param**
chatId = db4d69de-d88f-4ae8-8dc1-d087907dc195

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "65d1f823-e0d2-4e92-b32b-97351ce85561",
    "title": "Sinoo chat moved",
    "createdAt": "2025-12-25T05:04:19.340Z",
    "updatedAt": "2025-12-25T14:23:51.997Z",
    "projectId": "cf3ad296-3044-451f-84db-9fc99c9e327d"
  }
}
```

---

# � Notifications (SSE)

## Connect to SSE Stream

### **GET** `/notifications/sse`

**Description:** Establishes a Server-Sent Events (SSE) connection for real-time notifications. Events are filtered by userId.

**Query Parameters:**

- `userId` (required): User ID to filter notifications

**Authentication:** Required (JWT Bearer Token)

**Example Connection:**

```javascript
const userId = 'user-123';
const token = 'your-jwt-token';

const eventSource = new EventSource(
  `http://localhost:8080/api/v1/notifications/sse?userId=${userId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

eventSource.onopen = () => {
  console.log('✅ SSE Connected');
};

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 Notification:', data);

  // Handle different event types
  switch (data.type) {
    case 'DOCUMENT_PROCESSED':
      handleDocumentProcessed(data.payload);
      break;
    // Add more event types as needed
  }
};

eventSource.onerror = (error) => {
  console.error('❌ SSE Error:', error);
  // Implement reconnection logic
};

// Clean up on component unmount
// eventSource.close();
```

**Event Format:**

```json
{
  "type": "DOCUMENT_PROCESSED",
  "payload": {
    "fileId": "abc-123",
    "projectId": "project-456",
    "status": "DONE",
    "message": "Xử lý thành công"
  },
  "timestamp": "2026-01-15T03:30:00.000Z"
}
```

**Event Types:**

| Type                 | Description                   | Payload Fields                             |
| -------------------- | ----------------------------- | ------------------------------------------ |
| `DOCUMENT_PROCESSED` | Document processing completed | `fileId`, `projectId`, `status`, `message` |

**Status Values:**

- `DONE`: Processing completed successfully
- `ERROR`: Processing failed

**Notes:**

- SSE connection is persistent and will automatically push events when they occur
- No polling required
- Events are only sent to the user who owns the resource
- Connection will auto-reconnect on network issues (browser default behavior)

---

# 📙 Response Format

## Success Response

```json
{
  "statusCode": 200, // 201, 400, 500
  "success": true,
  "data": // {} or [],
}
```
