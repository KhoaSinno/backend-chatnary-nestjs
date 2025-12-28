# NeonDB Connection Guide - Fix Auto-Suspend Issues

## 🔴 Vấn đề

NeonDB có tính năng **auto-suspend** - tự động ngắt kết nối khi không hoạt động trong một khoảng thời gian. Điều này gây ra lỗi:

```
Error: Connection terminated unexpectedly
```

## ✅ Giải pháp đã implement

### 1. **Sử dụng Pooled Connection String**

NeonDB cung cấp 2 loại connection string:

- **Direct connection**: Kết nối trực tiếp tới PostgreSQL
- **Pooled connection** (`-pooler`): Kết nối qua PgBouncer với connection pooling

**Cách lấy Pooled Connection String:**

1. Vào [Neon Console](https://console.neon.tech)
2. Chọn project của bạn
3. Click "Connect"
4. Bật toggle "Connection pooling"
5. Copy connection string có chứa `-pooler` trong hostname

**Ví dụ:**

```bash
# Direct connection (không nên dùng cho production)
postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/dbname

# Pooled connection (nên dùng) ✅
postgresql://user:pass@ep-cool-darkness-123456-pooler.us-east-2.aws.neon.tech/dbname
```

### 2. **Cấu hình trong .env**

```env
# Pooled connection - dùng cho app queries (default)
DATABASE_URL_NEON=postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/dbname?sslmode=require&connect_timeout=10&pool_timeout=10&keepalives=1&keepalives_idle=30

# Direct connection - chỉ dùng cho migrations
DATABASE_URL_NEON_DIRECT=postgresql://user:pass@ep-xxx.aws.neon.tech/dbname?sslmode=require
```

**Query parameters quan trọng:**

- `connect_timeout=10`: Timeout khi connect (seconds)
- `pool_timeout=10`: Timeout khi lấy connection từ pool
- `keepalives=1`: Bật TCP keepalive
- `keepalives_idle=30`: Gửi keepalive packet mỗi 30s
- `keepalives_interval=10`: Interval giữa các keepalive packets
- `keepalives_count=5`: Số lần retry keepalive trước khi timeout

### 3. **Prisma Configuration**

File `schema.prisma`:

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL_NEON")       // Pooled connection
  directUrl  = env("DATABASE_URL_NEON_DIRECT") // Direct connection for migrations
  extensions = [vector]
}
```

### 4. **PrismaService với lifecycle hooks**

File `src/prisma/prisma.service.ts` đã được cấu hình với:

- `OnModuleInit`: Kết nối khi app start
- `OnModuleDestroy`: Cleanup khi app shutdown
- Logging để debug connection issues

## 📊 Connection Pooling Settings

### PgBouncer (NeonDB mặc định)

```
pool_mode = transaction
max_client_conn = 10,000
default_pool_size = 0.9 * max_connections
query_wait_timeout = 120 seconds
```

### Prisma Connection Pool (tự động)

Prisma Client tự động quản lý connection pool với:

- Connection reuse
- Automatic reconnection
- Query queueing

## 🛠️ Best Practices

### 1. **Sử dụng đúng connection string cho từng mục đích**

```typescript
// ✅ App queries - dùng pooled connection
const data = await prisma.user.findMany();

// ✅ Migrations - dùng direct connection (tự động từ directUrl)
// prisma migrate dev
```

### 2. **Xử lý errors đúng cách**

```typescript
try {
  await prisma.user.create({ data });
} catch (error) {
  if (error.code === 'P2024') {
    // Connection timeout - retry logic
    console.error('Connection timeout, retrying...');
  }
  throw error;
}
```

### 3. **Health check endpoint** (Optional)

```typescript
@Get('health/db')
async checkDatabase() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

### 4. **Graceful shutdown**

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable graceful shutdown
  app.enableShutdownHooks();
  
  await app.listen(8000);
}
```

## ⚠️ Limitations của Transaction Mode

PgBouncer ở transaction mode **KHÔNG hỗ trợ**:

- `SET`/`RESET` statements (session variables)
- `LISTEN`/`NOTIFY`
- `WITH HOLD CURSOR`
- `PREPARE`/`DEALLOCATE` (SQL-level)
- Session-level advisory locks

**Giải pháp:** Dùng direct connection cho các tính năng này.

## 🔍 Troubleshooting

### Lỗi: "Connection terminated unexpectedly"

1. Check xem có dùng pooled connection string không
2. Verify connection string có `-pooler` trong hostname
3. Check network/firewall settings
4. Verify NeonDB project còn active

### Lỗi: "Too many connections"

1. Giảm `connection_limit` trong Prisma Client
2. Sử dụng connection pooling (pooled connection string)
3. Close unused connections properly

### Lỗi: "relation does not exist" với pooled connection

1. Dùng direct connection cho migrations
2. Hoặc specify schema explicitly: `schema.table`
3. Hoặc set persistent search_path:

   ```sql
   ALTER ROLE your_role SET search_path TO your_schema;
   ```

## 📚 References

- [NeonDB Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Prisma with NeonDB](https://www.prisma.io/docs/orm/overview/databases/neondb)
- [PgBouncer Documentation](https://www.pgbouncer.org/config.html)

---
**Last updated:** December 28, 2025
