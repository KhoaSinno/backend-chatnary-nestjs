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

## Get chat detail in Project

### **GET** `/project/:projectId/chats/:chatId/messages`

**Param**
projectId = eae33420-8426-4f3e-b055-d4afeefad60b
chatId = eae33420-8426-4f3e-b055-32sadgasgb

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "1d86b1ef-f248-420b-9413-21747c92bd9c",
    "title": "New Chat",
    "createdAt": "2025-12-25T06:54:02.583Z",
    "updatedAt": "2025-12-25T06:54:05.592Z",
    "messages": [
      {
        "role": "user",
        "content": "Trong những tài liệu này, tài liệu nào là nói về luận văn, nội dung nó nói là về cái gì"
      },
      {
        "role": "assistant",
        "content": "Tài liệu được cung cấp không đề cập đến bất kỳ luận văn nào. Nội dung các trích đoạn chủ yếu tập trung vào nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM), so sánh giữa ChatGPT và Gemini, các ứng dụng thực tiễn, kiến trúc kỹ thuật, hiệu năng, và những thách thức của LLM. Không có thông tin nào về luận văn hoặc nội dung cụ thể của một luận văn nào đó trong các trích đoạn này [#0][#1][#2][#4][#5][#7][#12][#13].",
        "citation": [
          {
            "page": 1,
            "text": "Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn , trong khi    Gemini  được thiết kế  đa phương thức  (tích hợp xử lý văn bản, mã nguồn, hình ảnh) nhằm mở rộng khả năng     phân tích và tạo nội dung trên nhiều dạng dữ liệu . Những  đột phá kỹ thuật  này không chỉ nâng cao hiệu suất tổng thể của mô hình  mà còn  mở đường cho các ứng dụng LLM sáng tạo  trong các lĩnh vực chuyên sâu (ví dụ trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v.) .  Bên cạnh khía cạnh kỹ thuật,  các nghiên cứu ứng dụng  cho thấy LLM có  tác động tích cực trong hoạt động thực tiễn .",
            "index": 2,
            "score": 0.9036848602482758,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên ...",
            "endOffset": 1982,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 1219
          },
          {
            "page": 1,
            "text": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng cho từng tác vụ .",
            "index": 5,
            "score": 0.7442258126802984,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . V...",
            "endOffset": 3417,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 2845
          },
          {
            "page": 1,
            "text": "hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đang được ứng dụng  rộng rãi trong các lĩnh vực  y tế, tài chính, giáo dục, dịch vụ khách hàng , giúp  cá nhân hóa phản hồi  và giải quyết những nhiệm vụ phân tích phức tạp . Động lực phát triển LLM  xuất phát từ nhu cầu giải quyết các bài toán thực tế ngày càng phức tạp với độ chính xác cao . Để đáp ứng điều đó, các nghiên cứu đã liên tục cải tiến kiến trúc mô hình và phương pháp huấn luyện. Chẳng hạn, việc áp dụng  Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt .",
            "index": 1,
            "score": 0.6641060299904952,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn ....",
            "endOffset": 1376,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 618
          },
          {
            "page": 1,
            "text": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn .",
            "index": 0,
            "score": 0.6361521816253662,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng t...",
            "endOffset": 769,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 0
          },
          {
            "page": 2,
            "text": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay. Những kết quả đạt được cho thấy  sự vượt trội của mô hình ngôn ngữ lớn  trong việc  xử lý ngôn ngữ tự nhiên và tư duy đa dạng , đồng thời nhấn mạnh  tiềm năng ứng dụng rộng rãi  của chúng vào thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về  những thách thức còn tồn tại  – từ việc cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination  cho đến  tối ưu hóa chi phí tính toán  – nhằm tiếp tục hoàn thiện và  phát huy tối đa lợi ích của các mô hình LLM  trong tương lai. 12 11 •  11 •  12 •  12 •  13 14 15 16 1 7 17 2",
            "index": 13,
            "score": 0.5704934554998005,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay....",
            "endOffset": 7931,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 7203
          },
          {
            "page": 2,
            "text": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay.",
            "index": 12,
            "score": 0.5551754301577287,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tu...",
            "endOffset": 7354,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 6614
          },
          {
            "page": 1,
            "text": "viên  cũng nhận định  AI giúp nâng cao chất lượng công việc  – ví dụ có 74% giáo viên đánh giá AI cải thiện hiệu quả các công việc hành chính  của họ . Điều này minh chứng rằng     các mô hình AI ngôn ngữ  như ChatGPT có  tiềm năng hỗ trợ giảm tải công việc  thủ công,  tối ưu hóa thời gian  và  nâng cao hiệu suất  trong môi trường làm việc thực tế. Về mặt kiến trúc và hiệu năng ,   các mô hình LLM thế hệ mới đều dựa trên kiến trúc Transformer  do Google giới thiệu năm 2017 . Kiến trúc này cho phép mô hình học được mối quan hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn .",
            "index": 4,
            "score": 0.5205110120164134,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "viên  cũng nhận định  AI giúp nâng cao chất lượng công việc  – ví dụ có 74% giáo viên đánh giá AI cải thiện hiệu quả các công việc hành chính  của họ ...",
            "endOffset": 2994,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 2316
          },
          {
            "page": 2,
            "text": "các mô hình được huấn luyện chuyên biệt  cho tác vụ tương ứng,  cho thấy hiệu quả của việc mở rộng quy mô và học từ ngữ cảnh . Một công trình nghiên cứu tiêu biểu đã tổng kết  các đặc điểm chính của mô hình GPT-3  và dòng LLM hiện đại như sau : Kiến trúc và dữ liệu huấn luyện:  GPT-3 và các thế hệ kế nhiệm  được xây dựng trên kiến trúc Transformer ,  huấn luyện trên tập dữ liệu văn bản khổng lồ  (hàng trăm tỷ từ) bao gồm nhiều nguồn khác nhau . Quy mô tham số cực lớn (GPT-3 có 175 tỷ tham số) cho phép mô hình  học được biểu diễn ngôn ngữ rất đa dạng , làm nền tảng cho hiệu suất cao trên nhiều nhiệm vụ. Khả năng học từ ít ví dụ:  GPT-3 có khả năng  thực hiện nhiều nhiệm vụ chỉ dựa trên một vài ví dụ hoặc thậm chí không cần ví dụ minh họa  (few-shot learning).",
            "index": 7,
            "score": 0.5153147437980922,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "các mô hình được huấn luyện chuyên biệt  cho tác vụ tương ứng,  cho thấy hiệu quả của việc mở rộng quy mô và học từ ngữ cảnh . Một công trình nghiên c...",
            "endOffset": 4591,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 3822
          }
        ]
      }
    ]
  }
}
```

## Create New chat in Project

### **GET** `/project/:projectId/chats/messages`

**Param**: projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Query**: chatId = null

**Body**

```json
{
  "message": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì"
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "answer": "Tài liệu nghiên cứu về các mô hình ngôn ngữ lớn (LLM) hiện đại, tập trung chủ yếu vào ChatGPT của OpenAI và Gemini của Google. Ngoài ra, tài liệu cũng đề cập đến GPT-3 như một ví dụ tiêu biểu cho thế hệ LLM trước đó [#0][#5][#10].\n\nCác điểm mạnh nổi bật của các LLM này bao gồm:\n\n1. Khả năng xử lý ngôn ngữ tự nhiên vượt trội: LLM hiện đại có thể hiểu, sinh ngôn ngữ và suy luận dựa trên ngôn ngữ, tạo nên bước đột phá trong lĩnh vực NLP [#0][#13].\n2. Ứng dụng đa lĩnh vực: Các mô hình như ChatGPT và Gemini được ứng dụng rộng rãi trong y tế, tài chính, giáo dục, dịch vụ khách hàng, giúp cá nhân hóa phản hồi và giải quyết các nhiệm vụ phân tích phức tạp [#1].\n3. Kỹ thuật tiên tiến:\n   - ChatGPT sử dụng học tăng cường từ phản hồi của con người (RLHF) để nâng cao tính mạch lạc và tự nhiên trong hội thoại [#0][#2].\n   - Gemini có kiến trúc đa phương thức, tích hợp xử lý văn bản, mã nguồn, hình ảnh, giúp mở rộng khả năng phân tích và tạo nội dung trên nhiều dạng dữ liệu [#2].\n   - Việc áp dụng Mixture-of-Experts (MoE) giúp giảm chi phí tính toán và tăng hiệu suất cho các tác vụ chuyên biệt [#1][#2][#10].\n4. Hiệu suất cao trên nhiều nhiệm vụ: Các LLM như GPT-3, ChatGPT và Gemini đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ khác nhau, với khả năng học từ ít ví dụ (few-shot learning) và không cần tinh chỉnh riêng cho từng tác vụ [#5][#7].\n5. Tiềm năng sáng tạo và ứng dụng chuyên sâu: LLM mở đường cho các ứng dụng sáng tạo như trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v. [#2].\n6. Đột phá về quy mô và dữ liệu: Việc gia tăng số lượng tham số và khối lượng dữ liệu huấn luyện đã giúp các LLM đạt được năng lực vượt trội, ví dụ GPT-3 có 175 tỷ tham số và được huấn luyện trên ~570 GB dữ liệu văn bản [#5][#7].\n\nTóm lại, tài liệu tập trung nghiên cứu các LLM như ChatGPT, Gemini và GPT-3, nhấn mạnh điểm mạnh về khả năng xử lý ngôn ngữ, ứng dụng đa lĩnh vực, kỹ thuật tiên tiến, hiệu suất cao và tiềm năng ứng dụng thực tiễn [#0][#1][#2][#5][#7][#10][#13].",
    "citations": [
      {
        "index": 0,
        "snippet": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng t...",
        "text": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn .",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 1,
        "score": 0.7498443037178695,
        "startOffset": 0,
        "endOffset": 769,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      },
      {
        "index": 13,
        "snippet": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay....",
        "text": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay. Những kết quả đạt được cho thấy  sự vượt trội của mô hình ngôn ngữ lớn  trong việc  xử lý ngôn ngữ tự nhiên và tư duy đa dạng , đồng thời nhấn mạnh  tiềm năng ứng dụng rộng rãi  của chúng vào thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về  những thách thức còn tồn tại  – từ việc cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination  cho đến  tối ưu hóa chi phí tính toán  – nhằm tiếp tục hoàn thiện và  phát huy tối đa lợi ích của các mô hình LLM  trong tương lai. 12 11 •  11 •  12 •  12 •  13 14 15 16 1 7 17 2",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 2,
        "score": 0.7062428998947131,
        "startOffset": 7203,
        "endOffset": 7931,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      },
      {
        "index": 1,
        "snippet": "hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn ....",
        "text": "hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đang được ứng dụng  rộng rãi trong các lĩnh vực  y tế, tài chính, giáo dục, dịch vụ khách hàng , giúp  cá nhân hóa phản hồi  và giải quyết những nhiệm vụ phân tích phức tạp . Động lực phát triển LLM  xuất phát từ nhu cầu giải quyết các bài toán thực tế ngày càng phức tạp với độ chính xác cao . Để đáp ứng điều đó, các nghiên cứu đã liên tục cải tiến kiến trúc mô hình và phương pháp huấn luyện. Chẳng hạn, việc áp dụng  Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt .",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 1,
        "score": 0.6589799450916003,
        "startOffset": 618,
        "endOffset": 1376,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      },
      {
        "index": 2,
        "snippet": "Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên ...",
        "text": "Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn , trong khi    Gemini  được thiết kế  đa phương thức  (tích hợp xử lý văn bản, mã nguồn, hình ảnh) nhằm mở rộng khả năng     phân tích và tạo nội dung trên nhiều dạng dữ liệu . Những  đột phá kỹ thuật  này không chỉ nâng cao hiệu suất tổng thể của mô hình  mà còn  mở đường cho các ứng dụng LLM sáng tạo  trong các lĩnh vực chuyên sâu (ví dụ trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v.) .  Bên cạnh khía cạnh kỹ thuật,  các nghiên cứu ứng dụng  cho thấy LLM có  tác động tích cực trong hoạt động thực tiễn .",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 1,
        "score": 0.6537758541107167,
        "startOffset": 1219,
        "endOffset": 1982,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      },
      {
        "index": 10,
        "snippet": "mặt dữ kiện hoặc mang định kiến . Điều này bắt nguồn từ việc mô hình  chưa thực sự “hiểu” ý nghĩa sâu xa của ngôn ngữ  mà chỉ dự đoán theo thống kê. B...",
        "text": "mặt dữ kiện hoặc mang định kiến . Điều này bắt nguồn từ việc mô hình  chưa thực sự “hiểu” ý nghĩa sâu xa của ngôn ngữ  mà chỉ dự đoán theo thống kê. Bên cạnh đó,  chi phí tính toán  để huấn luyện và vận hành những mô hình lớn như GPT-3 là  rất cao , đòi hỏi tài nguyên phần cứng khổng lồ. Các hướng nghiên cứu mới (như kiến trúc MoE) đang được triển khai nhằm  cải thiện hiệu quả tính toán , giúp mô hình  chạy nhanh hơn với chi phí thấp hơn . Nhìn sang  thế hệ mô hình mới hơn ,   ChatGPT  (dựa trên GPT-3.5/GPT-4, có áp dụng RLHF) và  Google Gemini  (mô hình đa phương thức tiên tiến) là hai đại diện nổi bật cho  nền tảng LLM thương mại vào năm 2025 . Cả hai đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ, nhưng  mỗi mô hình có thế mạnh riêng .",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 2,
        "score": 0.5986268327164945,
        "startOffset": 5452,
        "endOffset": 6206,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      },
      {
        "index": 7,
        "snippet": "các mô hình được huấn luyện chuyên biệt  cho tác vụ tương ứng,  cho thấy hiệu quả của việc mở rộng quy mô và học từ ngữ cảnh . Một công trình nghiên c...",
        "text": "các mô hình được huấn luyện chuyên biệt  cho tác vụ tương ứng,  cho thấy hiệu quả của việc mở rộng quy mô và học từ ngữ cảnh . Một công trình nghiên cứu tiêu biểu đã tổng kết  các đặc điểm chính của mô hình GPT-3  và dòng LLM hiện đại như sau : Kiến trúc và dữ liệu huấn luyện:  GPT-3 và các thế hệ kế nhiệm  được xây dựng trên kiến trúc Transformer ,  huấn luyện trên tập dữ liệu văn bản khổng lồ  (hàng trăm tỷ từ) bao gồm nhiều nguồn khác nhau . Quy mô tham số cực lớn (GPT-3 có 175 tỷ tham số) cho phép mô hình  học được biểu diễn ngôn ngữ rất đa dạng , làm nền tảng cho hiệu suất cao trên nhiều nhiệm vụ. Khả năng học từ ít ví dụ:  GPT-3 có khả năng  thực hiện nhiều nhiệm vụ chỉ dựa trên một vài ví dụ hoặc thậm chí không cần ví dụ minh họa  (few-shot learning).",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 2,
        "score": 0.5683031606674183,
        "startOffset": 3822,
        "endOffset": 4591,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      },
      {
        "index": 12,
        "snippet": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tu...",
        "text": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay.",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 2,
        "score": 0.5453345510164146,
        "startOffset": 6614,
        "endOffset": 7354,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      },
      {
        "index": 5,
        "snippet": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . V...",
        "text": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng cho từng tác vụ .",
        "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
        "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
        "page": 1,
        "score": 0.5294793930184298,
        "startOffset": 2845,
        "endOffset": 3417,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      }
    ],
    "chat": {
      "id": "3538ea80-e655-45e2-ad7a-5952871e1f2c",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:44:56.699Z",
      "updatedAt": "2025-12-25T06:45:04.120Z",
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
      "messages": [
        {
          "role": "user",
          "content": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì"
        },
        {
          "role": "assistant",
          "content": "Tài liệu nghiên cứu về các mô hình ngôn ngữ lớn (LLM) hiện đại, tập trung chủ yếu vào ChatGPT của OpenAI và Gemini của Google. Ngoài ra, tài liệu cũng đề cập đến GPT-3 như một ví dụ tiêu biểu cho thế hệ LLM trước đó [#0][#5][#10].\n\nCác điểm mạnh nổi bật của các LLM này bao gồm:\n\n1. Khả năng xử lý ngôn ngữ tự nhiên vượt trội: LLM hiện đại có thể hiểu, sinh ngôn ngữ và suy luận dựa trên ngôn ngữ, tạo nên bước đột phá trong lĩnh vực NLP [#0][#13].\n2. Ứng dụng đa lĩnh vực: Các mô hình như ChatGPT và Gemini được ứng dụng rộng rãi trong y tế, tài chính, giáo dục, dịch vụ khách hàng, giúp cá nhân hóa phản hồi và giải quyết các nhiệm vụ phân tích phức tạp [#1].\n3. Kỹ thuật tiên tiến:\n   - ChatGPT sử dụng học tăng cường từ phản hồi của con người (RLHF) để nâng cao tính mạch lạc và tự nhiên trong hội thoại [#0][#2].\n   - Gemini có kiến trúc đa phương thức, tích hợp xử lý văn bản, mã nguồn, hình ảnh, giúp mở rộng khả năng phân tích và tạo nội dung trên nhiều dạng dữ liệu [#2].\n   - Việc áp dụng Mixture-of-Experts (MoE) giúp giảm chi phí tính toán và tăng hiệu suất cho các tác vụ chuyên biệt [#1][#2][#10].\n4. Hiệu suất cao trên nhiều nhiệm vụ: Các LLM như GPT-3, ChatGPT và Gemini đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ khác nhau, với khả năng học từ ít ví dụ (few-shot learning) và không cần tinh chỉnh riêng cho từng tác vụ [#5][#7].\n5. Tiềm năng sáng tạo và ứng dụng chuyên sâu: LLM mở đường cho các ứng dụng sáng tạo như trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v. [#2].\n6. Đột phá về quy mô và dữ liệu: Việc gia tăng số lượng tham số và khối lượng dữ liệu huấn luyện đã giúp các LLM đạt được năng lực vượt trội, ví dụ GPT-3 có 175 tỷ tham số và được huấn luyện trên ~570 GB dữ liệu văn bản [#5][#7].\n\nTóm lại, tài liệu tập trung nghiên cứu các LLM như ChatGPT, Gemini và GPT-3, nhấn mạnh điểm mạnh về khả năng xử lý ngôn ngữ, ứng dụng đa lĩnh vực, kỹ thuật tiên tiến, hiệu suất cao và tiềm năng ứng dụng thực tiễn [#0][#1][#2][#5][#7][#10][#13].",
          "citation": [
            {
              "page": 1,
              "text": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn .",
              "index": 0,
              "score": 0.7498443037178695,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng t...",
              "endOffset": 769,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 0
            },
            {
              "page": 2,
              "text": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay. Những kết quả đạt được cho thấy  sự vượt trội của mô hình ngôn ngữ lớn  trong việc  xử lý ngôn ngữ tự nhiên và tư duy đa dạng , đồng thời nhấn mạnh  tiềm năng ứng dụng rộng rãi  của chúng vào thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về  những thách thức còn tồn tại  – từ việc cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination  cho đến  tối ưu hóa chi phí tính toán  – nhằm tiếp tục hoàn thiện và  phát huy tối đa lợi ích của các mô hình LLM  trong tương lai. 12 11 •  11 •  12 •  12 •  13 14 15 16 1 7 17 2",
              "index": 13,
              "score": 0.7062428998947131,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay....",
              "endOffset": 7931,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 7203
            },
            {
              "page": 1,
              "text": "hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đang được ứng dụng  rộng rãi trong các lĩnh vực  y tế, tài chính, giáo dục, dịch vụ khách hàng , giúp  cá nhân hóa phản hồi  và giải quyết những nhiệm vụ phân tích phức tạp . Động lực phát triển LLM  xuất phát từ nhu cầu giải quyết các bài toán thực tế ngày càng phức tạp với độ chính xác cao . Để đáp ứng điều đó, các nghiên cứu đã liên tục cải tiến kiến trúc mô hình và phương pháp huấn luyện. Chẳng hạn, việc áp dụng  Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt .",
              "index": 1,
              "score": 0.6589799450916003,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn ....",
              "endOffset": 1376,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 618
            },
            {
              "page": 1,
              "text": "Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn , trong khi    Gemini  được thiết kế  đa phương thức  (tích hợp xử lý văn bản, mã nguồn, hình ảnh) nhằm mở rộng khả năng     phân tích và tạo nội dung trên nhiều dạng dữ liệu . Những  đột phá kỹ thuật  này không chỉ nâng cao hiệu suất tổng thể của mô hình  mà còn  mở đường cho các ứng dụng LLM sáng tạo  trong các lĩnh vực chuyên sâu (ví dụ trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v.) .  Bên cạnh khía cạnh kỹ thuật,  các nghiên cứu ứng dụng  cho thấy LLM có  tác động tích cực trong hoạt động thực tiễn .",
              "index": 2,
              "score": 0.6537758541107167,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên ...",
              "endOffset": 1982,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 1219
            },
            {
              "page": 2,
              "text": "mặt dữ kiện hoặc mang định kiến . Điều này bắt nguồn từ việc mô hình  chưa thực sự “hiểu” ý nghĩa sâu xa của ngôn ngữ  mà chỉ dự đoán theo thống kê. Bên cạnh đó,  chi phí tính toán  để huấn luyện và vận hành những mô hình lớn như GPT-3 là  rất cao , đòi hỏi tài nguyên phần cứng khổng lồ. Các hướng nghiên cứu mới (như kiến trúc MoE) đang được triển khai nhằm  cải thiện hiệu quả tính toán , giúp mô hình  chạy nhanh hơn với chi phí thấp hơn . Nhìn sang  thế hệ mô hình mới hơn ,   ChatGPT  (dựa trên GPT-3.5/GPT-4, có áp dụng RLHF) và  Google Gemini  (mô hình đa phương thức tiên tiến) là hai đại diện nổi bật cho  nền tảng LLM thương mại vào năm 2025 . Cả hai đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ, nhưng  mỗi mô hình có thế mạnh riêng .",
              "index": 10,
              "score": 0.5986268327164945,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "mặt dữ kiện hoặc mang định kiến . Điều này bắt nguồn từ việc mô hình  chưa thực sự “hiểu” ý nghĩa sâu xa của ngôn ngữ  mà chỉ dự đoán theo thống kê. B...",
              "endOffset": 6206,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 5452
            },
            {
              "page": 2,
              "text": "các mô hình được huấn luyện chuyên biệt  cho tác vụ tương ứng,  cho thấy hiệu quả của việc mở rộng quy mô và học từ ngữ cảnh . Một công trình nghiên cứu tiêu biểu đã tổng kết  các đặc điểm chính của mô hình GPT-3  và dòng LLM hiện đại như sau : Kiến trúc và dữ liệu huấn luyện:  GPT-3 và các thế hệ kế nhiệm  được xây dựng trên kiến trúc Transformer ,  huấn luyện trên tập dữ liệu văn bản khổng lồ  (hàng trăm tỷ từ) bao gồm nhiều nguồn khác nhau . Quy mô tham số cực lớn (GPT-3 có 175 tỷ tham số) cho phép mô hình  học được biểu diễn ngôn ngữ rất đa dạng , làm nền tảng cho hiệu suất cao trên nhiều nhiệm vụ. Khả năng học từ ít ví dụ:  GPT-3 có khả năng  thực hiện nhiều nhiệm vụ chỉ dựa trên một vài ví dụ hoặc thậm chí không cần ví dụ minh họa  (few-shot learning).",
              "index": 7,
              "score": 0.5683031606674183,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "các mô hình được huấn luyện chuyên biệt  cho tác vụ tương ứng,  cho thấy hiệu quả của việc mở rộng quy mô và học từ ngữ cảnh . Một công trình nghiên c...",
              "endOffset": 4591,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 3822
            },
            {
              "page": 2,
              "text": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay.",
              "index": 12,
              "score": 0.5453345510164146,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tu...",
              "endOffset": 7354,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 6614
            },
            {
              "page": 1,
              "text": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng cho từng tác vụ .",
              "index": 5,
              "score": 0.5294793930184298,
              "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
              "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
              "snippet": "hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . V...",
              "endOffset": 3417,
              "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
              "startOffset": 2845
            }
          ]
        }
      ]
    }
  }
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

### **DELETE** `/documents/:documentId`

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
    "answer": "Theo tài liệu \"LV_CTUET_ThinhNhat.pdf\", hệ thống trong luận văn của tác giả Trường Thịnh và Minh Nhật được xây dựng dựa trên việc kết hợp AI, Python, LangChain và sử dụng các file PDF để giải quyết các vấn đề liên quan đến thủ tục hành chính trong trường đại học. Cụ thể, Python là ngôn ngữ lập trình chính, sử dụng các thư viện hỗ trợ từ LangChain và API của mô hình OpenAI để xử lý dữ liệu từ các file PDF. Hệ thống này có khả năng trả lời đúng 94% các câu hỏi về hỗ trợ hành chính dựa trên dữ liệu của trường, cho thấy việc tích hợp AI với cơ sở dữ liệu hành chính là khả thi [#25].\n\nTuy nhiên, tài liệu không mô tả chi tiết về kiến trúc hệ thống theo mô hình RAG (Retrieval-Augmented Generation). RAG là kiến trúc kết hợp giữa truy xuất thông tin (retrieval) từ một kho dữ liệu và sinh văn bản (generation) dựa trên thông tin truy xuất được. Trong khi hệ thống của luận văn có sử dụng AI để xử lý và trả lời câu hỏi dựa trên dữ liệu PDF, tài liệu không đề cập rõ ràng đến việc có một thành phần truy xuất tài liệu độc lập (retriever) kết hợp với mô hình sinh (generator) như trong kiến trúc RAG. Do đó, có thể nhận định rằng hệ thống này là một phiên bản đơn giản hơn, chủ yếu dựa vào tích hợp AI với dữ liệu PDF thông qua LangChain và OpenAI API, chứ chưa phải là một kiến trúc RAG hoàn chỉnh [#25].\n\nTóm lại: Kiến trúc hệ thống của luận văn là một phiên bản đơn giản hơn so với kiến trúc RAG, chủ yếu tập trung vào tích hợp AI với dữ liệu PDF mà chưa có sự phân tách rõ ràng giữa các thành phần truy xuất và sinh như RAG [#25].",
    "citations": [
      {
        "index": 25,
        "snippet": "đánh giá: Nhóm cho rằng việc kết hợp AI và thủ tục hành chính thông qua các file hành chính của trường có thể đáp ứng được các nhu cầu đề tài đề ra. B...",
        "text": "đánh giá: Nhóm cho rằng việc kết hợp AI và thủ tục hành chính thông qua các file hành chính của trường có thể đáp ứng được các nhu cầu đề tài đề ra. Bằng việc xây dựng hệ thống ứng dụng từ việc kết hợp AI, Python, LangChain và sử dụng PDF để giải quyết vấn đề xoay quanh đề tài, lấy Python làm ngôn ngữ lập trình chính, nhóm sử dụng các viện hỗ trợ từ LangChain và API từ mô hình OpenAI hỗ trợ cho việc xử lý dữ liệu từ các file PDF. Sau khi tận dụng và xây dựng đề tài, nhóm đã nghiệm thu và thống kê lại kết quả và đánh giá hệ thống ứng dụng có thể trả lời đúng 94% hầu như tất cả các hỏi về mặt hỗ trợ hành chính từ các file dữ liệu của Trường. Thông qua thống kê đã được nêu, nhóm cho rằng việc kết hợp AI và cơ sở dữ liệu hành chính từ Trường là khả thi. 2.2.",
        "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
        "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
        "page": 13,
        "score": 0.843311877349373,
        "startOffset": 13624,
        "endOffset": 14389
      },
      {
        "index": 98,
        "snippet": "văn ở bậc Đại\nhọc.\n\n2TC\n\nG0LT\n\n0 TH)\n\n35\n\nCông nghệ\nNET\n\nHọc phân này nhăm giúp sinh viên bước đầu\nIàm quen với môi trường .NET thông qua\n\n2TC\n\n(15LT\n...",
        "text": "văn ở bậc Đại\nhọc.\n\n2TC\n\nG0LT\n\n0 TH)\n\n35\n\nCông nghệ\nNET\n\nHọc phân này nhăm giúp sinh viên bước đầu\nIàm quen với môi trường .NET thông qua\n\n2TC\n\n(15LT\n\n31\nTT Tên học Nội dung cân đạt được của học phân Khối Ghi chú\nphân Iượng\nkiên\nthức\nngôn ngữ Iập! trình C . Sinh viên thực hiện 30 TH)\nnhiều ví dụ để nắm rõ hơn các kỹ thuật Iập\ntrình hướng đối tượng, tận dụng các ưu điểm\ndo nền Iẳng .NET cung cấp. Liên kết với các\nhọc phần khác để xây dựng một ứng dụng\nquản Iý thông tin hoàn chỉnh\n36. Lập trình Học phân này cung cấp cho sinh viên một 2TC\nJava 1 khối Iượng kiến thức tương đối hoàn chỉnh về. (15 LT,\nIập trình Java. Các nội dung chủ yêu bao 30 TH)\ngồm: Các kiểu dữ liệu cơ sở, hằng, biến, Iệnh\nvà khối Iệnh, mảng: Lập trình hướng đối\ntượng trong Java; Lập trình giao diện với",
        "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
        "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
        "page": 1,
        "score": 0.8431778384202074,
        "startOffset": 55567,
        "endOffset": 56346
      },
      {
        "index": 107,
        "snippet": "nội dung chính: tông 3TC\nliệu đa quan về dữ liệu đa phương tiện và hệ cơ SỞ dữ (30LT,\nphương tiện liệu đa phương tiện, các kỹ thuật truy xuất 30 TH)\n\n...",
        "text": "nội dung chính: tông 3TC\nliệu đa quan về dữ liệu đa phương tiện và hệ cơ SỞ dữ (30LT,\nphương tiện liệu đa phương tiện, các kỹ thuật truy xuất 30 TH)\n\nthông tin đối với dữ liệu văn bản, hình ảnh,\nâm thanh, video; kiến trúc cơ sở dữ liệu đa\nphương tiện\n\n47. Phát triên Học phân giới thiệu cho sinh viên các kiến 3TC\nứng dụng IoT thức về nền tảng cho sự kết nối các thiết bị Q0LT,\n\nvới Internet, JoT. Học phần trang bị các kỹ 30 TH)\nnăng thực hành về Iập trình JoT và các kỹ\nthuật thiết kế hệ thống loT.\n\n48. Nguyên Iý Học phần này cung cấp cho sinh viên các kiến 2 TC\nthiết kê và thức về nguyên tắc thiết kế hệ thống phần Q30LT,\nkiên trúc mềm, vận dụng hiệu quả kỹ thuật thiết kế kiến 0 TH)\nphân mềm trúc. Những vấn đề chuyên sâu về thiết kế",
        "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
        "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
        "page": 1,
        "score": 0.8431458996788883,
        "startOffset": 60741,
        "endOffset": 61482
      },
      {
        "index": 191,
        "snippet": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên 49 Em chưa biết lập trình thì em có thể theo học ngành này tại trường hay không? Có ...",
        "text": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên 49 Em chưa biết lập trình thì em có thể theo học ngành này tại trường hay không? Có thể, Khi vào học các chương trình của Trường, em sẽ có nhiều cơ hội học bổ sung những mảng kiến thức để hỗ trợ cho định hướng nghề nghiệp trong tương lai. Khi vào học chương trình Hệ thống thông tin tại Trường ĐH Kỹ thuật - Công nghệ Cần Thơ, em sẽ được học bổ sung những kiến thức cần thiết để hỗ trợ cho định hướng nghề nghiệp trong tương lai. Tuy nhiên, việc biết lập trình sẽ là một lợi thế trong việc học ngành này, vì lập trình là một trong những kỹ năng quan trọng trong lĩnh vực Hệ thống thông tin. Nếu em chưa biết lập trình, em vẫn có thể học ngành này, nhưng em nên sẵn sàng học và nắm vững kiến thức lập trình trong quá trình học tập.",
        "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
        "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
        "page": 93,
        "score": 0.8426130320199151,
        "startOffset": 102095,
        "endOffset": 102892
      },
      {
        "index": 69,
        "snippet": "Thiếu khả năng nhận thức thực: OpenAI phản hồi dựa trên mẫu ngôn ngữ và không có khả năng hiểu cảm xúc hoặc tình huống phức tạp như con người thật sự....",
        "text": "Thiếu khả năng nhận thức thực: OpenAI phản hồi dựa trên mẫu ngôn ngữ và không có khả năng hiểu cảm xúc hoặc tình huống phức tạp như con người thật sự. • Kết luận: OpenAI là một mô hình GenAI mạnh mẽ và nổi tiếng nhất hiện nay, họ đã cải tiến việc nhận dạng bằng hình ảnh hay có thể chuyển đổi từ PDF sang Word hoặc ngược lại, nhưng vì được quá nhiều người biết đến, việc lạm dụng OpenAI vào các bài viết tiểu luận, luận văn ngày một nhiều hơn làm mất tính minh bạch. 14",
        "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
        "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
        "page": 25,
        "score": 0.8424148610132765,
        "startOffset": 35844,
        "endOffset": 36314
      },
      {
        "index": 44,
        "snippet": "(VR), Xếp loại/Đánh giá và Tuyển sinh. Nó giảm thiểu các nhiệm vụ hành chính của giáo viên để đầu tư nhiều hơn vào việc giảng dạy và hướng dẫn học sin...",
        "text": "(VR), Xếp loại/Đánh giá và Tuyển sinh. Nó giảm thiểu các nhiệm vụ hành chính của giáo viên để đầu tư nhiều hơn vào việc giảng dạy và hướng dẫn học sinh. Trong thời đại hiện nay, khi có rất nhiều nhiệm vụ liên quan đến nghề giáo, AIA đóng góp đáng kể vào việc nâng cao việc học của học sinh, giảm thiểu khối lượng công việc của giáo viên, xếp loại/đánh giá học sinh một cách hiệu quả và dễ dàng, đồng thời hỗ trợ nhiều nhiệm vụ hành chính khác. Nghiên cứu cần được kiểm tra định lượng để khái quát hóa và chấp nhận được. Các mô hình ngôn ngữ có khả năng xử lý các ví dụ nhỏ[5] tập trung vào việc giới thiệu mô hình Transformer có khả năng xử lý văn bản dài, được thực hiện bởi nhóm tác giả: Beltagy, Iz Peters, Matthew E và Cohan Arman.",
        "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
        "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
        "page": 18,
        "score": 0.8423429442150278,
        "startOffset": 22510,
        "endOffset": 23246
      },
      {
        "index": 88,
        "snippet": "gồm: những hiểu biết mởrộng 2TC\nHệ thống về các hệ thống thông tin được sử dụng để đạt (30 LT,\nthông tin được các mục tiêu của công ty. Các công . 0TH...",
        "text": "gồm: những hiểu biết mởrộng 2TC\nHệ thống về các hệ thống thông tin được sử dụng để đạt (30 LT,\nthông tin được các mục tiêu của công ty. Các công . 0TH)\n\nnghệ hiện đại sẽ góp phần vào sự phát triển\ntrong tương lai của các hệ thống và ứng dụng\nCNTT cũng sẽ được giới thiệu. Các vấn đề\ngÓP phân vào việc Iập kê hoạch, thiết kê, phát\ntriên, triển khai và quản Iý thành công các hệ\nthống thông tin.\n\n24. Kỹthuậtlập Học phần này cung cấp cho sinh viên kỹ năng 3 TC\ntrình Iập trình căn bản, có khả năng mô hình hóa (30LT,\n\nbài toán bằng Iưu đồ giải thuật, hiểu định 30 TH)\n\nnghĩa các kiểu dữ liệu, định nghĩa kiểu dữ liệu\nmới dựa trên các kiểu dựng săn, xây dựng và\nsử dụng hàm, có khả năng truy xuất và Iưu trữ\ndữ liệu dưới dạng tập tin... thông qua một\nngôn ngữ Iập trình cụ thê\n\n29\nTT\n\nTên học\nphân",
        "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
        "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
        "page": 1,
        "score": 0.8422962354929371,
        "startOffset": 50226,
        "endOffset": 51022
      },
      {
        "index": 26,
        "snippet": "từ các file dữ liệu của Trường. Thông qua thống kê đã được nêu, nhóm cho rằng việc kết hợp AI và cơ sở dữ liệu hành chính từ Trường là khả thi. 2.2.  ...",
        "text": "từ các file dữ liệu của Trường. Thông qua thống kê đã được nêu, nhóm cho rằng việc kết hợp AI và cơ sở dữ liệu hành chính từ Trường là khả thi. 2.2.  Phạm vi nghiên cứu 2.2.1  Phạm vi không gian Phạm vi không gian của đề tài Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên trong khu vực trường đại học. Tập trung vào việc phát triển và triển 2",
        "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
        "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
        "page": 13,
        "score": 0.8422861767496519,
        "startOffset": 14240,
        "endOffset": 14602
      }
    ],
    "chat": {
      "id": "05db033f-643d-4cbc-92cc-8b13538eb217",
      "title": "New Chat",
      "createdAt": "2025-12-25T05:07:23.316Z",
      "updatedAt": "2025-12-25T05:07:32.142Z",
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "projectId": null,
      "messages": [
        {
          "role": "user",
          "content": "Cho tôi biết kiến trúc hệ thống của luận văn tốt nghiệp của tác giả Trường Thịnh và Minh Nhật. Vậy kiến trúc này có giống kiến trúc RAG không hay chỉ là một phiên bản đơn giản hơn"
        },
        {
          "role": "assistant",
          "content": "Theo tài liệu \"LV_CTUET_ThinhNhat.pdf\", hệ thống trong luận văn của tác giả Trường Thịnh và Minh Nhật được xây dựng dựa trên việc kết hợp AI, Python, LangChain và sử dụng các file PDF để giải quyết các vấn đề liên quan đến thủ tục hành chính trong trường đại học. Cụ thể, Python là ngôn ngữ lập trình chính, sử dụng các thư viện hỗ trợ từ LangChain và API của mô hình OpenAI để xử lý dữ liệu từ các file PDF. Hệ thống này có khả năng trả lời đúng 94% các câu hỏi về hỗ trợ hành chính dựa trên dữ liệu của trường, cho thấy việc tích hợp AI với cơ sở dữ liệu hành chính là khả thi [#25].\n\nTuy nhiên, tài liệu không mô tả chi tiết về kiến trúc hệ thống theo mô hình RAG (Retrieval-Augmented Generation). RAG là kiến trúc kết hợp giữa truy xuất thông tin (retrieval) từ một kho dữ liệu và sinh văn bản (generation) dựa trên thông tin truy xuất được. Trong khi hệ thống của luận văn có sử dụng AI để xử lý và trả lời câu hỏi dựa trên dữ liệu PDF, tài liệu không đề cập rõ ràng đến việc có một thành phần truy xuất tài liệu độc lập (retriever) kết hợp với mô hình sinh (generator) như trong kiến trúc RAG. Do đó, có thể nhận định rằng hệ thống này là một phiên bản đơn giản hơn, chủ yếu dựa vào tích hợp AI với dữ liệu PDF thông qua LangChain và OpenAI API, chứ chưa phải là một kiến trúc RAG hoàn chỉnh [#25].\n\nTóm lại: Kiến trúc hệ thống của luận văn là một phiên bản đơn giản hơn so với kiến trúc RAG, chủ yếu tập trung vào tích hợp AI với dữ liệu PDF mà chưa có sự phân tách rõ ràng giữa các thành phần truy xuất và sinh như RAG [#25].",
          "citation": [
            {
              "page": 13,
              "text": "đánh giá: Nhóm cho rằng việc kết hợp AI và thủ tục hành chính thông qua các file hành chính của trường có thể đáp ứng được các nhu cầu đề tài đề ra. Bằng việc xây dựng hệ thống ứng dụng từ việc kết hợp AI, Python, LangChain và sử dụng PDF để giải quyết vấn đề xoay quanh đề tài, lấy Python làm ngôn ngữ lập trình chính, nhóm sử dụng các viện hỗ trợ từ LangChain và API từ mô hình OpenAI hỗ trợ cho việc xử lý dữ liệu từ các file PDF. Sau khi tận dụng và xây dựng đề tài, nhóm đã nghiệm thu và thống kê lại kết quả và đánh giá hệ thống ứng dụng có thể trả lời đúng 94% hầu như tất cả các hỏi về mặt hỗ trợ hành chính từ các file dữ liệu của Trường. Thông qua thống kê đã được nêu, nhóm cho rằng việc kết hợp AI và cơ sở dữ liệu hành chính từ Trường là khả thi. 2.2.",
              "index": 25,
              "score": 0.843311877349373,
              "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
              "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
              "snippet": "đánh giá: Nhóm cho rằng việc kết hợp AI và thủ tục hành chính thông qua các file hành chính của trường có thể đáp ứng được các nhu cầu đề tài đề ra. B...",
              "endOffset": 14389,
              "startOffset": 13624
            },
            {
              "page": 1,
              "text": "văn ở bậc Đại\nhọc.\n\n2TC\n\nG0LT\n\n0 TH)\n\n35\n\nCông nghệ\nNET\n\nHọc phân này nhăm giúp sinh viên bước đầu\nIàm quen với môi trường .NET thông qua\n\n2TC\n\n(15LT\n\n31\nTT Tên học Nội dung cân đạt được của học phân Khối Ghi chú\nphân Iượng\nkiên\nthức\nngôn ngữ Iập! trình C . Sinh viên thực hiện 30 TH)\nnhiều ví dụ để nắm rõ hơn các kỹ thuật Iập\ntrình hướng đối tượng, tận dụng các ưu điểm\ndo nền Iẳng .NET cung cấp. Liên kết với các\nhọc phần khác để xây dựng một ứng dụng\nquản Iý thông tin hoàn chỉnh\n36. Lập trình Học phân này cung cấp cho sinh viên một 2TC\nJava 1 khối Iượng kiến thức tương đối hoàn chỉnh về. (15 LT,\nIập trình Java. Các nội dung chủ yêu bao 30 TH)\ngồm: Các kiểu dữ liệu cơ sở, hằng, biến, Iệnh\nvà khối Iệnh, mảng: Lập trình hướng đối\ntượng trong Java; Lập trình giao diện với",
              "index": 98,
              "score": 0.8431778384202074,
              "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
              "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
              "snippet": "văn ở bậc Đại\nhọc.\n\n2TC\n\nG0LT\n\n0 TH)\n\n35\n\nCông nghệ\nNET\n\nHọc phân này nhăm giúp sinh viên bước đầu\nIàm quen với môi trường .NET thông qua\n\n2TC\n\n(15LT\n...",
              "endOffset": 56346,
              "startOffset": 55567
            },
            {
              "page": 1,
              "text": "nội dung chính: tông 3TC\nliệu đa quan về dữ liệu đa phương tiện và hệ cơ SỞ dữ (30LT,\nphương tiện liệu đa phương tiện, các kỹ thuật truy xuất 30 TH)\n\nthông tin đối với dữ liệu văn bản, hình ảnh,\nâm thanh, video; kiến trúc cơ sở dữ liệu đa\nphương tiện\n\n47. Phát triên Học phân giới thiệu cho sinh viên các kiến 3TC\nứng dụng IoT thức về nền tảng cho sự kết nối các thiết bị Q0LT,\n\nvới Internet, JoT. Học phần trang bị các kỹ 30 TH)\nnăng thực hành về Iập trình JoT và các kỹ\nthuật thiết kế hệ thống loT.\n\n48. Nguyên Iý Học phần này cung cấp cho sinh viên các kiến 2 TC\nthiết kê và thức về nguyên tắc thiết kế hệ thống phần Q30LT,\nkiên trúc mềm, vận dụng hiệu quả kỹ thuật thiết kế kiến 0 TH)\nphân mềm trúc. Những vấn đề chuyên sâu về thiết kế",
              "index": 107,
              "score": 0.8431458996788883,
              "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
              "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
              "snippet": "nội dung chính: tông 3TC\nliệu đa quan về dữ liệu đa phương tiện và hệ cơ SỞ dữ (30LT,\nphương tiện liệu đa phương tiện, các kỹ thuật truy xuất 30 TH)\n\n...",
              "endOffset": 61482,
              "startOffset": 60741
            },
            {
              "page": 93,
              "text": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên 49 Em chưa biết lập trình thì em có thể theo học ngành này tại trường hay không? Có thể, Khi vào học các chương trình của Trường, em sẽ có nhiều cơ hội học bổ sung những mảng kiến thức để hỗ trợ cho định hướng nghề nghiệp trong tương lai. Khi vào học chương trình Hệ thống thông tin tại Trường ĐH Kỹ thuật - Công nghệ Cần Thơ, em sẽ được học bổ sung những kiến thức cần thiết để hỗ trợ cho định hướng nghề nghiệp trong tương lai. Tuy nhiên, việc biết lập trình sẽ là một lợi thế trong việc học ngành này, vì lập trình là một trong những kỹ năng quan trọng trong lĩnh vực Hệ thống thông tin. Nếu em chưa biết lập trình, em vẫn có thể học ngành này, nhưng em nên sẵn sàng học và nắm vững kiến thức lập trình trong quá trình học tập.",
              "index": 191,
              "score": 0.8426130320199151,
              "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
              "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
              "snippet": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên 49 Em chưa biết lập trình thì em có thể theo học ngành này tại trường hay không? Có ...",
              "endOffset": 102892,
              "startOffset": 102095
            },
            {
              "page": 25,
              "text": "Thiếu khả năng nhận thức thực: OpenAI phản hồi dựa trên mẫu ngôn ngữ và không có khả năng hiểu cảm xúc hoặc tình huống phức tạp như con người thật sự. • Kết luận: OpenAI là một mô hình GenAI mạnh mẽ và nổi tiếng nhất hiện nay, họ đã cải tiến việc nhận dạng bằng hình ảnh hay có thể chuyển đổi từ PDF sang Word hoặc ngược lại, nhưng vì được quá nhiều người biết đến, việc lạm dụng OpenAI vào các bài viết tiểu luận, luận văn ngày một nhiều hơn làm mất tính minh bạch. 14",
              "index": 69,
              "score": 0.8424148610132765,
              "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
              "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
              "snippet": "Thiếu khả năng nhận thức thực: OpenAI phản hồi dựa trên mẫu ngôn ngữ và không có khả năng hiểu cảm xúc hoặc tình huống phức tạp như con người thật sự....",
              "endOffset": 36314,
              "startOffset": 35844
            },
            {
              "page": 18,
              "text": "(VR), Xếp loại/Đánh giá và Tuyển sinh. Nó giảm thiểu các nhiệm vụ hành chính của giáo viên để đầu tư nhiều hơn vào việc giảng dạy và hướng dẫn học sinh. Trong thời đại hiện nay, khi có rất nhiều nhiệm vụ liên quan đến nghề giáo, AIA đóng góp đáng kể vào việc nâng cao việc học của học sinh, giảm thiểu khối lượng công việc của giáo viên, xếp loại/đánh giá học sinh một cách hiệu quả và dễ dàng, đồng thời hỗ trợ nhiều nhiệm vụ hành chính khác. Nghiên cứu cần được kiểm tra định lượng để khái quát hóa và chấp nhận được. Các mô hình ngôn ngữ có khả năng xử lý các ví dụ nhỏ[5] tập trung vào việc giới thiệu mô hình Transformer có khả năng xử lý văn bản dài, được thực hiện bởi nhóm tác giả: Beltagy, Iz Peters, Matthew E và Cohan Arman.",
              "index": 44,
              "score": 0.8423429442150278,
              "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
              "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
              "snippet": "(VR), Xếp loại/Đánh giá và Tuyển sinh. Nó giảm thiểu các nhiệm vụ hành chính của giáo viên để đầu tư nhiều hơn vào việc giảng dạy và hướng dẫn học sin...",
              "endOffset": 23246,
              "startOffset": 22510
            },
            {
              "page": 1,
              "text": "gồm: những hiểu biết mởrộng 2TC\nHệ thống về các hệ thống thông tin được sử dụng để đạt (30 LT,\nthông tin được các mục tiêu của công ty. Các công . 0TH)\n\nnghệ hiện đại sẽ góp phần vào sự phát triển\ntrong tương lai của các hệ thống và ứng dụng\nCNTT cũng sẽ được giới thiệu. Các vấn đề\ngÓP phân vào việc Iập kê hoạch, thiết kê, phát\ntriên, triển khai và quản Iý thành công các hệ\nthống thông tin.\n\n24. Kỹthuậtlập Học phần này cung cấp cho sinh viên kỹ năng 3 TC\ntrình Iập trình căn bản, có khả năng mô hình hóa (30LT,\n\nbài toán bằng Iưu đồ giải thuật, hiểu định 30 TH)\n\nnghĩa các kiểu dữ liệu, định nghĩa kiểu dữ liệu\nmới dựa trên các kiểu dựng săn, xây dựng và\nsử dụng hàm, có khả năng truy xuất và Iưu trữ\ndữ liệu dưới dạng tập tin... thông qua một\nngôn ngữ Iập trình cụ thê\n\n29\nTT\n\nTên học\nphân",
              "index": 88,
              "score": 0.8422962354929371,
              "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
              "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
              "snippet": "gồm: những hiểu biết mởrộng 2TC\nHệ thống về các hệ thống thông tin được sử dụng để đạt (30 LT,\nthông tin được các mục tiêu của công ty. Các công . 0TH...",
              "endOffset": 51022,
              "startOffset": 50226
            },
            {
              "page": 13,
              "text": "từ các file dữ liệu của Trường. Thông qua thống kê đã được nêu, nhóm cho rằng việc kết hợp AI và cơ sở dữ liệu hành chính từ Trường là khả thi. 2.2.  Phạm vi nghiên cứu 2.2.1  Phạm vi không gian Phạm vi không gian của đề tài Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên trong khu vực trường đại học. Tập trung vào việc phát triển và triển 2",
              "index": 26,
              "score": 0.8422861767496519,
              "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
              "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
              "snippet": "từ các file dữ liệu của Trường. Thông qua thống kê đã được nêu, nhóm cho rằng việc kết hợp AI và cơ sở dữ liệu hành chính từ Trường là khả thi. 2.2.  ...",
              "endOffset": 14602,
              "startOffset": 14240
            }
          ]
        }
      ]
    }
  }
}
```

# 💬 Chat (With History)

## Create Chat Session

### **POST** `/project/:projectId/chats/messages`

**Param**:
projectId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Query**:
chatId = bbe027d0-74ea-4630-a846-5040a9772aaa

**Body**

```json
{
  "message": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì"
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "answer": "Tài liệu nghiên cứu về các mô hình ngôn ngữ lớn (LLM) hiện đại, tiêu biểu như ChatGPT của OpenAI và Gemini của Google. Các điểm mạnh nổi bật của các LLM này gồm:\n\n- Khả năng đột phá trong xử lý ngôn ngữ tự nhiên (NLP), cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn suy luận dựa trên ngôn ngữ[0].\n- Ứng dụng các kỹ thuật tiên tiến, ví dụ như học tăng cường từ phản hồi của con người (RLHF) nhằm nâng cao tính mạch lạc trong hội thoại (điển hình ở ChatGPT), và kiến trúc đa phương thức để xử lý đồng thời văn bản, hình ảnh, âm thanh (điển hình ở Gemini)[0].\n- Mở rộng đáng kể phạm vi ứng dụng vào thực tiễn, giúp cá nhân hóa phản hồi và giải quyết những nhiệm vụ phân tích phức tạp trong các lĩnh vực như y tế, tài chính, giáo dục, dịch vụ khách hàng[1].\n- Động lực phát triển mạnh nhờ khả năng giải quyết các bài toán thực tế với độ chính xác cao, liên tục cải tiến kiến trúc như sử dụng Mixture-of-Experts (MoE) để chỉ kích hoạt các cụm chuyên gia cần thiết, giảm chi phí tính toán và tăng hiệu suất trong những tác vụ chuyên biệt[1].\n- Nổi bật về khả năng xử lý đa dạng nhiệm vụ NLP chỉ thông qua gợi ý ngữ cảnh mà không cần tinh chỉnh riêng[4].\n- Kết quả nghiên cứu cho thấy các LLM có tiềm năng ứng dụng rộng rãi vào nhiều lĩnh vực thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ), đồng thời liên tục được nghiên cứu để giảm thiểu hạn chế còn tồn tại như sai lệch/hallucination và tối ưu hóa chi phí tính toán[11].",
    "citations": [
      {
        "index": 0,
        "snippet": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong n...",
        "text": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đa",
        "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
        "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
        "page": 1,
        "chunkIndex": 0,
        "startOffset": 0,
        "endOffset": 800
      },
      {
        "index": 4,
        "snippet": "i gian  và  nâng cao hiệu suất  trong môi trường làm việc thực tế. Về mặt kiến trúc và hiệu năng ,   các mô hình LLM thế hệ mới đều dựa trên kiến trúc Transformer  do Google giới thiệu năm 2017 . Kiến...",
        "text": "i gian  và  nâng cao hiệu suất  trong môi trường làm việc thực tế. Về mặt kiến trúc và hiệu năng ,   các mô hình LLM thế hệ mới đều dựa trên kiến trúc Transformer  do Google giới thiệu năm 2017 . Kiến trúc này cho phép mô hình học được mối quan hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng c",
        "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
        "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
        "page": 1,
        "chunkIndex": 4,
        "startOffset": 2600,
        "endOffset": 3400
      },
      {
        "index": 11,
        "snippet": "g như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ n...",
        "text": "g như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay. Những kết quả đạt được cho thấy  sự vượt trội của mô hình ngôn ngữ lớn  trong việc  xử lý ngôn ngữ tự nhiên và tư duy đa dạng , đồng thời nhấn mạnh  tiềm năng ứng dụng rộng rãi  của chúng vào thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về  những thách thức còn tồn tại  – từ việc cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination  cho đến  tối ưu hóa chi phí tính toán  – nhằm tiếp tục hoàn thiện và  phát huy tối đa lợi ích của các mô hình LLM  trong ",
        "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
        "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
        "page": 2,
        "chunkIndex": 11,
        "startOffset": 7071,
        "endOffset": 7871
      },
      {
        "index": 2,
        "snippet": ",  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn , trong khi    Gemini  đư...",
        "text": ",  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn , trong khi    Gemini  được thiết kế  đa phương thức  (tích hợp xử lý văn bản, mã nguồn, hình ảnh) nhằm mở rộng khả năng     phân tích và tạo nội dung trên nhiều dạng dữ liệu . Những  đột phá kỹ thuật  này không chỉ nâng cao hiệu suất tổng thể của mô hình  mà còn  mở đường cho các ứng dụng LLM sáng tạo  trong các lĩnh vực chuyên sâu (ví dụ trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v.) .  Bên cạnh khía cạnh kỹ thuật,  các nghiên cứu ứng dụng  cho thấy LLM có  tác động tích cực trong hoạt động thực tiễn .   Trong lĩnh vực giáo dục , việc tích hợp công cụ AI hỗ trợ giáo viên đã  mang lại hiệu quả rõ rệt   . Một khảo sát tạ",
        "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
        "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
        "page": 1,
        "chunkIndex": 2,
        "startOffset": 1300,
        "endOffset": 2100
      },
      {
        "index": 1,
        "snippet": "ơng thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đang được ứng dụng  rộng rãi trong các lĩnh vực  y t...",
        "text": "ơng thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đang được ứng dụng  rộng rãi trong các lĩnh vực  y tế, tài chính, giáo dục, dịch vụ khách hàng , giúp  cá nhân hóa phản hồi  và giải quyết những nhiệm vụ phân tích phức tạp . Động lực phát triển LLM  xuất phát từ nhu cầu giải quyết các bài toán thực tế ngày càng phức tạp với độ chính xác cao . Để đáp ứng điều đó, các nghiên cứu đã liên tục cải tiến kiến trúc mô hình và phương pháp huấn luyện. Chẳng hạn, việc áp dụng  Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi",
        "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
        "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
        "page": 1,
        "chunkIndex": 1,
        "startOffset": 650,
        "endOffset": 1450
      }
    ],
    "relateDocs": [
      {
        "pageContent": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đa",
        "metadata": {
          "page": 1,
          "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
          "endOffset": 800,
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
          "chunkIndex": 0,
          "startOffset": 0
        },
        "id": "8bf3f655-6ea8-461a-9522-d7158f77cd5f"
      },
      {
        "pageContent": "i gian  và  nâng cao hiệu suất  trong môi trường làm việc thực tế. Về mặt kiến trúc và hiệu năng ,   các mô hình LLM thế hệ mới đều dựa trên kiến trúc Transformer  do Google giới thiệu năm 2017 . Kiến trúc này cho phép mô hình học được mối quan hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng c",
        "metadata": {
          "page": 1,
          "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
          "endOffset": 3400,
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
          "chunkIndex": 4,
          "startOffset": 2600
        },
        "id": "d34c23be-370b-4641-ad64-33f0633beb2b"
      },
      {
        "pageContent": "g như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay. Những kết quả đạt được cho thấy  sự vượt trội của mô hình ngôn ngữ lớn  trong việc  xử lý ngôn ngữ tự nhiên và tư duy đa dạng , đồng thời nhấn mạnh  tiềm năng ứng dụng rộng rãi  của chúng vào thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về  những thách thức còn tồn tại  – từ việc cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination  cho đến  tối ưu hóa chi phí tính toán  – nhằm tiếp tục hoàn thiện và  phát huy tối đa lợi ích của các mô hình LLM  trong ",
        "metadata": {
          "page": 2,
          "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
          "endOffset": 7871,
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
          "chunkIndex": 11,
          "startOffset": 7071
        },
        "id": "e391deeb-ed69-413d-a09d-52e23addf065"
      },
      {
        "pageContent": ",  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn , trong khi    Gemini  được thiết kế  đa phương thức  (tích hợp xử lý văn bản, mã nguồn, hình ảnh) nhằm mở rộng khả năng     phân tích và tạo nội dung trên nhiều dạng dữ liệu . Những  đột phá kỹ thuật  này không chỉ nâng cao hiệu suất tổng thể của mô hình  mà còn  mở đường cho các ứng dụng LLM sáng tạo  trong các lĩnh vực chuyên sâu (ví dụ trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v.) .  Bên cạnh khía cạnh kỹ thuật,  các nghiên cứu ứng dụng  cho thấy LLM có  tác động tích cực trong hoạt động thực tiễn .   Trong lĩnh vực giáo dục , việc tích hợp công cụ AI hỗ trợ giáo viên đã  mang lại hiệu quả rõ rệt   . Một khảo sát tạ",
        "metadata": {
          "page": 1,
          "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
          "endOffset": 2100,
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
          "chunkIndex": 2,
          "startOffset": 1300
        },
        "id": "9bd2966f-5aff-49e2-a75b-52518a39df0b"
      },
      {
        "pageContent": "ơng thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đang được ứng dụng  rộng rãi trong các lĩnh vực  y tế, tài chính, giáo dục, dịch vụ khách hàng , giúp  cá nhân hóa phản hồi  và giải quyết những nhiệm vụ phân tích phức tạp . Động lực phát triển LLM  xuất phát từ nhu cầu giải quyết các bài toán thực tế ngày càng phức tạp với độ chính xác cao . Để đáp ứng điều đó, các nghiên cứu đã liên tục cải tiến kiến trúc mô hình và phương pháp huấn luyện. Chẳng hạn, việc áp dụng  Mixture-of-Experts (MoE)  giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết,  giảm chi phí tính toán và tăng hiệu suất  cho những tác vụ chuyên biệt . Song song,     RLHF trong ChatGPT  giúp mô hình  hiểu ngữ cảnh và phản hồi",
        "metadata": {
          "page": 1,
          "fileId": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "fileUrl": "uploads\\documents\\1765071449784-107452698.pdf",
          "endOffset": 1450,
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
          "chunkIndex": 1,
          "startOffset": 650
        },
        "id": "575204df-051d-45cb-a579-dc007df9faf9"
      }
    ],
    "chat": {
      "id": "db4d69de-d88f-4ae8-8dc1-d087907dc195",
      "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
      "title": "New Chat",
      "messages": [
        {
          "role": "user",
          "content": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì"
        },
        {
          "role": "assistant",
          "content": "Tài liệu nghiên cứu về các mô hình ngôn ngữ lớn (LLM) hiện đại, tiêu biểu như ChatGPT của OpenAI và Gemini của Google. Các điểm mạnh nổi bật của các LLM này gồm:\n\n- Khả năng đột phá trong xử lý ngôn ngữ tự nhiên (NLP), cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn suy luận dựa trên ngôn ngữ[0].\n- Ứng dụng các kỹ thuật tiên tiến, ví dụ như học tăng cường từ phản hồi của con người (RLHF) nhằm nâng cao tính mạch lạc trong hội thoại (điển hình ở ChatGPT), và kiến trúc đa phương thức để xử lý đồng thời văn bản, hình ảnh, âm thanh (điển hình ở Gemini)[0].\n- Mở rộng đáng kể phạm vi ứng dụng vào thực tiễn, giúp cá nhân hóa phản hồi và giải quyết những nhiệm vụ phân tích phức tạp trong các lĩnh vực như y tế, tài chính, giáo dục, dịch vụ khách hàng[1].\n- Động lực phát triển mạnh nhờ khả năng giải quyết các bài toán thực tế với độ chính xác cao, liên tục cải tiến kiến trúc như sử dụng Mixture-of-Experts (MoE) để chỉ kích hoạt các cụm chuyên gia cần thiết, giảm chi phí tính toán và tăng hiệu suất trong những tác vụ chuyên biệt[1].\n- Nổi bật về khả năng xử lý đa dạng nhiệm vụ NLP chỉ thông qua gợi ý ngữ cảnh mà không cần tinh chỉnh riêng[4].\n- Kết quả nghiên cứu cho thấy các LLM có tiềm năng ứng dụng rộng rãi vào nhiều lĩnh vực thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ), đồng thời liên tục được nghiên cứu để giảm thiểu hạn chế còn tồn tại như sai lệch/hallucination và tối ưu hóa chi phí tính toán[11]."
        }
      ],
      "createdAt": "2025-12-07T02:21:27.513Z",
      "updatedAt": "2025-12-07T02:21:35.172Z",
      "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4"
    }
  }
}
```

## Get Chat Messages

### **GET** `/chat/:chatId`

**Param**
chatId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "65d1f823-e0d2-4e92-b32b-97351ce85561",
    "title": "New Chat",
    "createdAt": "2025-12-25T05:04:19.340Z",
    "updatedAt": "2025-12-25T05:04:23.696Z",
    "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
    "projectId": null,
    "messages": [
      {
        "role": "user",
        "content": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì"
      },
      {
        "role": "assistant",
        "content": "Theo tài liệu, nghiên cứu đã tập trung vào các mô hình ngôn ngữ lớn (LLM) hiện đại, tiêu biểu là ChatGPT của OpenAI và Gemini của Google. Đây là hai hệ thống đa năng nổi bật dựa trên nền tảng Transformer, được đánh giá là có khả năng vượt trội trong xử lý ngôn ngữ tự nhiên và tư duy đa dạng [#0][#13].\n\nCác điểm mạnh chính của những LLM này bao gồm:\n\n- Khả năng hiểu và sinh ngôn ngữ tự nhiên, cho phép máy tính không chỉ trả lời mà còn suy luận dựa trên ngôn ngữ.\n- Ứng dụng các kỹ thuật tiên tiến như học tăng cường từ phản hồi của con người (RLHF) để nâng cao tính mạch lạc trong hội thoại.\n- Kiến trúc đa phương thức, có thể xử lý đồng thời văn bản, hình ảnh, âm thanh, mở rộng phạm vi ứng dụng thực tiễn.\n- Tiềm năng ứng dụng rộng rãi trong nhiều lĩnh vực như giáo dục, y tế, tự động hóa nghiệp vụ [#0][#13].\n\nTuy nhiên, các nghiên cứu cũng chỉ ra rằng vẫn còn những thách thức như cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination và tối ưu hóa chi phí tính toán [#13].",
        "citation": [
          {
            "page": 1,
            "text": "việc nhóm và giao tiếp liên nhân của người học\n\nCách thức đánh giá\n\n55\nBài luận\n\nBài báo cáo\n\n16.6. Bài luận (Writen Assignments)\n\nMô tả phương pháp\n\nBài luận Ià một bài tóm Iược ngắn có tính thực tê cao, nhằm diễn tả, sàng Iọc, chứng\nminh hay phân tích một đề tài nào đó. Viết luận Ià một hình thức học dựa trên việc đọc\nvà nghiên cứu tài liệu. Viết luận có khả năng thê hiện được quá trình học và tư duy của\nngười học, từ đó kích thích nhu cầu học hỏi của người học\n\nCách thức thực hiện\n\nCung cấp cho người học danh sách các đề tài/vần đề đề người học Iựa chọn với\ncác yêu cầu cụ thể về bài luận\n\nHướng dẫn, cung cấp thông tin liên quan đên đê tài cho người học, vỉ dụ: nguồn\nthông tin tài liệu tham khảo, cách triển khai vấn đê, quy trình viết luận",
            "index": 168,
            "score": 0.84631662644843,
            "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
            "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
            "snippet": "việc nhóm và giao tiếp liên nhân của người học\n\nCách thức đánh giá\n\n55\nBài luận\n\nBài báo cáo\n\n16.6. Bài luận (Writen Assignments)\n\nMô tả phương pháp\n\n...",
            "endOffset": 96890,
            "startOffset": 96137
          },
          {
            "page": 15,
            "text": "phân tích các nghiên cứu, tài liệu liên quan đến ứng dụng AI trong lĩnh vực giáo dục, tự động hóa hành chính và các mô hình xử lý ngôn ngữ tự nhiên. Các nghiên cứu trong và ngoài nước sẽ được phân tích để làm rõ những thành tựu đã đạt được, những hạn chế còn tồn tại và xu hướng phát triển của lĩnh vực này. • Chương 2: Cơ sở lý thuyết , trình bày rõ mục tiêu nghiên cứu, bao gồm việc xây dựng hệ thống hỗ trợ hành chính tự động, thiết kế giao diện người dùng, phát triển thuật toán xử lý ngôn ngữ tự nhiên và tích hợp với mô hình AI. Phạm vi nghiên cứu cũng được xác định rõ ràng, tập trung vào các thủ tục hành chính cụ thể, đối tượng áp dụng và thời gian nghiên cứu. • Chương 3: Phân tích thiết kế hệ thống , trình bày chi tiết về thiết kế của hệ thống hỗ trợ hành chính.",
            "index": 33,
            "score": 0.8347144982048567,
            "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
            "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
            "snippet": "phân tích các nghiên cứu, tài liệu liên quan đến ứng dụng AI trong lĩnh vực giáo dục, tự động hóa hành chính và các mô hình xử lý ngôn ngữ tự nhiên. C...",
            "endOffset": 18404,
            "startOffset": 17629
          },
          {
            "page": 17,
            "text": "Chương 1. TỔNG QUAN 1.  Tài liệu nghiên cứu Trong đề tài này, việc lên ý tưởng cho một hệ thống có thể trả lời tự động đã được nhiều nghiên cứu khác nhau phát triển. Việc tham khảo những nghiên cứu này là điều cần thiết để xây dựng nền tảng và định hình lý thuyết cho đồ án, từ đó tận dụng các ưu điểm và khắc phục những hạn chế còn tồn đọng. Ở chương này, nhóm sẽ nghiên cứu và liệt kê các dự án nghiên cứu liên quan cũng như trong nước và ngoài nước mà nhóm có thể sử dụng trong nghiên cứu của mình. 1.1.",
            "index": 37,
            "score": 0.8322982230541972,
            "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
            "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
            "snippet": "Chương 1. TỔNG QUAN 1.  Tài liệu nghiên cứu Trong đề tài này, việc lên ý tưởng cho một hệ thống có thể trả lời tự động đã được nhiều nghiên cứu khác n...",
            "endOffset": 19949,
            "startOffset": 19442
          },
          {
            "page": 6,
            "text": "tiễn . . . . . . . . . . . . . . . . . . . . . . . . . . .    4 3.3 Bố cục của đồ án tốt nghiệp . . . . . . . . . . . . . . . . . . . . .    4 Chương 1.  TỔNG QUAN 6 1   Tài liệu nghiên cứu  . . . . . . . . . . . . . . . . . . . . . . . . . . . . .    6 1.1  Nghiên cứu trong nước . . . . . . . . . . . . . . . . . . . . . . . .    6 1.2  Nghiên cứu ngoài nước . . . . . . . . . . . . . . . . . . . . . . . .    6 2   Đối tượng và phương pháp nghiên cứu . . . . . . . . . . . . . . . . . . .    8 2.1  Đối tượng nghiên cứu . . . . . . . . . . . . . . . . . . . . . . . . .    8 2.2  Phương pháp nghiên cứu . . . . . . . . . . . . . . . . . . . . . . .    9 Chương 2.  CƠ SỞ LÝ THUYẾT 10 1   Large Language Model (LLM) . . . . . . . . . . . . . . . . . . . . . . .   10 1.1  LLM là gì?  . . . . . . .",
            "index": 6,
            "score": 0.8146038843337193,
            "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
            "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
            "snippet": "tiễn . . . . . . . . . . . . . . . . . . . . . . . . . . .    4 3.3 Bố cục của đồ án tốt nghiệp . . . . . . . . . . . . . . . . . . . . .    4 Chương ...",
            "endOffset": 3298,
            "startOffset": 2498
          },
          {
            "page": 1,
            "text": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn .",
            "index": 0,
            "score": 0.7498443037178695,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng t...",
            "endOffset": 769,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 0
          },
          {
            "page": 1,
            "text": "tính, năm được cấu trúc\ncơ bản của hệ điều hành, nguyên Iý Iàm việc\ncủa hệ điều hành và các tương tác giữa hệ\nđiều hành với người dùng.\n\n3TC\n\nQ0 LT.\n\n30 TH)\n\n34\n\nPhương pháp\nnghiên cứu\ntrong công\nnghệ thông\ntin\n\nHọc phần này cung cấp cho sinh viên các kiến\nthức cơ bản về nghiên cứu khoa học trong\ncông nghệ thông tin (CNTT). Nội dung chính\ncủa học phần Ià cung cấp kiến thức giúp sinh\nviên nắm vững phương pháp nghiên cứu,\ntrình bày một cách có hệ thống các kết quả\nnghiên cứu vào tiểu luận, luận văn ở bậc Đại\nhọc.\n\n2TC\n\nG0LT\n\n0 TH)\n\n35\n\nCông nghệ\nNET\n\nHọc phân này nhăm giúp sinh viên bước đầu\nIàm quen với môi trường .NET thông qua\n\n2TC\n\n(15LT",
            "index": 97,
            "score": 0.7192130707990888,
            "fileId": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
            "fileUrl": "uploads\\documents\\1766638786657-7059145.pdf",
            "snippet": "tính, năm được cấu trúc\ncơ bản của hệ điều hành, nguyên Iý Iàm việc\ncủa hệ điều hành và các tương tác giữa hệ\nđiều hành với người dùng.\n\n3TC\n\nQ0 LT.\n\n...",
            "endOffset": 55718,
            "startOffset": 55069
          },
          {
            "page": 2,
            "text": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay. Những kết quả đạt được cho thấy  sự vượt trội của mô hình ngôn ngữ lớn  trong việc  xử lý ngôn ngữ tự nhiên và tư duy đa dạng , đồng thời nhấn mạnh  tiềm năng ứng dụng rộng rãi  của chúng vào thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về  những thách thức còn tồn tại  – từ việc cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination  cho đến  tối ưu hóa chi phí tính toán  – nhằm tiếp tục hoàn thiện và  phát huy tối đa lợi ích của các mô hình LLM  trong tương lai. 12 11 •  11 •  12 •  12 •  13 14 15 16 1 7 17 2",
            "index": 13,
            "score": 0.7062428998947131,
            "fileId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
            "fileUrl": "uploads\\documents\\1766509585247-333190162.pdf",
            "snippet": "nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay....",
            "endOffset": 7931,
            "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "startOffset": 7203
          },
          {
            "page": 15,
            "text": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên • Sử dụng các công nghệ mã nguồn mở LangChain, OpenAI để phân tích và thu thập dữ liệu từ thư mục PDF để tổng hợp cho chatbot học. 3.2.  Ý nghĩa thực tiễn • Tạo ra được một trợ lý ảo có thể phản hồi nhanh và chính xác đến 94%, có thể sử dụng đa ngôn ngữ. • Kết quả nghiên cứu giúp làm giảm chi phí, nguồn nhân lực chi tiêu vào bộ phận hỗ trợ hành chính. • Tạo ra được một giao diện thân thiện, nâng cao trải nghiệm người dùng. 3.3.  Bố cục của đồ án tốt nghiệp Ngoài mục lục, danh mục bảng, danh mục hình, tài liệu tham khảo. Nội dung luận văn bao gồm năm chương. Trong đó phần Mở đầu sẽ giới thiệu tổng quan về đề tài, bao gồm bối cảnh và lý do chọn đề tài.",
            "index": 31,
            "score": 0.6674470581019623,
            "fileId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
            "fileUrl": "uploads\\documents\\1766638903777-216667186.pdf",
            "snippet": "Xây dựng ứng dụng học máy hỗ trợ thủ tục hành chính cho sinh viên • Sử dụng các công nghệ mã nguồn mở LangChain, OpenAI để phân tích và thu thập dữ li...",
            "endOffset": 17268,
            "startOffset": 16543
          }
        ]
      }
    ]
  }
}
```

## Get All Chats by User

### **GET** `/chat/user/all`

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
      "updatedAt": "2025-12-25T06:54:05.592Z",
      "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
    },
    {
      "id": "62dc4be3-deeb-4360-bf90-c6613efaea4a",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:52:14.196Z",
      "updatedAt": "2025-12-25T06:52:16.691Z",
      "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
    },
    {
      "id": "3538ea80-e655-45e2-ad7a-5952871e1f2c",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:44:56.699Z",
      "updatedAt": "2025-12-25T06:45:04.120Z",
      "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
    },
    {
      "id": "84cf2155-4fde-4f61-ae96-21a9f113bc85",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:44:08.271Z",
      "updatedAt": "2025-12-25T06:44:11.607Z",
      "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
    },
    {
      "id": "e2c71722-deea-4568-ad41-e385493ab389",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:43:52.259Z",
      "updatedAt": "2025-12-25T06:43:54.114Z",
      "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
    },
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

## Update chat global

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

## Delete chat global

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
