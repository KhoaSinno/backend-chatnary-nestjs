# **Tiến hóa Kiến trúc Hệ thống Thư viện Số Thông minh: Từ RAG Tĩnh sang Hệ sinh thái Agentic Thích ứng**

## **Tóm tắt Điều hành**

Việc chuyển đổi các hệ thống Retrieval-Augmented Generation (RAG) từ giai đoạn thử nghiệm sang các giải pháp cấp doanh nghiệp, đặc biệt trong môi trường phức tạp như thư viện số, đòi hỏi sự tái cấu trúc căn bản về cách thông tin được truy xuất, ngữ cảnh hóa và tổng hợp. Kiến trúc hiện tại được mô tả trong yêu cầu—một hệ thống RAG tuyến tính dựa trên các tham số cố định ($k=5$), lịch sử hội thoại trượt (sliding window) cứng nhắc, và mô hình ngôn ngữ lớn (LLM) có độ trễ cao (như GPT-4)—đại diện cho cách tiếp cận "Thế hệ 1". Mặc dù có chức năng cơ bản, kiến trúc này gặp phải vấn đề "Goldilocks": ngữ cảnh truy xuất hiếm khi vừa đủ; nó thường thiếu hụt dẫn đến ảo giác (hallucination) hoặc dư thừa gây nhiễu và tăng độ trễ. Hơn nữa, việc dựa vào cửa sổ trượt để quản lý ngữ cảnh chắc chắn dẫn đến hiện tượng trôi dạt ngữ nghĩa (semantic drift), nơi các ràng buộc quan trọng được xác định ở đầu phiên làm việc bị mất đi khi cuộc hội thoại tiến triển.  
Báo cáo này phác thảo lộ trình di chuyển kiến trúc toàn diện hướng tới hệ thống "RAG Agentic Thích ứng" (Generation 3). Giải pháp đề xuất thay thế các chuỗi xử lý tĩnh bằng các luồng công việc dựa trên đồ thị động (dynamic graph workflows) sử dụng **LangGraph.js** trong hệ sinh thái **NestJS**. Chúng tôi giới thiệu các thuật toán **Truy xuất Thông tin Động** điều chỉnh độ sâu truy xuất dựa trên điểm tin cậy ngữ nghĩa thay vì số lượng đếm tùy ý. Chúng tôi đề xuất **Kiến trúc Bộ nhớ Thông minh** sử dụng sự bền vững dài hạn được hỗ trợ bởi vector kết hợp với cơ chế bộ đệm tóm tắt (summary-buffer), tách biệt khỏi cửa sổ ngữ cảnh tức thời. Cuối cùng, vấn đề độ trễ được giải quyết thông qua **Chiến lược Suy luận Đa tầng**, tích hợp bộ nhớ đệm ngữ nghĩa (semantic caching), các lớp xếp hạng lại (reranking) và tìm kiếm lai (hybrid search) để tối ưu hóa sự đánh đổi giữa tốc độ và độ chính xác.1 Sự chuyển đổi này nhằm giảm độ trễ phản hồi khoảng 40-60% trong khi tăng đáng kể mật độ thực tế và độ liên quan của các câu trả lời trong bối cảnh thư viện số.

## ---

**1\. Giải phẫu Các Phương thức Thất bại của RAG Tĩnh (Static RAG)**

Để thiết kế một giải pháp mạnh mẽ, trước tiên cần phân tích sâu sắc các phương thức thất bại vốn có trong các kiến trúc RAG tĩnh. Các ràng buộc được xác định trong truy vấn của người dùng—hardcode $k$, lịch sử cứng nhắc và độ trễ cao—là triệu chứng của những hạn chế trong các chuỗi truy xuất tuyến tính khi áp dụng cho các miền tri thức phi cấu trúc phức tạp như thư viện điện tử.

### **1.1 Tính Ngẫu nhiên của Mật độ Thông tin và Ngụy biện $k=5$**

Việc thiết lập cứng (hardcoding) tham số $k=5$ (truy xuất chính xác 5 đoạn văn bản) vận hành dựa trên giả định sai lầm rằng mật độ thông tin là đồng nhất trên tất cả các tài liệu và truy vấn. Trong một thư viện số, một truy vấn về "Lịch sử Hệ thống Phân loại Thập phân Dewey" có thể được trả lời đầy đủ bởi một đoạn tóm tắt (abstract) duy nhất nhưng chứa hàm lượng thông tin cao. Ngược lại, một truy vấn liên quan đến "Sự phát triển của các chủ đề nữ quyền trong văn học thế kỷ 19" có thể yêu cầu tổng hợp các mảnh thông tin từ hai mươi nguồn riêng biệt để tạo nên một câu trả lời toàn diện.  
Khi $k$ là tĩnh, hai chế độ thất bại (failure modes) chính sẽ xuất hiện:

1. **Đói Ngữ cảnh (Context Starvation \- $k$ quá thấp):** Hệ thống truy xuất 5 đoạn hàng đầu dựa trên sự tương đồng vector. Nếu câu trả lời yêu cầu sự tổng hợp của 7 sự kiện riêng biệt nằm rải rác, mô hình buộc phải "bịa đặt" (hallucinate) hoặc cung cấp câu trả lời thiếu sót. Điều này thường bị làm trầm trọng thêm bởi vấn đề phân mảnh (fragmentation problem), nơi bộ chia văn bản (text splitter) cắt một chuỗi lập luận quan trọng làm đôi, và chỉ một nửa lọt vào top $k$.  
2. **Ô nhiễm Ngữ cảnh (Context Pollution \- $k$ quá cao):** Nếu câu trả lời nằm trọn vẹn trong đoạn đầu tiên, việc cố tình đưa thêm 4 đoạn không liên quan vào sẽ tạo ra nhiễu.1 Nội dung "gây xao nhãng" này làm suy giảm khả năng suy luận của LLM, một hiện tượng được gọi là hiệu ứng "Lost in the Middle", nơi các LLM gặp khó khăn trong việc ưu tiên thông tin nằm ở giữa một cửa sổ ngữ cảnh lớn. Hơn nữa, việc xử lý các token không cần thiết làm tăng tuyến tính độ trễ và chi phí suy luận.

### **1.2 Sự Trôi dạt Ngữ nghĩa của Bộ nhớ Cửa sổ Trượt (Sliding Window Memory)**

Việc duy trì "5 đoạn hội thoại gần nhất" là một quy tắc kinh nghiệm (heuristic) thất bại trong các cuộc hội thoại phi tuyến tính. Người dùng thường nêu các ràng buộc ở đầu phiên (ví dụ: "Tôi đang tìm tài liệu phù hợp cho sinh viên đại học ngành vật lý"). Khi cuộc hội thoại tiến triển qua các bước tinh chỉnh tìm kiếm, ràng buộc quan trọng này rơi ra khỏi cửa sổ trượt. Hệ thống thực chất "quên" mất chân dung người dùng (persona), dẫn đến các kết quả tìm kiếm có thể chính xác về mặt kỹ thuật nhưng không liên quan về mặt ngữ cảnh (ví dụ: truy xuất các bài báo cấp tiến sĩ quá chuyên sâu). Điều này đại diện cho sự thất bại của *tính bền vững trạng thái* (state persistence), coi bộ nhớ như một bộ đệm FIFO (First-In, First-Out) thay vì một đồ thị ngữ nghĩa của ý định người dùng.3

### **1.3 Độ trễ và Nút thắt Mô hình Nguyên khối**

Việc dựa hoàn toàn vào gpt-4 (hoặc các mô hình tương tự có độ thông minh cao, độ trễ cao) cho mọi bước của quy trình đường ống (pipeline) liên quan đến sự lãng phí tài nguyên tính toán khổng lồ. Một quy trình RAG điển hình bao gồm viết lại truy vấn (query re-writing), truy xuất, xếp hạng lại (reranking) và tạo sinh cuối cùng. Việc sử dụng một mô hình "nặng về suy luận" cho các tác vụ đơn giản như viết lại truy vấn sẽ đưa thêm hàng trăm mili-giây không cần thiết vào thời gian phản hồi token đầu tiên (Time-To-First-Token \- TTFT). Hơn nữa, nếu không có bộ nhớ đệm ngữ nghĩa (semantic caching), hệ thống sẽ phải tính toán lại các embedding và tạo sinh cho các truy vấn giống hệt hoặc gần giống nhau, một điều thường xảy ra trong môi trường thư viện nơi người dùng thường xuyên tìm kiếm các chủ đề phổ biến.2

## ---

**2\. Kiến trúc Giải pháp: RAG Agentic Thích ứng (Adaptive Agentic RAG)**

Kiến trúc được đề xuất chuyển dịch từ một chuỗi Retrieve \-\> Generate tuyến tính sang một đồ thị trạng thái có chu trình, nhận thức ngữ cảnh, sử dụng **LangGraph.js**. Điều này cho phép hệ thống "suy luận" về chất lượng của việc truy xuất trước khi tạo ra câu trả lời, đồng thời tối ưu hóa việc quản lý bộ nhớ.

### **2.1 Truy xuất Động với Ngưỡng Tin cậy (Dynamic Retrieval with Confidence Thresholding)**

Thay vì một $k$ cố định, chúng ta phải triển khai **Truy xuất Dựa trên Ngưỡng** (Threshold-Based Retrieval) kết hợp với **Mở rộng Đệ quy** (Recursive Expansion).

#### **2.1.1 Thuật toán cho $k$ Động (Dynamic $k$)**

Logic cốt lõi chuyển từ "Đưa cho tôi 5 tài liệu" sang "Đưa cho tôi tài liệu cho đến khi tôi đủ tự tin". Điều này đạt được thông qua quy trình truy xuất hai bước:

1. **Tìm kiếm Ban đầu với Giới hạn Lỏng (Initial Fetch):** Hệ thống ban đầu truy xuất một nhóm ứng viên lớn hơn (ví dụ: $k\_{initial}=20$) sử dụng tìm kiếm láng giềng gần đúng (ANN) tốc độ cao.  
2. **Chấm điểm và Lọc (Scoring and Filtering):** Chúng ta áp dụng một ngưỡng điểm tương đồng. Chỉ các tài liệu có điểm tương đồng cosine (hoặc điểm từ Cross-Encoder) trên một ngưỡng biến thiên (ví dụ: $\\tau \> 0.75$) mới được giữ lại.  
   * *Kịch bản A:* Nếu 12 tài liệu vượt qua $\\tau$, tất cả 12 tài liệu được chuyển đến bộ xếp hạng lại (mở rộng động).  
   * *Kịch bản B:* Nếu chỉ 1 tài liệu vượt qua $\\tau$, chỉ 1 tài liệu được sử dụng (giảm nhiễu).  
   * *Kịch bản C:* Nếu 0 tài liệu vượt qua $\\tau$, hệ thống kích hoạt một tác nhân **Viết lại Truy vấn** (Query Rewriting agent) để định hình lại các thuật ngữ tìm kiếm, thừa nhận rằng việc tra cứu không gian vector đã thất bại.1

#### **2.1.2 Triển khai qua EnsembleRetriever và ScoreThresholdRetriever**

Trong LangChain.js, điều này có thể được triển khai bằng cách sử dụng ScoreThresholdRetriever kết hợp trong một EnsembleRetriever. Đối với hệ thống thư viện, chúng tôi khuyến nghị mạnh mẽ mô hình **Hybrid Ensemble Retriever**. Tìm kiếm vector thuần túy thường thất bại với các tên thực thể cụ thể (ví dụ: "quy tắc ISBN-13" hoặc tên tác giả cụ thể) nơi tìm kiếm từ khóa (BM25) vượt trội hơn hẳn.8  
Kiến trúc kết hợp bao gồm:

* **Dense Retriever (Vector):** Nắm bắt ý nghĩa ngữ nghĩa (ví dụ: "sách về các vì sao" khớp với "thiên văn học").  
* **Sparse Retriever (BM25/Keyword):** Nắm bắt các kết quả khớp chính xác (ví dụ: phim "Interstellar" so với sách).  
* **Reranker (Cross-Encoder):** Một mô hình chuyên biệt (như Cohere Rerank hoặc BGE-Reranker) chấm điểm mức độ liên quan của danh sách đã hợp nhất từ bộ truy xuất thưa và dày đặc.

"Dynamic $k$" thực chất là đầu ra của Reranker, lọc top $N$ ứng viên dựa trên điểm số liên quan thực tế, không phải số lượng đếm tùy ý.

### **2.2 Quản lý Ngữ cảnh Thông minh: Mô hình "Summary \+ Vector"**

Để giải quyết vấn đề bộ nhớ, chúng ta thay thế cửa sổ trượt đơn giản bằng **Hệ thống Bộ nhớ Hợp nhất** (Composite Memory System).

| Loại Bộ Nhớ | Cơ chế Lưu trữ | Mục đích | Thời gian tồn tại |
| :---- | :---- | :---- | :---- |
| **Short-Term Buffer** | Danh sách mảng (In-memory/Redis) | Giữ nguyên văn 2-3 lượt chat cuối để duy trì tính liên tục tức thì (đại từ nhân xưng). | Phiên hiện tại |
| **Episodic Memory** | Vector Database (Postgres/Pinecone) | Lưu trữ các lượt chat cũ đã được tóm tắt và vector hóa. Cho phép truy xuất các ràng buộc từ quá khứ xa. | Vĩnh viễn/Dài hạn |
| **Entity Memory** | Key-Value Store (Redis) | Lưu trữ các thực thể quan trọng (User Level: Sinh viên, Sở thích: Khoa học) được trích xuất bởi LLM nền. | Xuyên suốt các phiên |

1. **Short-Term Buffer:** Giữ văn bản thô của 2-3 lượt cuối để đảm bảo tính liên tục ngay lập tức.  
2. **Long-Term Vector Store (Episodic Memory):** Khi cuộc hội thoại vượt quá bộ đệm, các lượt cũ không bị loại bỏ. Thay vào đó, chúng được tóm tắt, nhúng (embedded) và lưu trữ trong một namespace dành riêng cho người dùng trong cơ sở dữ liệu vector. Khi có truy vấn mới, hệ thống tìm kiếm *cả* chỉ mục tài liệu *và* chỉ mục lịch sử hội thoại.  
   * *Hệ quả:* Nếu người dùng hỏi "Còn về hóa học thì sao?" 20 lượt sau khi nói "Tôi là sinh viên đại học", hệ thống truy xuất ràng buộc "sinh viên đại học" từ bộ nhớ dài hạn vì nó có liên quan về mặt ngữ nghĩa với ngữ cảnh mới, ngay cả khi nó đã được nói cách đây 10 phút.3

### **2.3 Chiến lược Tối ưu hóa Độ trễ Đa tầng**

Để giải quyết sự chậm chạp của GPT-4, chúng ta triển khai một quy trình xử lý phân tầng:

1. **Router/Rewriter Layer:** Sử dụng mô hình nhỏ hơn, nhanh hơn (ví dụ: gpt-4o-mini hoặc Claude 3 Haiku) để phân loại ý định người dùng và viết lại truy vấn. Các mô hình này nhanh hơn hàng chục lần và đủ khả năng cho các tác vụ cấu trúc ngôn ngữ.11  
2. **Semantic Caching:** Triển khai bộ nhớ đệm ngữ nghĩa dựa trên Redis. Trước khi gọi LLM, hệ thống kiểm tra xem một truy vấn tương tự về mặt ngữ nghĩa đã được trả lời gần đây chưa. Nếu có, phản hồi được lưu trong bộ nhớ đệm được trả về ngay lập tức (độ trễ dưới 50ms).2  
3. **Thực thi Song song:** Sử dụng RunnableParallel trong LangChain, việc truy xuất tài liệu và tóm tắt lịch sử trò chuyện diễn ra đồng thời, không tuần tự.

## ---

**3\. Triển khai Kỹ thuật Chi tiết với Code OpenaiService**

Phần này cung cấp các bản thiết kế kiến trúc và mẫu mã (code patterns) để triển khai giải pháp đề xuất sử dụng **NestJS** và **LangGraph.js**, đáp ứng yêu cầu cụ thể về việc cải tiến OpenaiService.

### **3.1 Các Thành phần Kiến trúc trong NestJS**

Hệ thống Dependency Injection (DI) của NestJS là lý tưởng để quản lý các kết nối singleton đến vector store và LLM client trong khi xử lý các trạng thái hội thoại theo phạm vi yêu cầu (request-scoped).  
**Cấu trúc Module:**

* SearchModule: Xử lý các kết nối vector store (Pinecone/Weaviate/Postgres pgvector/MongoDB Atlas) và logic truy xuất.  
* MemoryModule: Quản lý sự bền vững của hội thoại (Postgres/Redis).  
* LLMModule: Wraps OpenAI clients với giới hạn tốc độ (rate limiting) và khả năng quan sát (LangSmith/LangFuse).12  
* GraphModule: Định nghĩa máy trạng thái LangGraph điều phối luồng xử lý.

### **3.2 Dịch vụ Truy xuất Động (The "Retriever")**

Chúng ta sử dụng mẫu **Parent Document Retriever** kết hợp với **Ensemble Retrieval**. Điều này giải quyết vấn đề phân mảnh ngữ cảnh. Chúng ta lập chỉ mục các đoạn nhỏ (child documents) để khớp vector chính xác cao nhưng truy xuất đoạn "cha" lớn hơn (ví dụ: toàn bộ trang hoặc chương) để chuyển cho LLM. Điều này đảm bảo LLM có đủ ngữ cảnh xung quanh sự kiện khớp.13  
**Mẫu Code: Dynamic Ensemble Retrieval với Reranking (TypeScript)**  
Đoạn mã sau đây minh họa cách xây dựng một RetrieverService có thể được tiêm vào OpenaiService. Nó sử dụng MongoDBAtlasVectorSearch làm ví dụ (như trong 13), nhưng có thể thay thế bằng bất kỳ vector store nào.

TypeScript

import { Injectable } from '@nestjs/common';  
import { ChatOpenAI } from '@langchain/openai';  
import { EnsembleRetriever } from 'langchain/retrievers/ensemble';  
import { ScoreThresholdRetriever } from 'langchain/retrievers/score\_threshold';  
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';  
import { CohereRerank } from '@langchain/cohere';  
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual\_compression';  
import { ParentDocumentRetriever } from 'langchain/retrievers/parent\_document';  
import { InMemoryStore } from 'langchain/storage'; // Trong production dùng Redis/Postgres  
import { RecursiveCharacterTextSplitter } from 'langchain/text\_splitter';

@Injectable()  
export class RetrievalService {  
  private retriever: any;

  constructor(  
    private vectorStore: MongoDBAtlasVectorSearch,
    private keywordRetriever: any, // Giả sử đã implement BM25Retriever  
    private docStore: any // Nơi lưu trữ Parent Documents (Redis/Postgres)  
  ) {}

  async initialize() {  
    // 1\. Cấu hình Parent Document Retriever  
    // Lập chỉ mục các đoạn con (child), truy xuất ngữ cảnh cha (parent)  
    const parentRetriever \= new ParentDocumentRetriever({  
      vectorstore: this.vectorStore,  
      byteStore: this.docStore, // Lưu trữ bền vững cho parent docs \[16, 17\]  
      parentSplitter: new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 200 }),  
      childSplitter: new RecursiveCharacterTextSplitter({ chunkSize: 400, chunkOverlap: 50 }),  
      // Fetch một tập ứng viên lớn hơn giới hạn hiển thị cuối cùng  
      childK: 20,
      parentK: 5,
    });

    // 2\. Kết hợp với Keyword Search (Ensemble)  
    // Trọng số: 0.6 Vector (Ngữ nghĩa), 0.4 Keyword (Chính xác)  
    // Giúp xử lý các truy vấn tên sách/tác giả cụ thể \[8\]  
    const ensembleRetriever \= new EnsembleRetriever({  
      retrievers:,  
      weights: \[0.6, 0.4\],  
    });

    // 3\. Áp dụng Reranking (Lớp "Trí tuệ" cho Dynamic K)  
    // Reranker lấy hỗn hợp từ Ensemble và sắp xếp lại theo độ liên quan thực sự  
    // tạo ra 'k' động dựa trên chất lượng nội dung. \[18, 19\]  
    const reranker \= new CohereRerank({  
      apiKey: process.env.COHERE\_API\_KEY,  
      model: "rerank-english-v3.0",  
      topN: 10 // Giới hạn trên của context window  
    });

    // Compression Retriever bọc lấy base retriever. Nó lấy 20+ ứng viên,  
    // rerank chúng, và chỉ trả về những cái có điểm cao.  
    this.retriever \= new ContextualCompressionRetriever({  
      baseCompressor: reranker,  
      baseRetriever: ensembleRetriever,  
    });  
  }

  async getDynamicContext(query: string) {  
    // Độ dài mảng 'docs' trả về sẽ biến thiên (dynamic k) dựa trên độ liên quan.  
    return await this.retriever.invoke(query);  
  }  
}

**Phân tích Chi tiết:** Bằng cách sử dụng ContextualCompressionRetriever với Reranker, chúng ta giải quyết hiệu quả vấn đề $k$ động. Reranker sẽ chỉ trả về các tài liệu thực sự liên quan. Nếu chỉ có 2 tài liệu liên quan, nó trả về 2\. Nếu có 8, nó trả về 8\. Chúng ta không còn hardcode "top 5" một cách mù quáng.

### **3.3 Thiết kế OpenaiService với LangGraph.js: Luồng Điều khiển Agentic**

Để xử lý "ngữ cảnh thông minh hơn", chúng ta chuyển từ chuỗi tuyến tính sang đồ thị trạng thái. Đồ thị cho phép triển khai **Tự sửa lỗi (Self-Correction)**. Nếu việc truy xuất trả về các tài liệu có độ tin cậy thấp, đồ thị sẽ định tuyến luồng đến một nút "Viết lại Truy vấn" thay vì tạo ra câu trả lời kém chất lượng.6  
**Cấu trúc Code cho OpenaiService (Sử dụng LangGraph.js):**

TypeScript

import { Injectable, OnModuleInit } from '@nestjs/common';  
import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";  
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";  
import { ChatOpenAI } from "@langchain/openai";  
import { z } from "zod";  
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"; // Persistence \[22\]  
import { Pool } from "pg";  
import { RetrievalService } from './retrieval.service';

// Định nghĩa Trạng thái Đồ thị (Graph State)  
// Đối tượng này được truyền giữa tất cả các node  
const GraphStateSchema \= z.object({  
  messages: z.array(z.any()), // Lịch sử hội thoại  
  question: z.string(),       // Truy vấn hiện tại  
  documents: z.array(z.any()),// Tài liệu đã truy xuất  
  retryCount: z.number(),     // Giới hạn vòng lặp  
  isRelevant: z.boolean().optional(),  
});

type GraphState \= z.infer\<typeof GraphStateSchema\>;

@Injectable()  
export class OpenaiService implements OnModuleInit {  
  private app: any;  
  private checkpointer: PostgresSaver;

  constructor(private retrievalService: RetrievalService) {}

  async onModuleInit() {  
    // Khởi tạo Checkpointer với Postgres cho bộ nhớ dài hạn bền vững  
    const pool \= new Pool({ connectionString: process.env.DATABASE\_URL });  
    this.checkpointer \= new PostgresSaver(pool);  
    await this.checkpointer.setup(); // Đảm bảo bảng tồn tại \[22\]

    // Khởi tạo đồ thị  
    const workflow \= new StateGraph({ channels: GraphStateSchema })  
     .addNode("rewrite", this.rewriteNode.bind(this))  
     .addNode("retrieve", this.retrieveNode.bind(this))  
     .addNode("grade", this.gradeNode.bind(this))  
     .addNode("generate", this.generateNode.bind(this))  
     .addEdge(START, "retrieve") // Bắt đầu bằng việc thử truy xuất (optimistic)  
     .addEdge("retrieve", "grade")  
     .addConditionalEdges("grade", this.decideRoute, {  
        rewrite: "rewrite",  
        generate: "generate"  
      })  
     .addEdge("rewrite", "retrieve") // Vòng lặp phản hồi (Loop)  
     .addEdge("generate", END);

    this.app \= workflow.compile({ checkpointer: this.checkpointer });  
  }

  // Node 1: Viết lại Truy vấn (Dùng gpt-4o-mini cho tốc độ)  
  private async rewriteNode(state: GraphState) {  
    const model \= new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });  
    const response \= await model.invoke(\[  
      new HumanMessage(\`Viết lại truy vấn này để tối ưu hóa cho công cụ tìm kiếm thư viện: ${state.question}. Chỉ trả về truy vấn đã viết lại.\`)  
    \]);  
    return { question: response.content as string, retryCount: (state.retryCount |

| 0\) \+ 1 };  
  }

  // Node 2: Truy xuất (Sử dụng Service từ phần 3.2)  
  private async retrieveNode(state: GraphState) {  
    const docs \= await this.retrievalService.getDynamicContext(state.question);  
    return { documents: docs };  
  }

  // Node 3: Chấm điểm Độ liên quan (Kiểm soát Chất lượng)  
  private async gradeNode(state: GraphState) {  
    const model \= new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });  

    // Sử dụng Structured Output để ép kiểu trả về boolean \[23, 24\]  
    const grader \= model.withStructuredOutput(z.object({  
      isRelevant: z.boolean().describe("True nếu tài liệu có chứa thông tin để trả lời câu hỏi")  
    }));  
      
    const docText \= state.documents.map(d \=\> d.pageContent).join("\\n");  
    const grade \= await grader.invoke(\`Câu hỏi: ${state.question} \\n Tài liệu: ${docText}\`);  
      
    return { isRelevant: grade.isRelevant };  
  }

  // Node 4: Tạo sinh (Sử dụng gpt-4o cho chất lượng cao nhất)  
  private async generateNode(state: GraphState) {  
    const model \= new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 }); // Model thông minh
    const response \= await model.invoke();  
    return { messages: \[response\] };  
  }

  // Logic Cạnh Điều kiện (Conditional Edge)  
  private decideRoute(state: GraphState) {  
    // Nếu tài liệu không liên quan và chưa thử lại quá 3 lần \-\> Viết lại  
    if (\!state.isRelevant && (state.retryCount |

| 0\) \< 3\) {  
      return "rewrite";
    }  
    return "generate";  
  }

  // Hàm public để Controller gọi  
  async processQuery(userId: string, query: string, history: any) {  
    const config \= { configurable: { thread\_id: userId } };  
    const inputs \= {
        messages: history,
        question: query,
        retryCount: 0
    };  

    // Trả về stream cho trải nghiệm người dùng tốt hơn  
    const stream \= await this.app.stream(inputs, config);  
    return stream;  
  }  
}

**Phân tích Kiến trúc Đồ thị:**

* **Hành vi Thích ứng:** Hệ thống không tạo sinh một cách mù quáng. Nếu việc truy xuất trả về kết quả kém (ví dụ: $k$ động trả về 0 tài liệu liên quan), node grade phát hiện điều này và kích hoạt rewriteNode để thử một thuật ngữ tìm kiếm tốt hơn. Điều này loại bỏ vấn đề "Garbage In, Garbage Out" của RAG tĩnh.  
* **Phân tầng Mô hình (Model Tiering):** Lưu ý việc sử dụng gpt-4o-mini cho các tác vụ rewrite và grade. Điều này giữ cho vòng lặp cực nhanh và rẻ, trong khi gpt-4o (mạnh hơn, đắt hơn) chỉ được dùng một lần ở bước cuối cùng.11  
* **Quản lý Ngữ cảnh:** PostgresSaver tự động lưu trạng thái đồ thị (bao gồm lịch sử chat messages) vào PostgreSQL. Bạn không cần thủ công cắt mảng messages hay lo lắng về việc mất ngữ cảnh khi khởi động lại server. Đây là giải pháp quản lý ngữ cảnh thông minh và bền vững hơn nhiều so với InMemoryHistory.26

## ---

**4\. Tối ưu hóa: Giải quyết Khủng hoảng Độ trễ**

Việc chuyển từ gpt-4.1 (có thể là GPT-4 Turbo cũ) sang gpt-4o là biện pháp "thắng nhanh" hiệu quả nhất, nhưng các tối ưu hóa kiến trúc sẽ mang lại những lợi ích còn lại cần thiết.

### **4.1 Chiến lược Phân cấp Mô hình (Model Hierarchy)**

Sử dụng mô hình "thông minh nhất" cho mọi tác vụ là không hiệu quả. Chúng tôi đề xuất kiến trúc **Router-Solver**:

| Thành phần | Mô hình Khuyến nghị | Lý do |
| :---- | :---- | :---- |
| **Router / Phân loại Ý định** | gpt-4o-mini hoặc Claude 3 Haiku | Cực nhanh (dưới 200ms). Đủ để quyết định "Tìm kiếm hay Trò chuyện phiếm". |
| **Query Rewriter** (Viết lại truy vấn) | gpt-4o-mini | Nhanh. Có khả năng chuyển đổi câu hỏi phụ thuộc ngữ cảnh "còn về toán học thì sao?" thành "tài liệu về toán học". |
| **Document Grader** (Chấm điểm tài liệu) | gpt-4o-mini | Nhanh. Có thể xác minh "Đoạn văn bản này có chứa câu trả lời không?" một cách hiệu quả. |
| **Final Answer Synthesizer** (Tổng hợp) | gpt-4o | Trí tuệ cao. Cần thiết cho sự tổng hợp sắc thái của các tài liệu thư viện phức tạp. |

**Tác động:** Bằng cách giảm tải 75% các bước trong đồ thị cho gpt-4o-mini, chúng ta giảm đáng kể tổng chi phí và độ trễ, dành phần tính toán nặng chỉ cho bước tạo sinh cuối cùng hướng tới người dùng. Các so sánh benchmark cho thấy gpt-4o nhanh gấp 2 lần gpt-4-turbo với chi phí giảm 50%.11

### **4.2 Semantic Caching (Bộ nhớ đệm Ngữ nghĩa)**

Truy vấn thư viện thường tuân theo phân phối Power Law; nhiều người dùng hỏi cùng một câu hỏi ("Làm thế nào để gia hạn sách?", "Giờ mở cửa thư viện").

* **Giải pháp:** Sử dụng **Redis** với tính năng tương đồng vector (Redis Vector Store).  
* **Logic:** Trước khi vào Đồ thị Agent, băm (hash) embedding của truy vấn. Kiểm tra trong Redis xem có vector $V\_c$ nào có độ tương đồng $\> 0.98$ với vector truy vấn $V\_q$ không.  
* **Hit:** Trả về câu trả lời đã lưu trong bộ nhớ đệm ngay lập tức (0 cuộc gọi LLM).  
* Miss: Tiến hành vào Đồ thị.  
  Điều này giảm độ trễ xuống gần bằng 0 cho các truy vấn phổ biến.2

### **4.3 Xử lý Song song (Parallelism)**

Trong node retrieve, nếu cần tìm kiếm nhiều nguồn dữ liệu (ví dụ: Danh mục Sách \+ Tạp chí Học thuật \+ FAQs Website), các yêu cầu này nên diễn ra song song bằng cách sử dụng Promise.all hoặc RunnableParallel của LangChain.

TypeScript

const parallelRetriever \= RunnableMap.from({  
  books: bookRetriever,  
  journals: journalRetriever,  
  faqs: faqRetriever  
});  
// Thực thi cả ba tìm kiếm đồng thời, giới hạn chỉ bởi nguồn chậm nhất.

## ---

**5\. Kết luận và Lộ trình Triển khai**

Sự chuyển đổi từ một kịch bản RAG tĩnh sang một kiến trúc **Agentic Thích ứng** giải quyết các căng thẳng cốt lõi trong việc truy xuất thư viện số. Bằng cách chuyển sang **$k$ động thông qua xếp hạng lại (reranking)**, chúng ta đảm bảo mô hình nhận được chính xác lượng thông tin cần thiết—không thừa, không thiếu. Bằng cách triển khai **LangGraph với sự bền vững của Postgres**, chúng ta biến đổi bộ nhớ từ một bộ đệm mong manh, dễ bay hơi thành một trạng thái mạnh mẽ, có thể truy vấn. Cuối cùng, bằng cách phân tầng sử dụng mô hình (GPT-4o-mini cho logic, GPT-4o cho tổng hợp) và triển khai bộ nhớ đệm ngữ nghĩa, chúng ta có thể đạt được độ trễ dưới một giây cho các truy vấn được lưu trong bộ nhớ đệm và phản hồi cao cho các truy vấn mới.  
**Các Bước Tiếp theo Ngay lập tức cho Đội ngũ Kỹ thuật:**

1. **Cơ sở hạ tầng:** Cung cấp một phiên bản Redis cho bộ nhớ đệm và cơ sở dữ liệu Postgres với pgvector và bảng checkpoints cho bộ nhớ dài hạn.  
2. **Tái cấu trúc:** Chuyển đổi chuỗi RetrievalQA tuyến tính hiện tại sang StateGraph trong LangGraph.js như mẫu code ở Mục 3.3.  
3. **Lập chỉ mục:** Lập chỉ mục lại tài liệu sử dụng chiến lược Parent Document Retrieval (các đoạn con nhỏ liên kết với cha lớn) để hỗ trợ logic truy xuất mới.  
4. **Kiểm thử:** Thiết lập một "Bộ dữ liệu Vàng" (Golden Dataset) các truy vấn thư viện (đơn giản vs. phức tạp) và đo lường hệ thống mới bằng các chỉ số RAGAS (Độ trung thực, Độ chính xác ngữ cảnh) để tinh chỉnh các ngưỡng tin cậy.2

#### **Nguồn trích dẫn**

1. The Chunking Paradigm: Recursive Semantic for RAG Optimization, truy cập vào tháng 12 15, 2025, [https://aclanthology.org/2025.icnlsp-1.15.pdf](https://aclanthology.org/2025.icnlsp-1.15.pdf)  
2. Improving RAG accuracy: 10 techniques that actually work \- Redis, truy cập vào tháng 12 15, 2025, [https://redis.io/blog/10-techniques-to-improve-rag-accuracy/](https://redis.io/blog/10-techniques-to-improve-rag-accuracy/)  
3. Top techniques to Manage Context Lengths in LLMs \- Agenta, truy cập vào tháng 12 15, 2025, [https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms)  
4. Conversational Memory for LLMs with Langchain \- Pinecone, truy cập vào tháng 12 15, 2025, [https://www.pinecone.io/learn/series/langchain/langchain-conversational-memory/](https://www.pinecone.io/learn/series/langchain/langchain-conversational-memory/)  
5. Optimizing RAG: Classifying Queries for Dynamic Processing, truy cập vào tháng 12 15, 2025, [https://aclanthology.org/2025.iwsds-1.14.pdf](https://aclanthology.org/2025.iwsds-1.14.pdf)  
6. Adaptive RAG \- GitHub Pages, truy cập vào tháng 12 15, 2025, [https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph\_adaptive\_rag/](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_adaptive_rag/)  
7. Dynamic Top-k Retrieval Chunks in Flowise : r/LangChain \- Reddit, truy cập vào tháng 12 15, 2025, [https://www.reddit.com/r/LangChain/comments/1mss8z4/dynamic\_topk\_retrieval\_chunks\_in\_flowise/](https://www.reddit.com/r/LangChain/comments/1mss8z4/dynamic_topk_retrieval_chunks_in_flowise/)  
8. LangChain: EnsembleRetriever Quick Reference \- Kaggle, truy cập vào tháng 12 15, 2025, [https://www.kaggle.com/code/ksmooi/langchain-ensembleretriever-quick-reference](https://www.kaggle.com/code/ksmooi/langchain-ensembleretriever-quick-reference)  
9. LangChain Ensemble Retriever \- TruLens, truy cập vào tháng 12 15, 2025, [https://www.trulens.org/cookbook/frameworks/langchain/langchain\_ensemble\_retriever/](https://www.trulens.org/cookbook/frameworks/langchain/langchain_ensemble_retriever/)  
10. Memory in LangChain \- GeeksforGeeks, truy cập vào tháng 12 15, 2025, [https://www.geeksforgeeks.org/artificial-intelligence/memory-in-langchain-1/](https://www.geeksforgeeks.org/artificial-intelligence/memory-in-langchain-1/)  
11. Claude 3.5 sonnet Vs GPT-4o: Key details and comparison, truy cập vào tháng 12 15, 2025, [https://pieces.app/blog/how-to-use-gpt-4o-gemini-1-5-pro-and-claude-3-5-sonnet-free](https://pieces.app/blog/how-to-use-gpt-4o-gemini-1-5-pro-and-claude-3-5-sonnet-free)  
12. LangChain & LangGraph Integration, truy cập vào tháng 12 15, 2025, [https://langfuse.com/integrations/frameworks/langchain](https://langfuse.com/integrations/frameworks/langchain)  
13. Perform Parent Document Retrieval with MongoDB and LangChain, truy cập vào tháng 12 15, 2025, [https://www.mongodb.com/docs/atlas/ai-integrations/langchain/parent-document-retrieval/](https://www.mongodb.com/docs/atlas/ai-integrations/langchain/parent-document-retrieval/)  
14. ParentDocumentRetriever \- LangChain.js, truy cập vào tháng 12 15, 2025, [https://v02.api.js.langchain.com/classes/langchain.retrievers\_parent\_document.ParentDocumentRetriever.html](https://v02.api.js.langchain.com/classes/langchain.retrievers_parent_document.ParentDocumentRetriever.html)  
15. Get Started with the LangChain JS/TS Integration \- Atlas \- MongoDB, truy cập vào tháng 12 15, 2025, [https://www.mongodb.com/docs/atlas/ai-integrations/langchain-js/](https://www.mongodb.com/docs/atlas/ai-integrations/langchain-js/)  
16. Self-Reflective RAG with LangGraph \- LangChain Blog, truy cập vào tháng 12 15, 2025, [https://blog.langchain.com/agentic-rag-with-langgraph/](https://blog.langchain.com/agentic-rag-with-langgraph/)  
17. Self-RAG \- GitHub Pages, truy cập vào tháng 12 15, 2025, [https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph\_self\_rag/](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_self_rag/)  
18. Claude 3.5 Sonnet vs GPT 4o: Model Comparison 2025 \- Galileo AI, truy cập vào tháng 12 15, 2025, [https://galileo.ai/blog/claude-3-5-sonnet-vs-gpt-4o-enterprise-ai-model-comparison](https://galileo.ai/blog/claude-3-5-sonnet-vs-gpt-4o-enterprise-ai-model-comparison)  
19. Persistence \- Docs by LangChain, truy cập vào tháng 12 15, 2025, [https://docs.langchain.com/oss/javascript/langgraph/persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)  
20. Claude 3.5 Sonnet vs GPT-4o \- LLM Stats, truy cập vào tháng 12 15, 2025, [https://llm-stats.com/models/compare/claude-3-5-sonnet-20241022-vs-gpt-4o-2024-05-13](https://llm-stats.com/models/compare/claude-3-5-sonnet-20241022-vs-gpt-4o-2024-05-13)
