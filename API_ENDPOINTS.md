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

### **POST** `/api/document/upload/files`

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
  "files": "multi-part..."
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

## Get File Metadata

### **GET** `/api/documents/:id`

## Delete File

### **DELETE** `/api/documents/:id`

## List Documents in Project

### **GET** `/api/projects/:id/documents`

---

# 🧠 Chat (No History)

## Direct Chat

### **POST** `/api/chat/lite`

**Body**

```json
{
  // "projectId": "string",
  "message": "Các nghiên cứu gì vậy"
}
```

**Response**

```json
{
  // "is_success": true,
  // "data": {
  //   "answer": "The document explains..."
  // }
  {
  "response": {
    "lc": 1,
    "type": "constructor",
    "id": [
      "langchain_core",
      "messages",
      "AIMessage"
    ],
    "kwargs": {
      "id": "chatcmpl-CgNozAjyLEYNvaiaRy9YoP2DqkQOD",
      "content": "Các nghiên cứu được nhắc đến là các nghiên cứu quốc tế tập trung làm rõ vai trò và ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM) như ChatGPT của OpenAI và Gemini của Google trong nhiều lĩnh vực. Các nghiên cứu này phân tích:\n\n- Hiệu quả và khả năng của LLM hiện đại trong xử lý ngôn ngữ tự nhiên (NLP), giúp máy tính không chỉ hiểu và sinh ngôn ngữ mà còn suy luận dựa trên ngôn ngữ.\n- Ứng dụng các kỹ thuật tiên tiến như học tăng cường từ phản hồi của con người (RLHF) và kiến trúc đa phương thức để mở rộng phạm vi xử lý (văn bản, hình ảnh, âm thanh).\n- Ảnh hưởng tích cực của LLM trong thực tiễn, như cá nhân hóa phản hồi, giải quyết các nhiệm vụ phân tích phức tạp trong y tế, tài chính, giáo dục, dịch vụ khách hàng.\n- Các tiến bộ về mặt kiến trúc (ví dụ Mixture-of-Experts, Transformer) giúp tăng hiệu năng, giảm chi phí tính toán và mở rộng khả năng phân tích, hiểu ngữ cảnh, tạo lập nội dung trên nhiều dạng dữ liệu.\n- So sánh hiệu suất các LLM lớn (ChatGPT, Gemini, Claude 2, Llama 2) trên các bộ kiểm tra tiêu chuẩn như GSM8K, HumanEval, MMLU và HellaSwag; bản Gemini Ultra có thành tích nổi bật trong một số thước đo, nhưng ChatGPT lại vượt trội ở các khía cạnh khác.\n- Đánh giá ứng dụng LLM trong giáo dục (ví dụ, khảo sát tại Mỹ cho thấy giáo viên sử dụng AI tiết kiệm thời gian soạn bài, nâng cao hiệu quả công việc).\n- Bên cạnh thành tựu, các nghiên cứu cũng lưu ý về thách thức còn tồn tại: cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination, tối ưu hóa chi phí.\n\nTóm lại, đây là các nghiên cứu tổng hợp về kỹ thuật, kiến trúc, hiệu năng, khả năng ứng dụng và các thách thức hiện tại của các mô hình ngôn ngữ lớn.",
      "additional_kwargs": {},
      "response_metadata": {
        "tokenUsage": {
          "promptTokens": 2956,
          "completionTokens": 469,
          "totalTokens": 3425
        },
        "finish_reason": "stop",
        "model_provider": "openai",
        "model_name": "gpt-4.1-2025-04-14",
        "usage": {
          "prompt_tokens": 2956,
          "completion_tokens": 469,
          "total_tokens": 3425,
          "prompt_tokens_details": {
            "cached_tokens": 0,
            "audio_tokens": 0
          },
          "completion_tokens_details": {
            "reasoning_tokens": 0,
            "audio_tokens": 0,
            "accepted_prediction_tokens": 0,
            "rejected_prediction_tokens": 0
          }
        },
        "system_fingerprint": "fp_433e8c8649"
      },
      "type": "ai",
      "tool_calls": [],
      "invalid_tool_calls": [],
      "usage_metadata": {
        "output_tokens": 469,
        "input_tokens": 2956,
        "total_tokens": 3425,
        "input_token_details": {
          "audio": 0,
          "cache_read": 0
        },
        "output_token_details": {
          "audio": 0,
          "reasoning": 0
        }
      }
    }
  },
  "relateDocs": [
    {
      "pageContent": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh\nChatGPT – Gemini\nCác nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và ứng dụng thực tế của các mô hình ngôn ngữ\nlớn (LLM) trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã tạo nên bước đột phá trong xử lý ngôn ngữ\ntự nhiên (NLP), cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn suy luận dựa trên ngôn ngữ\n. Những mô hình như ChatGPT của OpenAI và   Gemini của Google đã mở rộng đáng kể khả năng của\nAI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như học tăng cường từ phản hồi của con người (RLHF) để\nnâng cao tính mạch lạc trong hội thoại, hay kiến trúc đa phương thức để xử lý đồng thời văn bản, hình\nảnh, âm thanh – qua đó mở rộng phạm vi ứng dụng của LLM trong thực tiễn. Ngày nay, các công\nnghệ này đang được ứng dụng rộng rãi trong các lĩnh vực y tế, tài chính, giáo dục, dịch vụ khách hàng,\ngiúp cá nhân hóa phản hồi và giải quyết những nhiệm vụ phân tích phức tạp.",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "98069d88-c5c2-4c3e-9106-edd9f4c9c287"
    },
    {
      "pageContent": "trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác. \nTóm lại, các nghiên cứu nước ngoài đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng\nTransformer đến những hệ thống đa năng như ChatGPT và Gemini ngày nay. Những kết quả đạt được\ncho thấy sự vượt trội của mô hình ngôn ngữ lớn trong việc xử lý ngôn ngữ tự nhiên và tư duy đa\ndạng, đồng thời nhấn mạnh tiềm năng ứng dụng rộng rãi của chúng vào thực tiễn (từ giáo dục, y tế đến\ntự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về những thách thức còn tồn tại – từ việc\ncải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination cho đến tối ưu hóa chi phí tính toán –\nnhằm tiếp tục hoàn thiện và phát huy tối đa lợi ích của các mô hình LLM trong tương lai.\n12\n11\n• \n11\n• \n12\n• \n12\n• \n13\n14\n15\n16\n1717\n2\n[2503.04783] Comparative Analysis Based on DeepSeek, ChatGPT, and Google Gemini:\nFeatures, Techniques, Performance, Future Prospects\nhttps://ar5iv.org/html/2503.04783v1",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "ff78c7aa-8061-4c0f-af71-16917f6c7d9b"
    },
    {
      "pageContent": "năng    phân tích và tạo nội dung trên nhiều dạng dữ liệu. Những đột phá kỹ thuật này không chỉ\nnâng cao hiệu suất tổng thể của mô hình mà còn mở đường cho các ứng dụng LLM sáng tạo trong các\nlĩnh vực chuyên sâu (ví dụ trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v.). \nBên cạnh khía cạnh kỹ thuật, các nghiên cứu ứng dụng cho thấy LLM có tác động tích cực trong hoạt\nđộng thực tiễn.  Trong lĩnh vực giáo dục, việc tích hợp công cụ AI hỗ trợ giáo viên đã mang lại hiệu quả\nrõ rệt  . Một khảo sát tại Mỹ cho thấy giáo viên sử dụng AI thường xuyên ước tính tiết kiệm trung bình\n~5,9 giờ mỗi tuần (tương đương sáu tuần mỗi năm học nhờ tự động hóa công việc chuẩn bị bài giảng,\nchấm bài, v.v.).  Phần lớn giáo viên cũng nhận định AI giúp nâng cao chất lượng công việc – ví dụ có\n74% giáo viên đánh giá AI cải thiện hiệu quả các công việc hành chính của họ. Điều này minh chứng\nrằng    các mô hình AI ngôn ngữ như ChatGPT có tiềm năng hỗ trợ giảm tải công việc thủ công, tối ưu",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "85da9b92-3293-4879-ae05-280705062df5"
    },
    {
      "pageContent": "đại như sau:\nKiến trúc và dữ liệu huấn luyện: GPT-3 và các thế hệ kế nhiệm được xây dựng trên kiến trúc\nTransformer, huấn luyện trên tập dữ liệu văn bản khổng lồ (hàng trăm tỷ từ) bao gồm nhiều\nnguồn khác nhau. Quy mô tham số cực lớn (GPT-3 có 175 tỷ tham số) cho phép mô hình học\nđược biểu diễn ngôn ngữ rất đa dạng, làm nền tảng cho hiệu suất cao trên nhiều nhiệm vụ.\nKhả năng học từ ít ví dụ: GPT-3 có khả năng thực hiện nhiều nhiệm vụ chỉ dựa trên một vài ví\ndụ hoặc thậm chí không cần ví dụ minh họa (few-shot learning). Mô hình hiểu yêu cầu từ ngữ\ncảnh và tự suy luận để giải quyết nhiệm vụ, một năng lực tổng quát hóa mới chỉ xuất hiện khi mô\nhình đạt quy mô rất lớn (GPT-2 trở về trước chưa thể hiện rõ khả năng này). \nHiệu năng trên các tác vụ NLP: Không cần tinh chỉnh tham số cho từng bài toán cụ thể, GPT-3 đã\nđạt kết quả xuất sắc trên nhiều nhiệm vụ NLP phổ biến (như dịch máy, trả lời câu hỏi, điền từ vào",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "e8ac9cbf-bbbb-4dea-925d-0f6b88b8ee1e"
    },
    {
      "pageContent": "thực sự “hiểu” ý nghĩa sâu xa của ngôn ngữ mà chỉ dự đoán theo thống kê. Bên cạnh đó, chi phí\ntính toán để huấn luyện và vận hành những mô hình lớn như GPT-3 là rất cao, đòi hỏi tài nguyên\nphần cứng khổng lồ. Các hướng nghiên cứu mới (như kiến trúc MoE) đang được triển khai nhằm cải\nthiện hiệu quả tính toán, giúp mô hình chạy nhanh hơn với chi phí thấp hơn.\nNhìn sang thế hệ mô hình mới hơn,  ChatGPT (dựa trên GPT-3.5/GPT-4, có áp dụng RLHF) và Google\nGemini (mô hình đa phương thức tiên tiến) là hai đại diện nổi bật cho nền tảng LLM thương mại vào năm\n2025. Cả hai đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ, nhưng mỗi mô hình có thế mạnh\nriêng. Theo báo cáo của Google, Gemini Ultra (phiên bản mạnh nhất của Gemini) đã   vượt trội hơn các\nmô hình tương đương trên nhiều thước đo tiêu chuẩn: ví dụ, Gemini Ultra đạt kết quả cao hơn so với\nClaude 2, GPT-4 (ChatGPT) và Llama 2 trong các bài kiểm tra GSM8K (đánh giá khả năng toán học),",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "35a77611-9371-4a5a-b72f-a93e34f8bd34"
    },
    {
      "pageContent": "Hiệu năng trên các tác vụ NLP: Không cần tinh chỉnh tham số cho từng bài toán cụ thể, GPT-3 đã\nđạt kết quả xuất sắc trên nhiều nhiệm vụ NLP phổ biến (như dịch máy, trả lời câu hỏi, điền từ vào\nchỗ trống). Thậm chí, mô hình còn vượt qua các mô hình chuyên biệt trong một số trường hợp, ví\ndụ GPT-3 có thể dịch một câu từ tiếng Anh sang tiếng Pháp chỉ dựa trên ngữ cảnh mà vẫn\nchính xác tương đương mô hình dịch thuật được huấn luyện bài bản.\nHạn chế: Mặc dù rất mạnh mẽ, GPT-3 vẫn bộc lộ một số hạn chế. Mô hình có thể sinh ra nội dung\nsai lệch hoặc không phù hợp – ví dụ đôi khi tạo văn bản nghe có vẻ hợp lý nhưng thực chất thiếu\nchính xác về mặt dữ kiện hoặc mang định kiến. Điều này bắt nguồn từ việc mô hình chưa\nthực sự “hiểu” ý nghĩa sâu xa của ngôn ngữ mà chỉ dự đoán theo thống kê. Bên cạnh đó, chi phí\ntính toán để huấn luyện và vận hành những mô hình lớn như GPT-3 là rất cao, đòi hỏi tài nguyên",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "1beae240-7585-4d7f-b62b-e458d77b6be6"
    },
    {
      "pageContent": "nghệ này đang được ứng dụng rộng rãi trong các lĩnh vực y tế, tài chính, giáo dục, dịch vụ khách hàng,\ngiúp cá nhân hóa phản hồi và giải quyết những nhiệm vụ phân tích phức tạp.\nĐộng lực phát triển LLM xuất phát từ nhu cầu giải quyết các bài toán thực tế ngày càng phức tạp với độ\nchính xác cao. Để đáp ứng điều đó, các nghiên cứu đã liên tục cải tiến kiến trúc mô hình và phương\npháp huấn luyện. Chẳng hạn, việc áp dụng Mixture-of-Experts (MoE) giúp mô hình chỉ kích hoạt các cụm\nchuyên gia cần thiết, giảm chi phí tính toán và tăng hiệu suất cho những tác vụ chuyên biệt. Song\nsong,    RLHF trong ChatGPT giúp mô hình hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn, trong\nkhi   Gemini được thiết kế đa phương thức (tích hợp xử lý văn bản, mã nguồn, hình ảnh) nhằm mở rộng khả\nnăng    phân tích và tạo nội dung trên nhiều dạng dữ liệu. Những đột phá kỹ thuật này không chỉ\nnâng cao hiệu suất tổng thể của mô hình mà còn mở đường cho các ứng dụng LLM sáng tạo trong các",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "16cfe3aa-9454-44d8-ab29-ec21dc8ab463"
    },
    {
      "pageContent": "74% giáo viên đánh giá AI cải thiện hiệu quả các công việc hành chính của họ. Điều này minh chứng\nrằng    các mô hình AI ngôn ngữ như ChatGPT có tiềm năng hỗ trợ giảm tải công việc thủ công, tối ưu\nhóa thời gian và nâng cao hiệu suất trong môi trường làm việc thực tế.\nVề mặt kiến trúc và hiệu năng,  các mô hình LLM thế hệ mới đều dựa trên kiến trúc Transformer do\nGoogle giới thiệu năm 2017. Kiến trúc này cho phép mô hình học được mối quan hệ ngữ cảnh giữa các\ntừ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của các mô\nhình ngôn ngữ cực lớn. Việc    gia tăng quy mô mô hình (số lượng tham số) đi cùng khối lượng dữ liệu\nhuấn luyện khổng lồ đã dẫn đến những bước nhảy vọt về năng lực của LLM. GPT-3   của OpenAI (ra mắt\n2020) là một ví dụ tiêu biểu: với 175 tỷ tham số, GPT-3 được huấn luyện trên khối lượng dữ liệu văn bản\n~570 GB và có thể thực hiện đa dạng nhiệm vụ NLP chỉ thông qua gợi ý ngữ cảnh,  không cần tinh chỉnh",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "07d10662-7f8a-4d29-a3e2-4806abc3a9f3"
    },
    {
      "pageContent": "~570 GB và có thể thực hiện đa dạng nhiệm vụ NLP chỉ thông qua gợi ý ngữ cảnh,  không cần tinh chỉnh\nriêng cho từng tác vụ. Mô hình này cho thấy năng lực tổng quát hóa vượt trội – GPT-3 có thể\ndịch thuật giữa các ngôn ngữ hoặc     trả lời câu hỏi về những lĩnh vực khác nhau dù không được huấn\nluyện chuyên biệt cho nhiệm vụ đó, điều mà phiên bản tiền nhiệm GPT-2 (chỉ 1,5 tỷ tham số) hầu như\nchưa làm được. Thậm chí, trong một số bài toán, GPT-3 đạt độ chính xác tiệm cận hoặc vượt qua\n1\n2\n3\n4\n4\n5\n5\n6\n7\n8\n9\n1011\n11\n1\ncác mô hình được huấn luyện chuyên biệt cho tác vụ tương ứng, cho thấy hiệu quả của việc mở rộng\nquy mô và học từ ngữ cảnh.\nMột công trình nghiên cứu tiêu biểu đã tổng kết các đặc điểm chính của mô hình GPT-3 và dòng LLM hiện\nđại như sau:\nKiến trúc và dữ liệu huấn luyện: GPT-3 và các thế hệ kế nhiệm được xây dựng trên kiến trúc\nTransformer, huấn luyện trên tập dữ liệu văn bản khổng lồ (hàng trăm tỷ từ) bao gồm nhiều",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "640e2788-9e91-4fc0-ab23-4ef74ea50aa0"
    },
    {
      "pageContent": "mô hình tương đương trên nhiều thước đo tiêu chuẩn: ví dụ, Gemini Ultra đạt kết quả cao hơn so với\nClaude 2, GPT-4 (ChatGPT) và Llama 2 trong các bài kiểm tra GSM8K (đánh giá khả năng toán học), \nHumanEval (đánh giá sinh mã lập trình) và   MMLU (đánh giá hiểu biết ngôn ngữ đa lĩnh vực). Đáng\nchú ý,     Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU,\ncho thấy tiềm năng xuất sắc về kiến thức và suy luận. Tuy nhiên, ở bài kiểm tra HellaSwag về suy luận\nthường thức,  GPT-4 (ChatGPT) lại   nhỉnh hơn Gemini Ultra đôi chút, phản ánh rằng mô hình của OpenAI\nvẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật. Điều này gợi ý rằng hiệu suất\ncủa LLM phụ thuộc vào tính chất của từng nhiệm vụ cũng như cách thức huấn luyện: mô hình có thể vượt\ntrội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác. \nTóm lại, các nghiên cứu nước ngoài đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng",
      "metadata": {
        "fileId": "1764215364888-998384400application.pdf"
      },
      "id": "ee118aed-c9a3-4799-a7bc-7b199078f81b"
    }
  ]
}
}
```

---

# 💬 Chat (With History)

## Create Chat Session

### **POST** `/project/:projectId/chats/messages`

**Body**

```json
{
  "message": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì",
  "chatId": "40c6dc17-239a-498e-8cdc-8ca1973570c7" // this is OPT: 
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "response": {
      "lc": 1,
      "type": "constructor",
      "id": [
        "langchain_core",
        "messages",
        "AIMessage"
      ],
      "kwargs": {
        "id": "chatcmpl-CjLlNqy6w49SCWgMPnYw81eFR922i",
        "content": "Tài liệu nghiên cứu các mô hình ngôn ngữ lớn (LLM) tiêu biểu như ChatGPT của OpenAI và Gemini của Google. Các điểm mạnh của các LLM này bao gồm:\n\n- Xử lý ngôn ngữ tự nhiên vượt trội: Cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn có thể suy luận dựa trên ngôn ngữ.\n- Khả năng đa phương thức: Đặc biệt, Gemini được thiết kế để xử lý đồng thời văn bản, hình ảnh, âm thanh, mã nguồn, giúp mở rộng phạm vi ứng dụng vào thực tiễn và phân tích, tạo nội dung trên nhiều dạng dữ liệu.\n- Phản hồi tự nhiên, cá nhân hóa: Ứng dụng kỹ thuật học tăng cường từ phản hồi của con người (RLHF) như trong ChatGPT, giúp mô hình hiểu ngữ cảnh và phản hồi mạch lạc, tự nhiên hơn.\n- Hiệu suất mô hình cao nhờ kiến trúc Transformer: Tăng quy mô tham số và khối lượng dữ liệu huấn luyện giúp các mô hình như GPT-3 đạt bước nhảy vọt về năng lực và có thể thực hiện đa dạng nhiệm vụ NLP.\n- Tiết kiệm chi phí tính toán: Ứng dụng kỹ thuật Mixture-of-Experts (MoE) giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết, tối ưu hiệu suất cho các tác vụ chuyên biệt.\n- Tác động thực tiễn rõ rệt: Trong giáo dục, AI như ChatGPT giúp tiết kiệm thời gian cho giáo viên (trung bình ~5,9 giờ mỗi tuần), nâng cao hiệu quả các công việc hành chính và được đông đảo giáo viên đánh giá tích cực.\n- Ứng dụng rộng rãi: LLM đang được ứng dụng trong nhiều lĩnh vực như y tế, tài chính, giáo dục, dịch vụ khách hàng, giúp cá nhân hóa phản hồi và giải quyết các nhiệm vụ phân tích phức tạp.\n\nTóm lại, tài liệu tập trung vào ChatGPT và Gemini, nhấn mạnh sức mạnh kỹ thuật, khả năng ứng dụng rộng rãi và hiệu quả thực tiễn của chúng.",
        "additional_kwargs": {},
        "response_metadata": {
          "tokenUsage": {
            "promptTokens": 1517,
            "completionTokens": 452,
            "totalTokens": 1969
          },
          "finish_reason": "stop",
          "model_provider": "openai",
          "model_name": "gpt-4.1-2025-04-14",
          "usage": {
            "prompt_tokens": 1517,
            "completion_tokens": 452,
            "total_tokens": 1969,
            "prompt_tokens_details": {
              "cached_tokens": 0,
              "audio_tokens": 0
            },
            "completion_tokens_details": {
              "reasoning_tokens": 0,
              "audio_tokens": 0,
              "accepted_prediction_tokens": 0,
              "rejected_prediction_tokens": 0
            }
          },
          "system_fingerprint": "fp_433e8c8649"
        },
        "type": "ai",
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "output_tokens": 452,
          "input_tokens": 1517,
          "total_tokens": 1969,
          "input_token_details": {
            "audio": 0,
            "cache_read": 0
          },
          "output_token_details": {
            "audio": 0,
            "reasoning": 0
          }
        }
      }
    },
    "relateDocs": [
      {
        "pageContent": "trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác. \nTóm lại, các nghiên cứu nước ngoài đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng\nTransformer đến những hệ thống đa năng như ChatGPT và Gemini ngày nay. Những kết quả đạt được\ncho thấy sự vượt trội của mô hình ngôn ngữ lớn trong việc xử lý ngôn ngữ tự nhiên và tư duy đa\ndạng, đồng thời nhấn mạnh tiềm năng ứng dụng rộng rãi của chúng vào thực tiễn (từ giáo dục, y tế đến\ntự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về những thách thức còn tồn tại – từ việc\ncải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination cho đến tối ưu hóa chi phí tính toán –\nnhằm tiếp tục hoàn thiện và phát huy tối đa lợi ích của các mô hình LLM trong tương lai.\n12\n11\n• \n11\n• \n12\n• \n12\n• \n13\n14\n15\n16\n1717\n2\n[2503.04783] Comparative Analysis Based on DeepSeek, ChatGPT, and Google Gemini:\nFeatures, Techniques, Performance, Future Prospects\nhttps://ar5iv.org/html/2503.04783v1",
        "metadata": {
          "fileId": "ddf65c6e-f201-41d9-bd41-e10733fa050b",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4"
        },
        "id": "cfff2cf5-8ef8-492f-bdac-892764472ebe"
      },
      {
        "pageContent": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh\nChatGPT – Gemini\nCác nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và ứng dụng thực tế của các mô hình ngôn ngữ\nlớn (LLM) trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã tạo nên bước đột phá trong xử lý ngôn ngữ\ntự nhiên (NLP), cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn suy luận dựa trên ngôn ngữ\n. Những mô hình như ChatGPT của OpenAI và   Gemini của Google đã mở rộng đáng kể khả năng của\nAI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như học tăng cường từ phản hồi của con người (RLHF) để\nnâng cao tính mạch lạc trong hội thoại, hay kiến trúc đa phương thức để xử lý đồng thời văn bản, hình\nảnh, âm thanh – qua đó mở rộng phạm vi ứng dụng của LLM trong thực tiễn. Ngày nay, các công\nnghệ này đang được ứng dụng rộng rãi trong các lĩnh vực y tế, tài chính, giáo dục, dịch vụ khách hàng,\ngiúp cá nhân hóa phản hồi và giải quyết những nhiệm vụ phân tích phức tạp.",
        "metadata": {
          "fileId": "ddf65c6e-f201-41d9-bd41-e10733fa050b",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4"
        },
        "id": "8a1b7c99-2313-44b1-9a31-8b7826d8d568"
      },
      {
        "pageContent": "năng    phân tích và tạo nội dung trên nhiều dạng dữ liệu. Những đột phá kỹ thuật này không chỉ\nnâng cao hiệu suất tổng thể của mô hình mà còn mở đường cho các ứng dụng LLM sáng tạo trong các\nlĩnh vực chuyên sâu (ví dụ trợ lý bác sĩ, chuyên gia pháp lý ảo, v.v.). \nBên cạnh khía cạnh kỹ thuật, các nghiên cứu ứng dụng cho thấy LLM có tác động tích cực trong hoạt\nđộng thực tiễn.  Trong lĩnh vực giáo dục, việc tích hợp công cụ AI hỗ trợ giáo viên đã mang lại hiệu quả\nrõ rệt  . Một khảo sát tại Mỹ cho thấy giáo viên sử dụng AI thường xuyên ước tính tiết kiệm trung bình\n~5,9 giờ mỗi tuần (tương đương sáu tuần mỗi năm học nhờ tự động hóa công việc chuẩn bị bài giảng,\nchấm bài, v.v.).  Phần lớn giáo viên cũng nhận định AI giúp nâng cao chất lượng công việc – ví dụ có\n74% giáo viên đánh giá AI cải thiện hiệu quả các công việc hành chính của họ. Điều này minh chứng\nrằng    các mô hình AI ngôn ngữ như ChatGPT có tiềm năng hỗ trợ giảm tải công việc thủ công, tối ưu",
        "metadata": {
          "fileId": "ddf65c6e-f201-41d9-bd41-e10733fa050b",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4"
        },
        "id": "3e14d077-aaa3-493f-84be-79365f1e56e1"
      },
      {
        "pageContent": "74% giáo viên đánh giá AI cải thiện hiệu quả các công việc hành chính của họ. Điều này minh chứng\nrằng    các mô hình AI ngôn ngữ như ChatGPT có tiềm năng hỗ trợ giảm tải công việc thủ công, tối ưu\nhóa thời gian và nâng cao hiệu suất trong môi trường làm việc thực tế.\nVề mặt kiến trúc và hiệu năng,  các mô hình LLM thế hệ mới đều dựa trên kiến trúc Transformer do\nGoogle giới thiệu năm 2017. Kiến trúc này cho phép mô hình học được mối quan hệ ngữ cảnh giữa các\ntừ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của các mô\nhình ngôn ngữ cực lớn. Việc    gia tăng quy mô mô hình (số lượng tham số) đi cùng khối lượng dữ liệu\nhuấn luyện khổng lồ đã dẫn đến những bước nhảy vọt về năng lực của LLM. GPT-3   của OpenAI (ra mắt\n2020) là một ví dụ tiêu biểu: với 175 tỷ tham số, GPT-3 được huấn luyện trên khối lượng dữ liệu văn bản\n~570 GB và có thể thực hiện đa dạng nhiệm vụ NLP chỉ thông qua gợi ý ngữ cảnh,  không cần tinh chỉnh",
        "metadata": {
          "fileId": "ddf65c6e-f201-41d9-bd41-e10733fa050b",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4"
        },
        "id": "56ba452b-14d2-4269-82bd-b4abc97dd282"
      },
      {
        "pageContent": "nghệ này đang được ứng dụng rộng rãi trong các lĩnh vực y tế, tài chính, giáo dục, dịch vụ khách hàng,\ngiúp cá nhân hóa phản hồi và giải quyết những nhiệm vụ phân tích phức tạp.\nĐộng lực phát triển LLM xuất phát từ nhu cầu giải quyết các bài toán thực tế ngày càng phức tạp với độ\nchính xác cao. Để đáp ứng điều đó, các nghiên cứu đã liên tục cải tiến kiến trúc mô hình và phương\npháp huấn luyện. Chẳng hạn, việc áp dụng Mixture-of-Experts (MoE) giúp mô hình chỉ kích hoạt các cụm\nchuyên gia cần thiết, giảm chi phí tính toán và tăng hiệu suất cho những tác vụ chuyên biệt. Song\nsong,    RLHF trong ChatGPT giúp mô hình hiểu ngữ cảnh và phản hồi tự nhiên, trôi chảy hơn, trong\nkhi   Gemini được thiết kế đa phương thức (tích hợp xử lý văn bản, mã nguồn, hình ảnh) nhằm mở rộng khả\nnăng    phân tích và tạo nội dung trên nhiều dạng dữ liệu. Những đột phá kỹ thuật này không chỉ\nnâng cao hiệu suất tổng thể của mô hình mà còn mở đường cho các ứng dụng LLM sáng tạo trong các",
        "metadata": {
          "fileId": "ddf65c6e-f201-41d9-bd41-e10733fa050b",
          "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
          "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4"
        },
        "id": "dfb59683-960b-4692-bafb-7138c65dceed"
      }
    ],
    "chat": {
      "id": "153bb144-f300-4942-8224-26fc7b176fa5",
      "userId": "bbe027d0-74ea-4630-a846-5040a9772d19",
      "title": "New Chat",
      "messages": [
        [
          {
            "role": "user",
            "content": "Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì"
          },
          {
            "role": "assistant",
            "content": "Tài liệu nghiên cứu các mô hình ngôn ngữ lớn (LLM) tiêu biểu như ChatGPT của OpenAI và Gemini của Google. Các điểm mạnh của các LLM này bao gồm:\n\n- Xử lý ngôn ngữ tự nhiên vượt trội: Cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn có thể suy luận dựa trên ngôn ngữ.\n- Khả năng đa phương thức: Đặc biệt, Gemini được thiết kế để xử lý đồng thời văn bản, hình ảnh, âm thanh, mã nguồn, giúp mở rộng phạm vi ứng dụng vào thực tiễn và phân tích, tạo nội dung trên nhiều dạng dữ liệu.\n- Phản hồi tự nhiên, cá nhân hóa: Ứng dụng kỹ thuật học tăng cường từ phản hồi của con người (RLHF) như trong ChatGPT, giúp mô hình hiểu ngữ cảnh và phản hồi mạch lạc, tự nhiên hơn.\n- Hiệu suất mô hình cao nhờ kiến trúc Transformer: Tăng quy mô tham số và khối lượng dữ liệu huấn luyện giúp các mô hình như GPT-3 đạt bước nhảy vọt về năng lực và có thể thực hiện đa dạng nhiệm vụ NLP.\n- Tiết kiệm chi phí tính toán: Ứng dụng kỹ thuật Mixture-of-Experts (MoE) giúp mô hình chỉ kích hoạt các cụm chuyên gia cần thiết, tối ưu hiệu suất cho các tác vụ chuyên biệt.\n- Tác động thực tiễn rõ rệt: Trong giáo dục, AI như ChatGPT giúp tiết kiệm thời gian cho giáo viên (trung bình ~5,9 giờ mỗi tuần), nâng cao hiệu quả các công việc hành chính và được đông đảo giáo viên đánh giá tích cực.\n- Ứng dụng rộng rãi: LLM đang được ứng dụng trong nhiều lĩnh vực như y tế, tài chính, giáo dục, dịch vụ khách hàng, giúp cá nhân hóa phản hồi và giải quyết các nhiệm vụ phân tích phức tạp.\n\nTóm lại, tài liệu tập trung vào ChatGPT và Gemini, nhấn mạnh sức mạnh kỹ thuật, khả năng ứng dụng rộng rãi và hiệu quả thực tiễn của chúng."
          }
        ]
      ],
      "createdAt": "2025-12-05T08:47:31.624Z",
      "updatedAt": "2025-12-05T08:47:42.958Z",
      "projectId": "45ac97e2-0ed1-431c-9337-0e570f6875b4"
    }
  }
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
