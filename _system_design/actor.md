<!-- TODO: -->
# 🎭 **1. Tổng quan các Actor trong hệ thống Thư viện thông minh**

Một hệ thống thư viện điện tử hiện đại (Digital Library + RAG AI Search) thường có những actor sau:

---

# 🟦 **1) Người dùng phổ thông (User / Student / Reader)**

**Hành vi:**

* Đăng ký / đăng nhập
* Tạo project tài liệu riêng
* Upload tài liệu cá nhân
* Chat / hỏi đáp với tài liệu
* Tìm kiếm tài liệu
* Lưu tài liệu yêu thích
* Tải tài liệu được phép tải
* Xem lịch sử truy cập

**Vai trò bạn đã setup trong DB:**
`USER`

---

# 🟧 **2) Biên tập viên tài liệu (Document Curator / Librarian)**

Đây là vai trò **rất quan trọng trong thư viện**, bạn nên có.

**Hành vi:**

* Quản lý danh mục tài liệu
* Kiểm tra & duyệt tài liệu được người dùng upload
* Gắn metadata (tác giả, thể loại, mô tả)
* Chia tài liệu vào các thư mục / bộ sưu tập
* Sửa lỗi OCR, lỗi phân trang
* Tối ưu dữ liệu dùng cho vector search

**Vai trò này thường gọi là:**
`LIBRARIAN` hoặc `EDITOR`

---

# 🟥 **3) Quản trị viên hệ thống (System Admin)**

Vai trò cao nhất.

**Hành vi:**

* Quản trị người dùng (ban, change role)
* Quản lý tài liệu toàn hệ thống
* Quản lý phân quyền & policy
* Xem logs hoạt động
* Xem thống kê sử dụng thư viện
* Phục hồi tài liệu bị xóa
* Quản lý cấu hình AI / embedding / chunking
* Quản lý storage (S3/GCS/local)
* Quản lý keys, API access

Vai trò trong DB:
`ADMIN`

---

# 🟩 **4) Khách (Guest)**

Nếu bạn muốn **cho phép người chưa đăng nhập**:

* Xem tài liệu public
* Search 1 phần tài liệu public
* Dùng demo chatbot
* Xem mô tả hệ thống

=> Đây là actor tùy ý, nhưng rất hay dùng.

Vai trò:
`GUEST` (thực chất không cần trong DB — chỉ cần route public)

---

# 🟨 **5) API Client / Kiosk** (Quan trọng cho "máy tra cứu thư viện")

Trong yêu cầu của bạn có nói:

> *"bản chất thư viện là có máy để tra cứu"*

Máy tra cứu là thiết bị đặt trực tiếp trong thư viện cho sinh viên, người dân tra cứu mà không cần tài khoản.

Actor này thường:

* Không cần đăng nhập
* Chỉ được đọc tài liệu public
* Không được sửa / upload
* Không được chat với tài liệu private

Vai trò:
`KIOSK` hoặc dùng API key riêng.

---

# 🟫 **6) AI Processing Actor (Internal Service)**

Đây là actor **không phải con người**.

Nó dùng để:

* Xử lý OCR
* Chunking PDF
* Tạo embedding
* Lưu vào vector database
* Generate answer

Nó cần quyền cao *nhưng không phải Admin*.

Vai trò:
`INTERNAL_SERVICE`

Thường được authenticate bằng API key hoặc internal network.

---

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

# 🔥 **Bạn nên implement role theo enum như sau:**

```prisma
enum UserRole {
  USER
  LIBRARIAN
  ADMIN
}
```

Guest và Kiosk không cần lưu trong DB.

Internal service dùng API key.

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
