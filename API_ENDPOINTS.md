# 📘 Chatnary Backend API Endpoints

*(NestJS · Prisma · PGVector · LangChainJS)*

## Base URL

```
http://localhost:8000/api/v1
```

---

# 🏠 Root

### **GET** `/docs`

* API documents Backend

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

*(Giống ChatGPT workspace — quản lý không gian dự án)*

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
      "authors": [
        "Teacher A"
      ],
      "subjects": [],
      "tags": [
        "AI"
      ],
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
    "authors": [
      "Teacher A"
    ],
    "subjects": [],
    "tags": [
      "AI"
    ],
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

*Will have projectId = null

### **POST** `/chat/global`

**Query**
chatId = bbe027d0-74ea-4630-a846-5040a9772aaa

**Body**

```json
{
  "message": "Cho tôi biết kiến trúc hệ thống của luận văn tốt nghiệp của tác giả Trường Thịnh và Minh Nhật. Vậy kiến trúc này có giống kiến trúc RAG không hay chỉ là một phiên bản đơn giản hơn"
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "answer": "Theo tài liệu, hệ thống trong luận văn tốt nghiệp của tác giả Trường Thịnh và Minh Nhật được xây dựng với các thành phần chính như sau:\n\n- LLM (Large Language Model): Được sử dụng để hiểu ngữ cảnh và câu hỏi của người dùng, đóng vai trò cốt lõi trong việc xử lý ngôn ngữ tự nhiên.\n- Embeddings: Các văn bản được số hóa thành các vector số (embeddings) để hỗ trợ việc tìm kiếm thông tin nhanh và hiệu quả hơn.\n- PDFs: Bộ tài liệu hành chính được đóng gói trong một thư mục, AI sẽ truy xuất và sử dụng các tài liệu này để trả lời chính xác cho người dùng.\n- Chatbot: Lớp độc lập có chức năng tạo đoạn chat, hỗ trợ người dùng tương tác với hệ thống.\n- Các lớp quản lý người dùng như Cán bộ, Sinh viên, Tài khoản, với các chức năng như phân quyền, thêm/xóa tệp, v.v.\n\nLuồng xử lý cơ bản: Người dùng gửi câu hỏi → Hệ thống sử dụng embeddings để tìm kiếm thông tin liên quan trong các file PDF → LLM xử lý và tạo câu trả lời dựa trên thông tin tìm được → Trả lời cho người dùng qua chatbot [#105][#107].\n\nSo sánh với kiến trúc RAG (Retrieval-Augmented Generation):\n\n- Kiến trúc RAG tiêu chuẩn gồm hai thành phần chính: bộ truy xuất (retriever) để tìm kiếm các đoạn văn bản liên quan từ kho dữ liệu, và bộ sinh (generator, thường là LLM) để tổng hợp, tạo ra câu trả lời dựa trên các đoạn truy xuất được.\n- Hệ thống trong luận văn cũng có các thành phần tương tự: sử dụng embeddings để tìm kiếm (retrieval) và LLM để sinh câu trả lời (generation).\n- Tuy nhiên, tài liệu không mô tả chi tiết về việc tích hợp chặt chẽ giữa hai thành phần này như trong RAG chuẩn (ví dụ: có sử dụng cross-attention giữa retrieved context và prompt đầu vào hay không), cũng như không đề cập đến các kỹ thuật tối ưu hóa hoặc fine-tuning đặc thù cho RAG.\n\nKết luận:  \nKiến trúc hệ thống của luận văn có các thành phần và luồng xử lý tương tự với kiến trúc RAG, nhưng có thể xem là một phiên bản đơn giản hơn, chưa đầy đủ hoặc tối ưu như RAG chuẩn trong nghiên cứu hiện đại [#105][#107].",
    "citations": [
      {
        "index": 56,
        "snippet": "cân nhắc trong các ứng dụng đòi hỏi độ chính xác và tính cập nhật cao. 2.  Trí tuệ nhân tạo tạo sinh – Generative artificial intelligence (GenAI) 2.1....",
        "text": "cân nhắc trong các ứng dụng đòi hỏi độ chính xác và tính cập nhật cao. 2.  Trí tuệ nhân tạo tạo sinh – Generative artificial intelligence (GenAI) 2.1.  GenAI là gì? Gen AI là một lĩnh vực của trí tuệ nhân tạo tập trung vào việc tạo ra nội dung, dữ liệu hoặc thông tin mới mà không cần lập trình rõ ràng. Hệ thống hoạt động dựa trên các mô hình được đào tạo trên các tập dữ liệu lớn để tự động tạo nội dung. Các mô hình này học các mẫu và mối quan hệ từ các tập dữ liệu rộng lớn và sau đó có thể tạo ra văn bản, hình ảnh hoặc các dạng nội dung khác. Một loại GenAI cụ thể, các mô hình ngôn ngữ lớn, có tiềm năng to lớn để thay đổi cách thức làm việc của con người. 2.2.",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 22,
        "score": 0.8836096450439399,
        "startOffset": 29397,
        "endOffset": 30065
      },
      {
        "index": 191,
        "snippet": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên 49 Em chưa biết lập trình thì em có thể theo học ngành này tại trường hay không? Có ...",
        "text": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên 49 Em chưa biết lập trình thì em có thể theo học ngành này tại trường hay không? Có thể, Khi vào học các chương trình của Trường, em sẽ có nhiều cơ hội học bổ sung những mảng kiến thức để hỗ trợ cho định hướng nghề nghiệp trong tương lai. Khi vào học chương trình Hệ thống thông tin tại Trường ĐH Kỹ thuật - Công nghệ Cần Thơ, em sẽ được học bổ sung những kiến thức cần thiết để hỗ trợ cho định hướng nghề nghiệp trong tương lai. Tuy nhiên, việc biết lập trình sẽ là một lợi thế trong việc học ngành này, vì lập trình là một trong những kỹ năng quan trọng trong lĩnh vực Hệ thống thông tin. Nếu em chưa biết lập trình, em vẫn có thể học ngành này, nhưng em nên sẵn sàng học và nắm vững kiến thức lập trình trong quá trình học tập.",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 93,
        "score": 0.8819597740149363,
        "startOffset": 102095,
        "endOffset": 102891
      },
      {
        "index": 69,
        "snippet": "Thiếu khả năng nhận thức thực: OpenAI phản hồi dựa trên mẫu ngôn ngữ và không có khả năng hiểu cảm xúc hoặc tình huống phức tạp như con người thật sự....",
        "text": "Thiếu khả năng nhận thức thực: OpenAI phản hồi dựa trên mẫu ngôn ngữ và không có khả năng hiểu cảm xúc hoặc tình huống phức tạp như con người thật sự. • Kết luận: OpenAI là một mô hình GenAI mạnh mẽ và nổi tiếng nhất hiện nay, họ đã cải tiến việc nhận dạng bằng hình ảnh hay có thể chuyển đổi từ PDF sang Word hoặc ngược lại, nhưng vì được quá nhiều người biết đến, việc lạm dụng OpenAI vào các bài viết tiểu luận, luận văn ngày một nhiều hơn làm mất tính minh bạch. 14",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 25,
        "score": 0.8818111457599573,
        "startOffset": 35844,
        "endOffset": 36313
      },
      {
        "index": 45,
        "snippet": "vào việc giới thiệu mô hình Transformer có khả năng xử lý văn bản dài, được thực hiện bởi nhóm tác giả: Beltagy, Iz Peters, Matthew E và Cohan Arman. ...",
        "text": "vào việc giới thiệu mô hình Transformer có khả năng xử lý văn bản dài, được thực hiện bởi nhóm tác giả: Beltagy, Iz Peters, Matthew E và Cohan Arman. Bài viết khai thác về các kiến trúc mô hình ngôn ngữ lớn và khả năng tổng quát hóa trong máy học với 175 tỷ tham số, bao gồm các nội dung chính sau • kiến trúc và mô hình: GPT-3 và các phiên bản đời sau sử dụng Transformer, được huấn luyên trên một tập dữ liệu lớn từ nhiều nguồn khác nhau. • Khả năng ví dụ học hỏi: GPT có thể thực hiện nhiều nhiệm vụ chỉ dựa trên một vài ví dụ, một ví dụ, hoặc khồng cần ví dụ. • Đánh giá: GPT vượt trội trong nhiều bài toán NLP(Natural Language Processing) mà không cần tỉnh chỉnh, đạt kết quả gần ngang hoặc tốt hơn với các mô hình huấn luyện đặc thù.",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 18,
        "score": 0.8813174851319173,
        "startOffset": 23096,
        "endOffset": 23835
      },
      {
        "index": 105,
        "snippet": "thống và tương tác với hệ thống. • Trò chuyện với AI: Giảng viên có thể sử dụng chức năng chat với AI bằng tài khoản được cung cấp bởi trường đại học....",
        "text": "thống và tương tác với hệ thống. • Trò chuyện với AI: Giảng viên có thể sử dụng chức năng chat với AI bằng tài khoản được cung cấp bởi trường đại học. AI: Đóng vai trò cốt lõi trong hệ thống, được xây dựng với tiêu chí hỗ trợ không ngừng nghỉ cho người dùng các thành phần mà AI xử lý sau khi nhận được văn bản từ người dùng như sau: • LLM: Là ngôn ngữ lớn để hiểu được ngữ cảnh của mạch chuyện câu hỏi người dùng là việc không thể thiếu. • Embeddings: Mỗi văn bản sẽ được số hóa có thể lên đến hàng nghìn hàng triệu mã số, vì vậy với quá trình này sẽ giúp máy học có thể tìm kiếm văn bản nhanh hơn. • PDFs: Là một bộ tư liệu về hành chính được đóng gói trong một thư mục, AI sẽ lấy tài liệu được cung cấp trong đây để trả lời chính xác cho người dùng. 26",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 37,
        "score": 0.8812226939930137,
        "startOffset": 54970,
        "endOffset": 55725
      },
      {
        "index": 150,
        "snippet": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên lý thông tin của hệ thống trên nhiều dạng câu hỏi với độ phức tạp khác nhau, từ việc...",
        "text": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên lý thông tin của hệ thống trên nhiều dạng câu hỏi với độ phức tạp khác nhau, từ việc truy xuất thông tin đơn giản đến việc tổng hợp và suy luận thông tin phức tạp. Hình 4.21: Biểu đồ tỉ lệ câu trả lời đúng và sai Biểu đồ cột trong Hình 4.21 cho thấy kết quả khả quan về tỉ lệ trả lời đúng của hệ thống, phản ánh mức độ chính xác của hệ thống khi phản hồi người dùng. Cụ thể, hệ thống đạt tỉ lệ chính xác cao ở cả ba mức độ câu hỏi: Dễ (96%), Trung bình (95%) và Khó (85%). Để đánh giá mức độ khó của câu hỏi, chúng tôi sử dụng các tiêu chí sau: • Dễ: Câu hỏi có nội dung đơn giản, thông tin trả lời nằm rõ ràng trong một tệp PDF duy nhất. Ví dụ, câu hỏi về thời hạn nộp học phí, quy định về điểm danh,...",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 68,
        "score": 0.8812082367055191,
        "startOffset": 80600,
        "endOffset": 81370
      },
      {
        "index": 35,
        "snippet": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên use-case, sơ đồ lớp, sơ đồ hoạt động để minh họa rõ ràng cấu trúc, chức năng và luồn...",
        "text": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên use-case, sơ đồ lớp, sơ đồ hoạt động để minh họa rõ ràng cấu trúc, chức năng và luồng xử lý của hệ thống. • Chương 4: Xây dựng hệ thống , tập trung vào quá trình triển khai hệ thống. Các công cụ, ngôn ngữ lập trình, framework, thư viện được sử dụng sẽ được giới thiệu. Đồ án trình bày chi tiết về thuật toán, mã nguồn, giao diện người dùng và quy trình tích hợp các thành phần của hệ thống. Kết quả thử nghiệm, đánh giá hiệu năng và độ chính xác của hệ thống cũng sẽ được trình bày. • Chương 5: Kết Luận , là chương cuối cùng tóm tắt lại những kết quả đạt được của luận văn, bao gồm việc xây dựng thành công hệ thống hỗ trợ hành chính tự động, những đóng góp về mặt khoa học và thực tiễn.",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 16,
        "score": 0.8805841582491243,
        "startOffset": 18549,
        "endOffset": 19303
      },
      {
        "index": 107,
        "snippet": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên • Cán bộ: Lớp này có thêm các phương thức (method) PhanQuyen() (phân quyền), ThemFil...",
        "text": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên • Cán bộ: Lớp này có thêm các phương thức (method) PhanQuyen() (phân quyền), ThemFile() (thêm tệp) và XoaFile() (xóa tệp), cho thấy cán bộ có quyền quản lý tài khoản và tệp tin trong hệ thống. • Chatbot: Đây là một lớp độc lập, có chức năng TaoDoanChat() (tạo đoạn chat), có thể được sử dụng để hỗ trợ người dùng tương tác với hệ thống. • Pdf: Đây là một lớp độc lập, đại diện cho các tệp tin PDF trong hệ thống. Các mối quan hệ giữa các lớp được biểu diễn bằng các đường nối và các ký hiệu: • Mũi tên kế thừa: Biểu thị mối quan hệ kế thừa (inheritance), ví dụ, lớp Sinh viên kế thừa từ lớp Tài khoản. • Mũi tên liên kết: Biểu thị mối quan hệ liên kết (association), ví dụ, Tài khoản liên kết với Chatbot.",
        "fileId": "f6aedd7a-6802-40b6-851a-bd77e52bc693",
        "fileUrl": "uploads\\documents\\1767153490384-887585498.pdf",
        "page": 39,
        "score": 0.8788569499084086,
        "startOffset": 56445,
        "endOffset": 57216
      }
    ],
    "chatId": "18bd4935-9ad9-4f4b-968c-2a5a73a4fbc4"
  }
}
```

## New chat and Chat Session

### **POST** `/project/:projectId/chats/messages`

**Param**:
projectId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Query**:

``` json
// chatId null thì tạo mới chat, sau khi tạo xong gắng chatId vào để tiếp tục chat 
chatId = bbe027d0-74ea-4630-a846-5040a9772aaa
```

**Body**

```json
{
  "message": "IG, entropy la gi, tinh nhu nao, trinh bay lai step by step cho toi de hieu di"
}
```

**Response**

``` json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "answer": "IG (Information Gain) và entropy là hai khái niệm quan trọng trong lĩnh vực cây quyết định (decision trees) của học máy. Dưới đây là giải thích chi tiết và từng bước cách tính toán:\n\n1. Entropy là gì?\n- Entropy là một đại lượng đo lường mức độ không chắc chắn (uncertainty) hoặc độ hỗn loạn của một tập dữ liệu. Nếu một tập dữ liệu có các nhãn phân bố đều, entropy sẽ cao; nếu tất cả các nhãn giống nhau, entropy sẽ thấp (bằng 0).\n- Công thức tính entropy cho một tập dữ liệu S với k lớp:\n  \n  Entropy(S) = - ∑ (p_i * log2(p_i))\n  \n  Trong đó, p_i là xác suất xuất hiện của lớp i trong tập S.\n\n2. Information Gain (IG) là gì?\n- IG (Information Gain) là lượng thông tin thu được khi chia tập dữ liệu S theo một thuộc tính (feature) nào đó. Nó đo lường mức giảm entropy sau khi chia.\n- Công thức:\n  \n  IG(S, A) = Entropy(S) - ∑ (|S_v| / |S|) * Entropy(S_v)\n  \n  Trong đó:\n  - S: tập dữ liệu gốc\n  - A: thuộc tính dùng để chia\n  - S_v: tập con của S với thuộc tính A có giá trị v\n  - |S_v|: số lượng phần tử trong S_v\n  - |S|: số lượng phần tử trong S\n\n3. Các bước tính toán (step by step):\n\nBước 1: Tính entropy của tập dữ liệu gốc S.\n- Đếm số lượng phần tử của từng lớp trong S.\n- Tính xác suất p_i cho từng lớp.\n- Áp dụng công thức entropy.\n\nBước 2: Chia tập dữ liệu S theo thuộc tính A thành các tập con S_v.\n\nBước 3: Tính entropy cho từng tập con S_v.\n\nBước 4: Tính entropy trung bình sau khi chia theo thuộc tính A:\n- Lấy entropy của từng S_v nhân với tỷ lệ |S_v| / |S|, rồi cộng lại.\n\nBước 5: Tính IG:\n- IG(S, A) = Entropy(S) - entropy trung bình sau khi chia.\n\nTóm lại, IG giúp chọn thuộc tính nào để chia dữ liệu tại mỗi bước của cây quyết định, bằng cách chọn thuộc tính làm giảm entropy nhiều nhất (tức là tăng \"thông tin\" nhiều nhất) [#10].",
    "citations": [
      {
        "index": 22,
        "snippet": "ứng dụng TĨNT\ntheo mức độ thông minh\n\nLo ic\nLogic: thông trị AI từ những năm 1980-1980, vân hữu ích trong\ncác hệ thông Iập trình\nKiên hức và Iý luận\n\n...",
        "text": "ứng dụng TĨNT\ntheo mức độ thông minh\n\nLo ic\nLogic: thông trị AI từ những năm 1980-1980, vân hữu ích trong\ncác hệ thông Iập trình\nKiên hức và Iý luận\n\n Câu hỏi mở: Iàm thế nào đề kết hợp với học máy?\n(ác phương pháp xây dựng ứng dụng TĨNT\ntheo mức độ thông minh\n\nLogic\nMotivation: virtual assistant\nTell inlormation Âsk questlons\nIE :2 4E z1\n\nUse natural languagel\n(ác phương pháp xây dựng ứng dụng TĨNT\ntheo mức độ thông minh\n\n984/ch problems\n\nMakoydecslonrocesesi Conslraint satisdaction problems\n\nAdversarial games Bayesian neluorls\nReflex 9tates Variables Logic\nnu\nLạt-leedl intellgene \"High-leel inteligene \n\nMachine learming\n\nTypes of models that we can use to represenlt real-world tasks",
        "fileId": "a74da6c0-f14f-4d16-bb5d-80fdb0cfd316",
        "fileUrl": "uploads\\documents\\1766903551419-47988989.pdf",
        "page": 1,
        "score": 0.2769574737485445,
        "startOffset": 13200,
        "endOffset": 13893,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      },
      {
        "index": 155,
        "snippet": "Thu ộ c tính và giá tr ị   ở   đ ây là các ký hi ệ u.  Sau khi h ọ c xong, ID3 bi ể u di ễ n khái ni ệ m h ọ c  đượ c b ằ ng m ộ t cây quy ế t  đị nh....",
        "text": "Thu ộ c tính và giá tr ị   ở   đ ây là các ký hi ệ u.  Sau khi h ọ c xong, ID3 bi ể u di ễ n khái ni ệ m h ọ c  đượ c b ằ ng m ộ t cây quy ế t  đị nh.  −   Ti ế p c ậ n k ế t n ố i hay m ạ ng neuron mô ph ỏ ng h ệ  th ầ n kinh c ủ a con ng ườ i  để  h ọ c  đượ c  các  khái  ni ệ m  mà  không  s ử  d ụ ng  ký  hi ệ u  để   bi ể u  di ễ n  v ấ n  đề .  M ạ ng  đơ n  t ầ ng  perceptron  cho  th ấ y  s ứ c  m ạ nh  c ủ a  m ạ ng  neuron,  tuy  nhiên  kh ả  n ă ng  áp  d ụ ng  c ủ a  chúng ch ỉ  h ạ n ch ế  cho các bài toán có tính tách r ờ i tuy ế n tính. M ạ ng  đ a t ầ ng áp d ụ ng  gi ả i  thu ậ t  h ọ c  lan  truy ề n  ng ượ c  đ ã  v ượ t  qua  nh ữ ng  h ạ n  ch ế  c ủ a  m ạ ng  perceptron,   ch ứ ng t ỏ   đượ c s ứ c m ạ nh th ự c s ự  c ủ a ti ế p c ậ n này.",
        "fileId": "41a0ff87-6436-4a76-bf1e-f1b5212a4aa0",
        "fileUrl": "uploads\\documents\\1766903551498-390414281.pdf",
        "page": 32,
        "score": 0.27663375660482803,
        "startOffset": 85025,
        "endOffset": 85798,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      },
      {
        "index": 35,
        "snippet": "IE-TẾ\n\n chứa cặp oondiiion,\n\nactlon (;Í ooldifion then acion\n\nmô tả các sự kiện, và trình\n\nbiên dịch điều khiển việc áp dụng các luật, và các sự kiện\n...",
        "text": "IE-TẾ\n\n chứa cặp oondiiion,\n\nactlon (;Í ooldifion then acion\n\nmô tả các sự kiện, và trình\n\nbiên dịch điều khiển việc áp dụng các luật, và các sự kiện\n\nđược cho.\n\nSử dụng suy diễn tiền (đi tử dữ Iội đồn mục tiêu) hoặc suy\ndiện Iùi (đi từ mục tiêu về dữ liệu)\nHệ luật sinh\n\nVD; Hệ luật sinh đơn giản dùng đồ sắp xếp một d3 các chữ cái a, b,c\ntheo thứ tự từ điện\nProduction set\n\n1. ba ab\n2. ca - ac\n\n4z g4 .: À 3. cb 1 bc\nIặp đền khi mẫu\n\ntrong bộ nhớ Iàm Heration Workingmemory Conflictset Hule fired\nvệc không còn 0 cbaca 1,2,3 1\n\nkhớp với đều liện\n\ncủi bắt Iỳ luật sinh u cabca 2 :\n\nnao, 2 acbca 2.3 2\nBiểu diễn mạng\n( efwork represen(aflon)\nBiểu diễn mạnp\n\nTrị thức được biểu diện dưới dạng đồ thị: các định Ià các đôi\ntượng hoặc khái miệm, các cung Ià quan hệ giữa chúng",
        "fileId": "9234d71b-d05a-497b-94a4-2bbf969673a1",
        "fileUrl": "uploads\\documents\\1766903551408-721977946.pdf",
        "page": 1,
        "score": 0.2759722599676925,
        "startOffset": 20719,
        "endOffset": 21491,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      },
      {
        "index": 8,
        "snippet": "¾   V ậ n  d ụ ng  gi ả i  thu ậ t  H ợ p  gi ả i  để   ch ứ ng  minh  các  v ấ n  đề   đượ c  bi ể u  di ễ n  b ằ ng  ngôn ng ữ  logic m ệ nh  đề .  ...",
        "text": "¾   V ậ n  d ụ ng  gi ả i  thu ậ t  H ợ p  gi ả i  để   ch ứ ng  minh  các  v ấ n  đề   đượ c  bi ể u  di ễ n  b ằ ng  ngôn ng ữ  logic m ệ nh  đề .  ¾   V ậ n  d ụ ng  gi ả i  thu ậ t  H ợ p  Gi ả i  để   ch ứ ng  minh  các  v ấ n  đề   đượ c  bi ể u  di ễ n  b ằ ng  ngôn ng ữ  logic v ị  t ừ    Ki ế n th ứ c tiên quy ế t : Ngôn ng ữ  logic m ệ nh  đề , ngôn ng ữ  logic v ị  t ừ , ph ươ ng pháp ch ứ ng  minh d ẫ n xu ấ t, phép  đố i sánh m ẫ u trong logic v ị  t ừ .  Tài li ệ u tham kh ả o :   [1]  Geogre F. Luger –  Artificial Intelligence, Structures and  Strategies for Complex Problem  Solving 4 th  Ed. –  Addison-Wesley Publishing Company, Inc – 2002  (trang 509 – trang 552)   [2]   Elaine  Rich,  Kevin  Knight  –   Artificial  Intelligence,  2 nd   Ed.",
        "fileId": "cb98ee69-32ce-4dd4-989c-88ec42b035f7",
        "fileUrl": "uploads\\documents\\1766903551502-901921657.pdf",
        "page": 2,
        "score": 0.2759576725959778,
        "startOffset": 4278,
        "endOffset": 5046,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      },
      {
        "index": 21,
        "snippet": "81519J716/1/407 3\nVanables 41 J 3 iJ J42isjals3lils1\nnu lj 6 111)3J912/4J81516\nô 218 916/1J5)317/21814\n4J1)9 2181714J1/9/603)5\nI 119 314J512J81611/7)3...",
        "text": "81519J716/1/407 3\nVanables 41 J 3 iJ J42isjals3lils1\nnu lj 6 111)3J912/4J81516\nô 218 916/1J5)317/21814\n4J1)9 2181714J1/9/603)5\nI 119 314J512J81611/7)3\n\n604l: put dglts In blank squares so each row, column, and 3 3 sub-block\nhas dgls 1-9\n\nNote: order of flling squares doesn t matter in the evaluation criterial\n\n0591 / Alturin 2018 / Lang\n(ác phương pháp xây dựng ứng dụng TTN \ntheo mức độ thông minh\n\n(ongirasint satiacton problms hard consrainis (eg, SUdoku\nsthedling)\n\n(0 stralnt salisdfactlon problems\n\nBayeslan neworls\n\nVariables\n\nBayeslan nehuorls: soft _ Ẹ, 1racling ca s from sensors)\n\n114\n\n(0921 / Attumn 2018 / La 1\n(ác phương pháp xây dựng ứng dụng TĨNT\ntheo mức độ thông minh\n\nLo ic\nLogic: thông trị AI từ những năm 1980-1980, vân hữu ích trong\ncác hệ thông Iập trình\nKiên hức và Iý luận",
        "fileId": "a74da6c0-f14f-4d16-bb5d-80fdb0cfd316",
        "fileUrl": "uploads\\documents\\1766903551419-47988989.pdf",
        "page": 1,
        "score": 0.2757757830619812,
        "startOffset": 12549,
        "endOffset": 13348,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      },
      {
        "index": 113,
        "snippet": "đ ã cho th ấ y  tính  hi ệ u  qu ả  c ủ a  tri  th ứ c  ư u  tiên  trong  quá  trình  h ọ c  (mitchell  et  al.  1986,  dejong  and   mooney 1986).  S...",
        "text": "đ ã cho th ấ y  tính  hi ệ u  qu ả  c ủ a  tri  th ứ c  ư u  tiên  trong  quá  trình  h ọ c  (mitchell  et  al.  1986,  dejong  and   mooney 1986).  S ự  thành công c ủ a các ch ươ ng trình h ọ c máy thuy ế t ph ụ c r ằ ng có th ể  t ồ n t ạ i m ộ t t ậ p h ợ p các  nguyên t ắ c h ọ c t ổ ng quát cho phép xây d ự ng nên các ch ươ ng trình có kh ả  n ă ng h ọ c t ậ p trong  nhi ề u l ĩ nh v ự c th ự c t ế .  III.9   X ử  lý phân tán song song và tính toán ki ể u n ả y sinh  H ầ u h ế t các k ỹ  thu ậ t nói  đế n trong tài li ệ u này  đề u s ử  d ụ ng tri th ứ c  đượ c bi ể u di ễ n rõ ràng và  các thu ậ t toán tìm ki ế m  đượ c thi ế t k ế  m ộ t cách c ẩ n th ậ n  để  cài  đặ t trí tu ệ .",
        "fileId": "3b6fd126-c315-4b6e-88ba-cdd0d0b5e8e8",
        "fileUrl": "uploads\\documents\\1766903551515-581923689.pdf",
        "page": 15,
        "score": 0.2756116038196321,
        "startOffset": 57626,
        "endOffset": 58323,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      },
      {
        "index": 8,
        "snippet": "Heaviside step function Gọi x là tổng kết hợp trong công thức (1) g ( x ) =      1 , if x > 0 0 , elsewhere (2) còn được gọi à Heaviside step fun...",
        "text": "Heaviside step function Gọi x là tổng kết hợp trong công thức (1) g ( x ) =      1 , if x > 0 0 , elsewhere (2) còn được gọi à Heaviside step function www.ctuet.edu.vn Perceptron 9 / 41",
        "fileId": "a0e80837-b7af-49d1-9414-04f2df731911",
        "fileUrl": "uploads\\documents\\1766903551471-182850855.pdf",
        "page": 9,
        "score": 0.2753538638564265,
        "startOffset": 1673,
        "endOffset": 1863,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      },
      {
        "index": 10,
        "snippet": "Trình tự thực hiện if-else Giải thuật decision trees tuần tự thực hiện từng cột dữ liệu, hay gọi là từng feature Kết quả của sự chia feature trước sẽ ...",
        "text": "Trình tự thực hiện if-else Giải thuật decision trees tuần tự thực hiện từng cột dữ liệu, hay gọi là từng feature Kết quả của sự chia feature trước sẽ ảnh hưởng đến sự chia feature sau Nguyên tắc chọn câu hỏi if-else là sao cho quá trình chia feature, giảm sự không chắc chắn (the amount of uncertainty) Giá trị thể hiện sự không chắc chắn được gọi là entropy www.ctuet.edu.vn Decision trees 10 / 28",
        "fileId": "00cf3364-9710-44a0-8181-848bffd5e6a6",
        "fileUrl": "uploads\\documents\\1766903551480-321544779.pdf",
        "page": 10,
        "score": 0.27511617422103885,
        "startOffset": 1706,
        "endOffset": 2104,
        "projectId": "f9b71db0-5c12-47b0-b0ec-de861e6b924d"
      }
    ],
    "chatId": "3ef5d8bd-2149-47bd-9baa-ae070977ea03"
  }
}
```

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
          },
          {
            "page": 2,
            "text": "thống kê. Bên cạnh đó,  chi phí tính toán  để huấn luyện và vận hành những mô hình lớn như GPT-3 là  rất cao , đòi hỏi tài nguyên phần cứng khổng lồ. Các hướng nghiên cứu mới (như kiến trúc MoE) đang được triển khai nhằm  cải thiện hiệu quả tính toán , giúp mô hình  chạy nhanh hơn với chi phí thấp hơn . Nhìn sang  thế hệ mô hình mới hơn ,   ChatGPT  (dựa trên GPT-3.5/GPT-4, có áp dụng RLHF) và  Google Gemini  (mô hình đa phương thức tiên tiến) là hai đại diện nổi bật cho  nền tảng LLM thương mại vào năm 2025 . Cả hai đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ, nhưng  mỗi mô hình có thế mạnh riêng .",
            "index": 10,
            "score": 0.9029724299907684,
            "fileId": "c65128ad-9272-46a3-a20d-9c3d83096727",
            "fileUrl": "uploads\\documents\\1766909856075-818194294.pdf",
            "snippet": "thống kê. Bên cạnh đó,  chi phí tính toán  để huấn luyện và vận hành những mô hình lớn như GPT-3 là  rất cao , đòi hỏi tài nguyên phần cứng khổng lồ. ...",
            "endOffset": 6205,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 5591
          },
          {
            "page": 2,
            "text": "thống kê. Bên cạnh đó,  chi phí tính toán  để huấn luyện và vận hành những mô hình lớn như GPT-3 là  rất cao , đòi hỏi tài nguyên phần cứng khổng lồ. Các hướng nghiên cứu mới (như kiến trúc MoE) đang được triển khai nhằm  cải thiện hiệu quả tính toán , giúp mô hình  chạy nhanh hơn với chi phí thấp hơn . Nhìn sang  thế hệ mô hình mới hơn ,   ChatGPT  (dựa trên GPT-3.5/GPT-4, có áp dụng RLHF) và  Google Gemini  (mô hình đa phương thức tiên tiến) là hai đại diện nổi bật cho  nền tảng LLM thương mại vào năm 2025 . Cả hai đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ, nhưng  mỗi mô hình có thế mạnh riêng .",
            "index": 10,
            "score": 0.9029724299907684,
            "fileId": "24e58995-f414-4530-a863-56c3dc85e287",
            "fileUrl": "uploads\\documents\\1766727002595-897595108.pdf",
            "snippet": "thống kê. Bên cạnh đó,  chi phí tính toán  để huấn luyện và vận hành những mô hình lớn như GPT-3 là  rất cao , đòi hỏi tài nguyên phần cứng khổng lồ. ...",
            "endOffset": 6205,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 5591
          },
          {
            "page": 1,
            "text": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng cho từng tác vụ .",
            "index": 5,
            "score": 0.9004563748836517,
            "fileId": "c65128ad-9272-46a3-a20d-9c3d83096727",
            "fileUrl": "uploads\\documents\\1766909856075-818194294.pdf",
            "snippet": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . V...",
            "endOffset": 3416,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 2845
          },
          {
            "page": 1,
            "text": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng cho từng tác vụ .",
            "index": 5,
            "score": 0.9003304779332589,
            "fileId": "24e58995-f414-4530-a863-56c3dc85e287",
            "fileUrl": "uploads\\documents\\1766727002595-897595108.pdf",
            "snippet": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . V...",
            "endOffset": 3416,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 2845
          },
          {
            "page": 1,
            "text": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn .",
            "index": 0,
            "score": 0.8964306837742281,
            "fileId": "24e58995-f414-4530-a863-56c3dc85e287",
            "fileUrl": "uploads\\documents\\1766727002595-897595108.pdf",
            "snippet": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng t...",
            "endOffset": 768,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 0
          },
          {
            "page": 1,
            "text": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn .",
            "index": 0,
            "score": 0.8961400389671326,
            "fileId": "c65128ad-9272-46a3-a20d-9c3d83096727",
            "fileUrl": "uploads\\documents\\1766909856075-818194294.pdf",
            "snippet": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng t...",
            "endOffset": 768,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 0
          }
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

# 📙 Response Format

## Success Response

```json
{
  "statusCode": 200, // 201, 400, 500
  "success": true,
  "data": // {} or [],
}
```
