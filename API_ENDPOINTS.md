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

### **POST** `/api/chat`

**Body**

```json
{
  "message": "Đối tượng nào được giảm học phí bao gồm",
  "chatId": "40c6dc17-239a-498e-8cdc-8ca1973570c7"
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "result": {
      "response": {
        "lc": 1,
        "type": "constructor",
        "id": [
          "langchain_core",
          "messages",
          "AIMessage"
        ],
        "kwargs": {
          "id": "chatcmpl-ChrlHjMQ0LQvKWH7jnifhfu16H35T",
          "content": "Dựa trên thông tin trong tài liệu, các đối tượng được giảm học phí bao gồm:\n\n1. Đối tượng giảm 70% học phí:  \nSinh viên là người dân tộc thiểu số (ngoài đối tượng dân tộc thiểu số rất ít người) ở thôn/bản đặc biệt khó khăn, xã khu vực III vùng dân tộc và miền núi, xã đặc biệt khó khăn vùng bãi ngang ven biển hải đảo theo quy định của cơ quan có thẩm quyền.\n\n2. Đối tượng giảm 50% học phí:  \nSinh viên là con cán bộ, công chức, viên chức, công nhân mà cha hoặc mẹ bị mắc bệnh nghề nghiệp hoặc tai nạn lao động được hưởng trợ cấp thường xuyên.",
          "additional_kwargs": {},
          "response_metadata": {
            "tokenUsage": {
              "promptTokens": 1894,
              "completionTokens": 155,
              "totalTokens": 2049
            },
            "finish_reason": "stop",
            "model_provider": "openai",
            "model_name": "gpt-4.1-2025-04-14",
            "usage": {
              "prompt_tokens": 1894,
              "completion_tokens": 155,
              "total_tokens": 2049,
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
            "system_fingerprint": "fp_09249d7c7b"
          },
          "type": "ai",
          "tool_calls": [],
          "invalid_tool_calls": [],
          "usage_metadata": {
            "output_tokens": 155,
            "input_tokens": 1894,
            "total_tokens": 2049,
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
          "pageContent": "z\nĐối tượng 3: (Khoản 4 - Điều 15) - Đơn đề nghị miễn, giảm học phí\nSinh viên từ 16 tuổi đến 22 tuổi đang | (f2? ”2ẩt);\nhọc văn bằng thứ nhất không có nguồn | - Bản sao có công chứng Quyết định\nnuôi dưỡng thuộc đối tượng hưởng trợ | về việc trợ cấp xã hội.\ncấp xã hội hàng tháng theo quy định tại\nkhoản 1 và khoản 2 Điều 5 Nghị định\nsố 20/2021/NĐ-CP.\nĐối tượng 4: (Khoản 7 - Điều 15) - Đơn đề nghị miễn, giảm học phí\nSinh viên là dân tộc thiểu số có cha | (29 ”/Ấ1);\nhoặc mẹ hoặc cả cha và mẹ hoặc ông | - Giấy chứng nhận hộ nghèo, hộ cận\nbà (trong trường hợp ở với ông bà) | nghèo.\nthuộc hộ nghèo và hộ cận nghèo theo\nquy định của Thủ tướng Chính phủ.\nĐối tượng 5: (Khoản 10 - Điều 15) - Đơn đề nghị miễn, giảm học phí\nSinh viên là dân tộc thiểu số rất ít | (92G 7229); ĩ\nngười ở vùng có điều kiện kinh tế - xã | - Bản sao công chứng của Giấy khai\nhội khó khăn và đặc biệt khó khăn. sinh.\n2. Đối tượng giảm 70% học phí Hồ sơ cần thực hiện",
          "metadata": {
            "fileId": "1764430266866-974747285.pdf"
          },
          "id": "e50744f7-8478-4612-b6c2-3aa4c97fe72d"
        },
        {
          "pageContent": "người ở vùng có điều kiện kinh tế - xã | - Bản sao công chứng của Giấy khai\nhội khó khăn và đặc biệt khó khăn. sinh.\n2. Đối tượng giảm 70% học phí Hồ sơ cần thực hiện\nĐối tượng 6: (Khoản 1 - Điều 16) - Đơn đề nghị miễn, giảm học phí\nSinh viên là người dân tộc thiểu số | (2Ø? 79);\n(ngoài đối tượng dân tộc thiểu số rất ít | - Bản sao công chứng của Giấy khai\nngười) ở thôn/bản đặc biệt khó khăn, | sinh.\nxã khu vực III vùng dân tộc và miền\nnúi, xã đặc biệt khó khăn vùng bãi\nngang ven biển hải đảo theo quy định\ncủa cơ quan có thẳm quyền.\n3. Đối tượng giảm 502% học phí Hồ sơ cần thực hiện\nĐối tượng 7: (Khoản 2 - Điều 16) - Đơn đề nghị miễn, giảm học phí\nSinh viên là con cán bộ, công chức, | (2O ”2ấz);\nviên chức, công nhân mà cha hoặc mẹ |- Bản sao công chứng của Quyết\nbị mắc bệnh nghề nghiệp hoặc tai nạn | định hưởng trợ cấp hàng tháng của\nlao động được hưởng trợ cấp thường | cha hoặc mẹ bị tai nạn lao động hoặc\nxuyên. mắc bệnh nghề nghiệp do tổ chức\nBảo hiểm xã hội cấp.\nưu ý:",
          "metadata": {
            "fileId": "1764430266866-974747285.pdf"
          },
          "id": "c3fa2a16-b88e-478e-a909-6a4a34219f1b"
        },
        {
          "pageContent": "7 UBND THÀNH PHÓ CÀN THƠ CỘNG HÒA XÃ HỌI CHỦ NGHĨA VIỆT NAM\nTRƯỜNG ĐẠI HỌC Độc lập - Tự do - Hạnh phúc\nKỸ THUẬT-CÔNG NGHỆ CÀN THƠ.\nSố: A62 /TB-ĐHKTCN Cân Thơ, ngày A6 tháng 9 năm 2025\nTTHÔNG BÁO\nVề các chế độ chính sách miễn, giảm học phí cho sinh viên chính quy\nhọc kỳ I năm học 2025 - 2026\nCăn cứ Nghị định số 238/2025/NĐ-CP ngày 03 tháng 9 năm 2025 của\nChính phủ quy định về chính sách học phí, miễn, giảm, hỗ trợ học phí, hỗ trợ chi\nphí học tập và giá dịch vụ trong lĩnh vực giáo dục, đào tạo, Trường Đại học Kỹ\nthuật - Công nghệ Cần Thơ thông báo đến lãnh đạo các khoa, có vấn học tập và\ntoàn thễ sinh viên chính quy các nội dung sau:\nI. Đối tượng được miễn, giảm: Sinh viên thuộc đối tượng được miễn,\ngiảm học phí phải đủ 02 điều kiện sau:\n1. Thường trú tại thành phố Cần Thơ (sau sáp nhập).\n2. Thuộc đối tượng được miễn, giảm theo Nghị định số 238/2025/NĐ-CP.\n(được nêu cụ thể tại phần “Thủ tục thực hiện”).\nXI. Thũ tục thực hiện",
          "metadata": {
            "fileId": "1764430266866-974747285.pdf"
          },
          "id": "f3fdb86e-5240-4df7-b4d2-f71c2077ceae"
        },
        {
          "pageContent": "1. Thường trú tại thành phố Cần Thơ (sau sáp nhập).\n2. Thuộc đối tượng được miễn, giảm theo Nghị định số 238/2025/NĐ-CP.\n(được nêu cụ thể tại phần “Thủ tục thực hiện”).\nXI. Thũ tục thực hiện\nSinh viên thuộc đối tượng được miễn, giảm học phí cần nộp hồ sơ để\nđược xét miễn, giảm học phí, cụ thể như sau:\n1. Đối tượng miễn học phí Hồ sơ cần thực hiện\nĐối tượng 1: (Khoản 2 - Điều 15) - Đơn đề nghị miễn, giảm học phí\nCon của người hoạt động cách mạng | (e2 ?iễu);\ntrước tháng 08/1945; Con của Anh |- Bản sao có công chứng Giấy xác\nhùng Lực lượng vũ trang nhân dân, | nhận đối tượng do cơ quan quản lý\nAnh hùng Lao động trong thời kỳ | đối với người có công.\nkháng chiến; Con của liệt sĩ, thương.\nbinh, bệnh binh hoặc được hưởng\nchính sách như thương binh, bệnh binh;\nCon của người hoạt động kháng chiến\nbị nhiễm chất độc hóa học.\nĐối tượng 2: (Khoản 3 - Điều 15) - Đơn đề nghị miễn, giảm học phí\nSinh viên khuyết tật. 0soH2H, :\n- Bản sao có công chứng Giầy xác nhận\nkhuyết tật\nSoannod kh\nCamScanner'",
          "metadata": {
            "fileId": "1764430266866-974747285.pdf"
          },
          "id": "9aa6bdaf-6277-48c6-98e3-8570ec1b7363"
        },
        {
          "pageContent": "Căn cứ vào Nghị định số 238/2025/NĐ-CP của Chính phủ, tôi làm đơn này đề\nnghị được Nhà trường xem xét để được miễn, giảm học phí theo quy định và chế độ\nhiện hành.\n\nx..., ngày .... tháng .... năm...\nñ Người làm đơn\nXác nhận của CVHT dc tên và ghí rõ họ tân)\nSoannod kh\nŒCamScanner",
          "metadata": {
            "fileId": "1764430266866-974747285.pdf"
          },
          "id": "02fc5615-1d43-496a-b703-a30170c1df44"
        }
      ],
      "historyMessages": {
        "id": "40c6dc17-239a-498e-8cdc-8ca1973570c7",
        "userId": null,
        "title": "New Chat",
        "messages": [
          {
            "role": "user",
            "content": "Đối tượng nào được miễn học phí bao gồm"
          },
          {
            "role": "assistant",
            "content": "Các đối tượng được miễn học phí bao gồm:\n\n1. Con của người hoạt động cách mạng trước tháng 08/1945; Con của Anh hùng Lực lượng vũ trang nhân dân, Anh hùng Lao động trong thời kỳ kháng chiến; Con của liệt sĩ, thương binh, bệnh binh hoặc được hưởng chính sách như thương binh, bệnh binh; Con của người hoạt động kháng chiến bị nhiễm chất độc hóa học.  \n2. Sinh viên khuyết tật.  \n3. Sinh viên từ 16 tuổi đến 22 tuổi đang học văn bằng thứ nhất không có nguồn nuôi dưỡng thuộc đối tượng hưởng trợ cấp xã hội hàng tháng theo quy định tại khoản 1 và khoản 2 Điều 5 Nghị định số 20/2021/NĐ-CP.  \n4. Sinh viên là dân tộc thiểu số có cha hoặc mẹ hoặc cả cha và mẹ hoặc ông bà (trong trường hợp ở với ông bà) thuộc hộ nghèo và hộ cận nghèo theo quy định của Thủ tướng Chính phủ.  \n5. Sinh viên là dân tộc thiểu số rất ít người ở vùng có điều kiện kinh tế - xã hội khó khăn và đặc biệt khó khăn.  \n\n(Ngoài ra, sinh viên cần thỏa mãn điều kiện về hộ khẩu thường trú tại thành phố Cần Thơ theo yêu cầu của cơ sở đào tạo.)"
          },
          {
            "role": "user",
            "content": "Đối tượng nào được giảm học phí bao gồm"
          }
        ],
        "createdAt": "2025-12-01T06:31:00.036Z",
        "updatedAt": "2025-12-01T06:33:19.708Z"
      }
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
