# **📘 TÀI LIỆU MÔ TẢ NGHIỆP VỤ: HỆ THỐNG THƯ VIỆN ĐIỆN TỬ THÔNG MINH (RAG-AI)**

## **1\. TỔNG QUAN HỆ THỐNG**

Hệ thống là một nền tảng quản lý tri thức tập trung, kết hợp giữa **lưu trữ tài liệu truyền thống** và **trí tuệ nhân tạo (RAG)**. Điểm khác biệt cốt lõi là khả năng biến tài liệu tĩnh (PDF/DOCX) thành dữ liệu có thể tương tác (Chat/Hỏi đáp) và khả năng cộng tác nhóm trong các dự án học tập/nghiên cứu.

## ---

**2\. CHI TIẾT CHỨC NĂNG THEO ACTOR**

### **👤 ACTOR 1: NGƯỜI DÙNG (USER) \- Sinh viên, Giảng viên**

*Người sử dụng chính, tập trung vào khai thác dữ liệu và cộng tác.*

#### **1.1. Quản lý tài khoản (Auth)**

* **Đăng ký/Đăng nhập:** Hỗ trợ Email/Password và SSO (Google/Microsoft \- nếu cần sau này).  
* **Profile:** Cập nhật thông tin cá nhân, avatar.

#### **1.2. Quản lý Tài liệu Cá nhân (My Library)**

* **Upload tài liệu:** Hỗ trợ định dạng PDF, DOCX.  
  * *Logic:* Hệ thống tự động đẩy vào hàng đợi xử lý AI (Queue) để OCR \-\> Chunking \-\> Embedding \-\> Lưu vào Vector DB.  
  * *Trạng thái:* Processing (Đang xử lý) \-\> Done (Sẵn sàng) \-\> Error(Lỗi).  
* **Quản lý file:** Đổi tên, Xóa (Xóa file gốc \+ Xóa vector data tương ứng), Di chuyển vào thư mục.  
* **Chia sẻ:** Tạo link chia sẻ (Public/Private) hoặc gửi quyền xem cho user khác.

#### **1.3. Quản lý Dự án & Cộng tác (Workspace \- TÍNH NĂNG MỚI)**

* **CRUD Project:** Ví dụ: "Nhóm NCKH Mùa Thu", color hex: `#FFFFFF`  
* **Thêm tài liệu vào Project:**  
  * Import từ "My Library" (Tài liệu cá nhân).  
  * Pin (Ghim) tài liệu từ "Public Library" (Tài liệu thư viện công cộng).  
* **Mời thành viên (Member Invite):** Mời user khác vào Project qua email. Phân quyền: Viewer (Chỉ xem), Editor (Được upload thêm/chat).  
* **Project Chat (Group Chat):**  
  * Chat thời gian thực giữa các thành viên.  
  * **@AI Mention:** Gõ @AI để hỏi bot ngay trong nhóm. AI sẽ trả lời dựa trên context là **tất cả tài liệu đang có trong Project này**.

#### **1.4. Chat & Hỏi đáp (RAG Core)**

* **Chat với phạm vi tài liệu trong project:** Mở file \-\> Khung chat bên cạnh \-\> Hỏi đáp chi tiết về nội dung project đó. (Improve logic thay vì dùng **static rag**)  
* **Chat tổng hợp (Chat nằm bên ngoài project):** Hỏi 1 câu, AI search toàn bộ docs của user đã login, nếu chưa login thì chat với tài liệu public.  
* **Mỗi lần chat thì sẽ được Citation tương ứng với tài liệu:** Câu trả lời của AI phải highlight được nguồn (Số trang, tên file) để user kiểm chứng.  
* Chat (**Semantic Search**) thì dùng distance algorithms để đo khoảng cách giữa các vector. Gọi là tìm kiếm **ngữ nghĩa (Semantic)** chứ không phải **“Key word”**

#### **1.5. Khai thác**

* **Lưu yêu thích (Bookmark):** Đánh dấu tài liệu hay để truy cập nhanh.  
* **Tải tài liệu:** Chỉ cho phép tải các tài liệu có cờ allow\_download \= true.  
* **Lịch sử:** Xem lại các file đã mở gần đây.

### ---

**📚 ACTOR 2: QUẢN LÝ THƯ VIỆN (LIBRARIAN)**

*Người đảm bảo chất lượng nội dung (Content Quality Assurance).*

#### **2.1. Quản lý Danh mục & Metadata (Chuẩn bị cho ElasticSearch)**

* **Chuẩn hóa Metadata:** Khi upload hoặc duyệt tài liệu, Librarian điền các trường: Tiêu đề, Tác giả, Năm xuất bản, Ngôn ngữ, Lĩnh vực (Category), Tags.  
* **Auto-fill Metadata:** AI gợi ý điền tự động các thông tin trên dựa vào trang đầu của tài liệu.

#### **2.2. Quản lý Bộ sưu tập (Collections)**

* **Curated Lists:** Tạo các danh sách tài liệu theo chủ đề (VD: "Giáo trình nhập môn lập trình", "Tài liệu ôn thi cuối kỳ").  
* **Thiết lập quyền truy cập:** Bộ sưu tập này dành cho ai? (Public cho Guest / Chỉ Member / Chỉ Giảng viên).

#### **2.3. Hiệu chỉnh dữ liệu RAG (Data Cleaning) \- QUAN TRỌNG \=\> Chưa sure**

* **Sửa lỗi OCR:**  
  * *Vấn đề:* PDF cũ, scan mờ khiến AI đọc thành ký tự lạ (@\#$%), làm Search/Chat bị sai.  
  * *Giải pháp:* Librarian xem nội dung AI đã trích xuất (Text View) so với file gốc (PDF View). Cho phép sửa lại text sai \-\> Lưu \-\> **Trigger Re-embedding** (Hệ thống xóa vector cũ, tạo vector mới từ text đã sửa).  
* **Sửa phân trang:** Điều chỉnh lại số trang nếu AI nhận diện sai (để trích dẫn cho đúng).

### ---

**🛠️ ACTOR 3: QUẢN TRỊ HỆ THỐNG (SYSTEM ADMIN)**

*Người vận hành kỹ thuật và giám sát hạ tầng.*

#### **3.1. Quản trị Người dùng & Policy**

* **User Management:** Danh sách user, tìm kiếm user, Ban/Unban tài khoản, Đổi Role (User \-\> Librarian).  
* **Quota Management:** Thiết lập giới hạn cho từng gói (VD: Sinh viên thường upload tối đa 100MB, Giảng viên 1GB).

#### **3.2. Giám sát & Logs**

* **Activity Logs:** Xem ai đã làm gì (User A xóa file B lúc mấy giờ).  
* **System Health (PM2 Integration):** Xem trạng thái các service (API, Worker AI) thông qua giao diện Admin (CPU usage, RAM usage, Error logs).  
* **Statistics Dashboard:**  
  * Số lượng user mới.  
  * Tổng số file, tổng dung lượng lưu trữ.  
  * Số lượng câu hỏi AI đã trả lời (Token usage) để ước tính chi phí.

#### **3.3. Quản lý Cấu hình AI & Storage**

* **AI Configuration:**  
  * *Model Selection:* Chọn model LLM (GPT-3.5, GPT-4, hay Local Llama).  
  * *Chunking Strategy:* Cấu hình độ dài đoạn cắt (Chunk size: 1000 hay 2000 tokens), độ chồng lặp (Overlap).  
* **Storage Logging:** Tracking log AWS S3.  
* **Phục hồi dữ liệu:** "Thùng rác" hệ thống \- khôi phục các tài liệu mà User/Librarian đã lỡ tay xóa vĩnh viễn (Soft delete).

### ---

**🌍 ACTOR 4: KHÁCH (GUEST) \- (Đơn giản, muốn nhiều hơn thì loggin)**

* **Tra cứu Public:** Tìm kiếm và xem thông tin (metadata \+ tóm tắt) các tài liệu được set là PUBLIC.  
* **Preview:** Xem trước 1 vài trang đầu (Watermarked \- đóng dấu bản quyền nếu cần).  
* **Kiosk Mode:** Chế độ dành cho máy tra cứu tại thư viện (chỉ search, không login).

### ---

**TÓM TẮT LUỒNG DỮ LIỆU CHÍNH (KEY FLOWS)**

1. Luồng Upload & Xử lý:  
   User Upload \-\> Server lưu File \-\> Queue Worker \-\> OCR (Tách chữ) \-\> Chunking (Cắt đoạn) \-\> Embedding (Vector hóa) \-\> Lưu vào Vector DB (PgVector).  
2. Luồng Chat RAG:  
   User hỏi \-\> Tạo vector câu hỏi \-\> Tìm kiếm vector tương đồng trong DB \-\> Lấy các đoạn text liên quan \-\> Gửi Prompt \+ Context cho LLM \-\> Trả về câu trả lời \-\> Lưu lịch sử Chat.  
3. Luồng Cộng tác (Collaboration):  
   User A tạo Project \-\> Add User B \-\> A upload file vào Project \-\> B thấy file \-\> B chat với file đó \-\> Hệ thống dùng chung Index Vector của file cho cả A và B (Tiết kiệm tài nguyên).

Bạn thấy bản mô tả này đã đủ chi tiết để bắt tay vào code chưa? Có phần logic nào cần làm rõ thêm không?

# 🎉 **TÓM TẮT NHANH — Hệ thống thư viện thông minh có 6 actor**

| Actor                | Vai trò           | Mô tả                                 |
| -------------------- | ----------------- | ------------------------------------- |
| **USER**             | Người dùng thường | Tìm kiếm, đọc tài liệu, tạo project   |
| **LIBRARIAN**        | Biên tập tài liệu | Quản lý nội dung & metadata           |
| **ADMIN**            | Quản trị viên     | Toàn quyền hệ thống                   |
| **GUEST**            | Khách             | Tra cứu công khai không cần đăng nhập |
| **KIOSK**            | Máy tra cứu       | Giới hạn tính năng, không login       |
| **INTERNAL_SERVICE** | Máy xử lý AI      | OCR, chunking, embedding, RAG         |

---

# 🚀 **Phân quyền theo thực tế hệ thống của bạn (tối ưu nhất)**

| Chức năng                 | USER  | LIBRARIAN | ADMIN |
| ------------------------- | ----- | --------- | ----- |
| Upload tài liệu           | ✔ Own | ✔         | ✔     |
| Duyệt/Xác nhận tài liệu   | ✖     | ✔         | ✔     |
| Sửa metadata              | ✖     | ✔         | ✔     |
| Chat với tài liệu private | ✔ Own | ✔         | ✔     |
| Chat với tài liệu public  | ✔     | ✔         | ✔     |
| Xem tất cả project        | ✖     | ✔         | ✔     |
| Quản lý user              | ✖     | ✖         | ✔     |
| Xóa tài liệu người khác   | ✖     | ✖         | ✔     |
