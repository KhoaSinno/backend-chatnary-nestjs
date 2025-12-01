# Prisma Migration - Sync với Database có sẵn

## 🎯 Tình huống

Database trên server (NeonDB) đã có tables và data, cần đồng bộ Prisma migration history với database hiện tại **mà không mất data**.

## ⚠️ Lỗi thường gặp

```
Drift detected: Your database schema is not in sync with your migration history.
We need to reset the "public" schema...
All data will be lost.
```

## ✅ Giải pháp (Baselining)

### Bước 1: Pull schema từ database

```bash
npx prisma db pull
```

**Kết quả:** File `prisma/schema.prisma` được cập nhật với schema từ database.

**Lưu ý:** Nếu có warning về `vector` type:

```
WARNING: These fields are not supported by Prisma Client
  - Model: "documents", field: "embedding", original data type: "vector"
```

→ Bỏ qua, sẽ xử lý ở bước sau.

---

### Bước 2: Tạo baseline migration

```bash
# Tạo folder migration với timestamp
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_init

# Hoặc trên Windows Git Bash:
mkdir -p prisma/migrations/20251130000001_init
```

---

### Bước 3: Generate SQL từ database hiện tại

```bash
npx prisma migrate diff \
  --from-empty \
  --to-config-datasource \
  --script > prisma/migrations/20251130000001_init/migration.sql
```

**Kết quả:** File SQL được tạo với schema hiện tại của database.

---

### Bước 4: Fix migration SQL (nếu dùng pgvector)

Mở file `prisma/migrations/20251130000001_init/migration.sql` và sửa:

**Trước:**

```sql
-- CreateTable
CREATE TABLE "public"."documents" (
    "embedding" vector(),
    ...
);
```

**Sau:**

```sql
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "public"."documents" (
    "embedding" vector(1536),  -- Thêm dimension
    ...
);
```

---

### Bước 5: Đánh dấu migration đã applied

```bash
npx prisma migrate resolve --applied 20251130000001_init
```

**Kết quả:**

```
Migration 20251130000001_init marked as applied.
```

---

### Bước 6: Verify

```bash
npx prisma migrate status
```

**Kết quả mong đợi:**

```
Database schema is up to date!
```

---

## 🔄 Quy trình hoàn chỉnh (Copy-paste)

```bash
# 1. Pull schema từ database
npx prisma db pull

# 2. Tạo folder migration
mkdir -p prisma/migrations/20251130000001_init

# 3. Generate baseline SQL
npx prisma migrate diff \
  --from-empty \
  --to-config-datasource \
  --script > prisma/migrations/20251130000001_init/migration.sql

# 4. Sửa file migration.sql (thêm CREATE EXTENSION, fix vector type)
# ... edit manually ...

# 5. Đánh dấu đã applied
npx prisma migrate resolve --applied 20251130000001_init

# 6. Verify
npx prisma migrate status
```

---

## 🐛 Troubleshooting

### Lỗi: "Migration was modified after it was applied"

**Nguyên nhân:** Đã chạy `migrate resolve` trước khi sửa file SQL.

**Fix:**

```bash
# Xóa migration cũ
rm -rf prisma/migrations/20251130000001_init

# Tạo lại với timestamp mới
mkdir -p prisma/migrations/20251130000002_init

# Generate lại SQL (đã fix)
npx prisma migrate diff \
  --from-empty \
  --to-config-datasource \
  --script > prisma/migrations/20251130000002_init/migration.sql

# Đánh dấu applied
npx prisma migrate resolve --applied 20251130000002_init
```

---

### Lỗi: "syntax error at or near ')'" với vector()

**Nguyên nhân:** pgvector extension chưa được khai báo và `vector()` thiếu dimension.

**Fix trong migration.sql:**

```sql
-- Thêm extension TRƯỚC khi CREATE TABLE
CREATE EXTENSION IF NOT EXISTS vector;

-- Sửa vector() → vector(1536)
"embedding" vector(1536),
```

---

### Lỗi: "Migration cannot be rolled back"

**Nguyên nhân:** Migration đã ở trạng thái `applied`, không thể rollback.

**Fix:**

```bash
# Xóa migration và tạo lại
rm -rf prisma/migrations/[migration-name]
# ... tạo lại từ đầu
```

---

## 📋 Checklist

- [ ] `npx prisma db pull` - Pull schema từ database
- [ ] `mkdir -p prisma/migrations/[timestamp]_init` - Tạo folder
- [ ] Generate SQL với `prisma migrate diff`
- [ ] Sửa `migration.sql`: thêm `CREATE EXTENSION vector`, fix `vector(1536)`
- [ ] `npx prisma migrate resolve --applied [name]` - Đánh dấu applied
- [ ] `npx prisma migrate status` - Verify thành công

---

## 📚 Tài liệu tham khảo

- [Prisma: Baselining with existing database](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining)
- [Prisma 7: Migration guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrade-from-prisma-6-to-prisma-7)
- [pgvector documentation](https://github.com/pgvector/pgvector)
