# 📘 Chatnary Backend API Endpoints

*(NestJS · Prisma · PGVector · LangChainJS)*

## Base URL

```
http://localhost:8000
```

---

# 🏠 Root

### **GET** `/api/v1/docs`

* API documents Backend

<!-- ---

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
``` -->

---

# 📁 Projects

*(Giống ChatGPT workspace — quản lý không gian dự án)*

## Create Project

### **POST** `/api/v1/project`

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
    "id": "eae33420-8426-4f3e-b055-d4afeefad60b",
    "name": "Sinoo khung bo",
    "description": "Desc ...",
    "color": "#3B82F6",
    "isArchived": false,
    "createdAt": "2025-12-08T15:48:49.375Z",
    "updatedAt": "2025-12-08T15:48:49.375Z",
    "userId": "bbe027d0-74ea-4630-a846-5040a9772d19"
  }
}
```

## List Projects by user

### **GET** `/api/v1/project`

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "46da89f2-401a-489c-98ea-4a4121d6ed91",
      "name": "AI Văn Bản",
      "description": "Project dùng để test RAG + OCR",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-04T07:46:19.870Z",
      "updatedAt": "2025-12-04T07:46:19.870Z",
      "userId": "bbe027d0-74ea-4630-a846-5040a9772d19"
    },
    {
      "id": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
      "name": "Thư Viện Số",
      "description": "Project số hóa tài liệu PDF",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-04T07:46:19.967Z",
      "updatedAt": "2025-12-04T07:46:19.967Z",
      "userId": "bbe027d0-74ea-4630-a846-5040a9772d19"
    },
    {
      "id": "eae33420-8426-4f3e-b055-d4afeefad60b",
      "name": "Sinoo khung bo",
      "description": "Desc ...",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-08T15:48:49.375Z",
      "updatedAt": "2025-12-08T15:48:49.375Z",
      "userId": "bbe027d0-74ea-4630-a846-5040a9772d19"
    }
  ]
}
```

## Update Project

### **PATCH** `/api/v1/project/:projectId`

**Param**
projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Body**

```json
{
  "name": "Sinoo khung bo 1101"
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

## List Documents in Project

### **GET** `/api/v1/project/:id/documents`

**Param**
id = eae33420-8426-4f3e-b055-d4afeefad60b

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

## Delete Project

### **DELETE** `/api/v1/project/:id`

**Param**
id = eae33420-8426-4f3e-b055-d4afeefad60b

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

https

*(Upload → OCR → Chunk → Embed → Vector Store)*

## Upload Document (Auto Ingest)

### **POST** `/api/v1/document/upload/files`

* Multipart form-data:

  * `document`: the document to upload
* Triggers:

  * Detect scanned PDF/image
  * OCR → text
  * Chunk → embeddings
  * Upsert pgvector

**Body**

```json
// multi part
{
  "projectId": "ac066e7e-8f22-40d5-b5cf-893a89b77fab",
  "files": // multi-part... from form input
}

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

### **GET** `/api/v1/document`

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
      "createdAt": "2025-12-07T04:08:06.354Z",
      "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
      "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
      "projects": {
        "id": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
        "name": "Thư Viện Số",
        "description": "Project số hóa tài liệu PDF",
        "color": "#3B82F6",
        "isArchived": false
      }
    }
  ]
}
```

## Get Document Detail by user

### **GET** `/api/v1/document/:id`

**Param**

id = 8a4457cd-9c0d-4346-a88e-16b0b1aed99e

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "8a4457cd-9c0d-4346-a88e-16b0b1aed99e",
    "name": "MGHP HK1(2025-2026).pdf",
    "filePath": "uploads\\documents\\1765080486331-485462277.pdf",
    "mimeType": "application/pdf",
    "size": 2751843,
    "status": "done",
    "createdAt": "2025-12-07T04:08:06.354Z",
    "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
    "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
    "projects": {
      "id": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
      "name": "Thư Viện Số",
      "description": "Project số hóa tài liệu PDF",
      "color": "#3B82F6",
      "isArchived": false
    }
  }
}
```

## Delete Document

### **DELETE** `/api/v1/documents/:id`

**Param**: id = 8a4457cd-9c0d-4346-a88e-16b0b1aed99e

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "bbd5fbf1-1c07-4568-83ee-0b4331d974e0",
    "name": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
    "filePath": "uploads\\documents\\1765071449784-107452698.pdf",
    "mimeType": "application/pdf",
    "size": 39998,
    "status": "done",
    "createdAt": "2025-12-07T01:37:29.792Z",
    "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4",
    "userId": "bbe027d0-74ea-4630-a846-5040a9772d19"
  }
}
```

# 💬 Chat (With History)

## Create Chat Session

### **POST** `/project/:projectId/chats/messages`

**Body**

```json
{
  "message": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì",
  "chatId": "40c6dc17-239a-498e-8cdc-8ca1973570c7" // null when new chat
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

## List Chats in Project

### **GET** `/api/v1/chats?projectId=<id>`

## Send Message (History-based RAG)

### **POST** `/api/v1/chats/:chatId/messages`

**Body**

```json
{
  "message": "What does section 3 mean?"
}
```

## Get Chat Messages

### **GET** `/api/v1/chats/:chatId/messages`

---

# 📦 Embedding & Ingest (Internal but usable)

## Manual Re-Ingest Document

### **POST** `/api/v1/documents/:id/reingest`

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
