# 📘 Hướng Dẫn Sử Dụng Prisma Chi Tiết

## 📑 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Schema Prisma](#schema-prisma)
- [Migrations](#migrations)
- [Prisma Client](#prisma-client)
- [Query Database](#query-database)
- [Relations & Joins](#relations--joins)
- [Transactions](#transactions)
- [Raw Queries](#raw-queries)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Giới Thiệu

Prisma là một **ORM (Object-Relational Mapping)** hiện đại cho Node.js và TypeScript. Prisma giúp bạn:

- ✅ Tự động sinh TypeScript types an toàn
- ✅ Quản lý database schema và migrations
- ✅ Query database với API trực quan
- ✅ Hỗ trợ PostgreSQL, MySQL, SQLite, MongoDB, SQL Server

---

## 📦 Cài Đặt

### 1. Cài Đặt Packages

```bash
# Cài đặt Prisma CLI (dev dependency)
pnpm add -D prisma

# Cài đặt Prisma Client (runtime dependency)
pnpm add @prisma/client

# Cài đặt dotenv để load biến môi trường
pnpm add -D dotenv @types/dotenv
```

### 2. Khởi Tạo Prisma

```bash
# Tạo thư mục prisma và file schema.prisma
npx prisma init

# Hoặc chỉ định database provider ngay từ đầu
npx prisma init --datasource-provider postgresql
```

---

## ⚙️ Cấu Hình

### 1. File `.env`

Tạo file `.env` ở root project:

```env
# Local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Hoặc Neon PostgreSQL (Cloud)
DATABASE_URL_NEON="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

**Lưu ý:** Đừng commit file `.env` vào Git! Thêm vào `.gitignore`:

```gitignore
.env
.env.local
.env*.local
```

### 2. File `prisma/schema.prisma`

Đây là file cấu hình chính của Prisma:

```prisma
// Generator - Sinh Prisma Client
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"  // Tùy chọn: Đổi vị trí output
}

// Datasource - Kết nối database
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_NEON")  // Lấy từ biến môi trường
}

// Models - Định nghĩa tables
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3. File `prisma.config.ts` (Tùy Chọn)

File config nâng cao cho Prisma:

```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL_NEON'),
  },
});
```

---

## 📊 Schema Prisma

### 1. Các Kiểu Dữ Liệu (Data Types)

```prisma
model Example {
  // String types
  id       String   @id @default(uuid())
  email    String   @unique
  name     String?  // Optional (nullable)
  
  // Number types
  age      Int
  price    Float
  amount   Decimal  @db.Decimal(10, 2)
  
  // Boolean
  isActive Boolean  @default(true)
  
  // Date/Time
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  birthDate DateTime?
  
  // JSON
  metadata Json?
  settings Json     @default("{}")
  
  // Enum
  role     Role     @default(USER)
  
  // UUID (PostgreSQL)
  uuid     String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### 2. Attributes & Modifiers

```prisma
model User {
  // Primary Key
  id        Int      @id @default(autoincrement())
  uuid      String   @id @default(uuid())
  
  // Unique constraint
  email     String   @unique
  username  String   @unique
  
  // Optional fields
  name      String?
  bio       String?
  
  // Default values
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Database-specific types
  metadata  Json     @db.JsonB  // PostgreSQL JSONB
  price     Decimal  @db.Decimal(10, 2)
  
  // Composite unique
  @@unique([email, username])
  
  // Index
  @@index([email])
  @@index([createdAt, updatedAt])
  
  // Table name mapping
  @@map("users")
}
```

### 3. Relations (Quan Hệ)

#### One-to-One

```prisma
model User {
  id      String   @id @default(uuid())
  email   String   @unique
  profile Profile?  // Một user có một profile
}

model Profile {
  id     String @id @default(uuid())
  bio    String?
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

#### One-to-Many

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  posts Post[]  // Một user có nhiều posts
}

model Post {
  id       String @id @default(uuid())
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

#### Many-to-Many

```prisma
model Post {
  id         String     @id @default(uuid())
  title      String
  categories Category[]  // Nhiều categories
}

model Category {
  id    String @id @default(uuid())
  name  String
  posts Post[]  // Nhiều posts
}
```

#### Many-to-Many với Explicit Join Table

```prisma
model Post {
  id             String           @id @default(uuid())
  title          String
  postCategories PostCategory[]
}

model Category {
  id             String           @id @default(uuid())
  name           String
  postCategories PostCategory[]
}

model PostCategory {
  postId     String
  categoryId String
  assignedAt DateTime @default(now())
  
  post       Post     @relation(fields: [postId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])
  
  @@id([postId, categoryId])
}
```

---

## 🔄 Migrations

### 1. Tạo Migration Mới

```bash
# Tạo migration từ thay đổi trong schema.prisma
npx prisma migrate dev --name init

# Ví dụ: Thêm field mới
npx prisma migrate dev --name add_user_bio

# Ví dụ: Tạo bảng mới
npx prisma migrate dev --name create_posts_table
```

**Flow của `prisma migrate dev`:**

1. Đọc schema.prisma
2. Tạo file SQL migration
3. Apply migration vào database
4. Generate Prisma Client mới

### 2. Apply Migrations (Production)

```bash
# Chỉ apply migrations (không generate client)
npx prisma migrate deploy

# Dùng trong CI/CD pipeline
DATABASE_URL=$PROD_DB_URL npx prisma migrate deploy
```

### 3. Reset Database

```bash
# ⚠️ XÓA toàn bộ data và reset database
npx prisma migrate reset

# Tự động:
# 1. Drop database
# 2. Tạo database mới
# 3. Apply tất cả migrations
# 4. Chạy seed script (nếu có)
```

### 4. Migration History

```bash
# Xem trạng thái migrations
npx prisma migrate status

# Kiểm tra migrations đã apply
npx prisma migrate resolve --applied <migration_name>

# Đánh dấu migration đã apply (không chạy)
npx prisma migrate resolve --rolled-back <migration_name>
```

### 5. Generate Prisma Client

```bash
# Generate/Regenerate Prisma Client
npx prisma generate

# Tự động chạy sau mỗi `npm install` nếu thêm vào package.json:
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

---

## 💻 Prisma Client

### 1. Setup trong NestJS

**File: `src/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected from database');
  }
}
```

**File: `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export để dùng ở modules khác
})
export class AppModule {}
```

### 2. Sử Dụng trong Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Các methods sẽ được trình bày ở phần Query Database
}
```

---

## 🔍 Query Database

### 1. CRUD Operations

#### Create

```typescript
// Tạo một record
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    password: 'hashed_password',
  },
});

// Tạo với relation
const user = await prisma.user.create({
  data: {
    email: 'jane@example.com',
    name: 'Jane Doe',
    password: 'hashed_password',
    posts: {
      create: [
        { title: 'First Post', content: 'Hello World' },
        { title: 'Second Post', content: 'Prisma is awesome' },
      ],
    },
  },
  include: {
    posts: true, // Include posts trong response
  },
});

// Tạo nhiều records
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1', password: 'pass1' },
    { email: 'user2@example.com', name: 'User 2', password: 'pass2' },
  ],
  skipDuplicates: true, // Bỏ qua duplicate keys
});
```

#### Read (Find)

```typescript
// Tìm một record duy nhất
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});

// Tìm hoặc throw error
const user = await prisma.user.findUniqueOrThrow({
  where: { id: '123' },
});

// Tìm record đầu tiên match
const user = await prisma.user.findFirst({
  where: {
    email: {
      contains: '@example.com',
    },
  },
});

// Tìm nhiều records
const users = await prisma.user.findMany({
  where: {
    role: 'USER',
    isActive: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10, // Limit 10
  skip: 0,  // Offset 0
});

// Đếm records
const count = await prisma.user.count({
  where: {
    isActive: true,
  },
});

// Aggregate
const result = await prisma.post.aggregate({
  _count: true,
  _avg: { views: true },
  _sum: { likes: true },
  _min: { createdAt: true },
  _max: { createdAt: true },
});
```

#### Update

```typescript
// Update một record
const user = await prisma.user.update({
  where: { id: '123' },
  data: {
    name: 'New Name',
    updatedAt: new Date(),
  },
});

// Update hoặc create (upsert)
const user = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: {
    name: 'John Updated',
  },
  create: {
    email: 'john@example.com',
    name: 'John New',
    password: 'password',
  },
});

// Update nhiều records
const updateResult = await prisma.user.updateMany({
  where: {
    isActive: false,
  },
  data: {
    role: 'GUEST',
  },
});
console.log(`Updated ${updateResult.count} users`);

// Increment/Decrement số
const post = await prisma.post.update({
  where: { id: '123' },
  data: {
    views: { increment: 1 },
    likes: { decrement: 1 },
  },
});
```

#### Delete

```typescript
// Xóa một record
const user = await prisma.user.delete({
  where: { id: '123' },
});

// Xóa nhiều records
const deleteResult = await prisma.user.deleteMany({
  where: {
    createdAt: {
      lt: new Date('2023-01-01'),
    },
  },
});
console.log(`Deleted ${deleteResult.count} users`);

// Xóa tất cả records (⚠️ Nguy hiểm!)
await prisma.user.deleteMany({});
```

### 2. Filtering & Operators

```typescript
// String filters
const users = await prisma.user.findMany({
  where: {
    email: { contains: '@gmail.com' },        // LIKE %@gmail.com%
    name: { startsWith: 'John' },             // LIKE John%
    username: { endsWith: '_admin' },         // LIKE %_admin
    bio: { not: null },                       // IS NOT NULL
    role: { in: ['ADMIN', 'MODERATOR'] },     // IN (...)
    status: { notIn: ['BANNED', 'DELETED'] }, // NOT IN (...)
  },
});

// Number filters
const posts = await prisma.post.findMany({
  where: {
    views: { gte: 100 },      // >= 100
    likes: { lte: 50 },       // <= 50
    comments: { gt: 10 },     // > 10
    shares: { lt: 5 },        // < 5
    score: { equals: 100 },   // = 100
    rating: { not: 0 },       // != 0
  },
});

// Date filters
const recentUsers = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lt: new Date('2024-12-31'),
    },
  },
});

// Logical operators
const users = await prisma.user.findMany({
  where: {
    AND: [
      { isActive: true },
      { role: 'USER' },
    ],
    // Hoặc
    OR: [
      { email: { contains: '@gmail.com' } },
      { email: { contains: '@yahoo.com' } },
    ],
    // NOT
    NOT: {
      role: 'BANNED',
    },
  },
});
```

### 3. Select & Include

```typescript
// Select chỉ một số fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // Không lấy password
  },
});

// Include relations
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: true,
    profile: true,
  },
});

// Include với filters
const usersWithPublishedPosts = await prisma.user.findMany({
  include: {
    posts: {
      where: {
        published: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    },
  },
});

// Nested select
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    },
  },
});
```

### 4. Sorting & Pagination

```typescript
// Sorting
const users = await prisma.user.findMany({
  orderBy: {
    createdAt: 'desc',
  },
});

// Multiple sorting
const posts = await prisma.post.findMany({
  orderBy: [
    { published: 'desc' },
    { createdAt: 'desc' },
  ],
});

// Pagination (Offset-based)
async function getUsers(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  
  return {
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Pagination (Cursor-based) - Tốt hơn cho large datasets
async function getUsersCursor(cursor?: string, take: number = 10) {
  const users = await prisma.user.findMany({
    take: take + 1, // Lấy thêm 1 để check hasMore
    ...(cursor && {
      skip: 1, // Bỏ qua cursor
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: 'desc' },
  });
  
  const hasMore = users.length > take;
  if (hasMore) users.pop(); // Xóa item thừa
  
  return {
    data: users,
    nextCursor: hasMore ? users[users.length - 1].id : null,
  };
}
```

---

## 🔗 Relations & Joins

### 1. One-to-One Relations

```typescript
// Create user with profile
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John',
    password: 'password',
    profile: {
      create: {
        bio: 'Software Developer',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    },
  },
  include: {
    profile: true,
  },
});

// Update profile
await prisma.user.update({
  where: { id: userId },
  data: {
    profile: {
      update: {
        bio: 'Senior Developer',
      },
    },
  },
});
```

### 2. One-to-Many Relations

```typescript
// Get user with all posts
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      orderBy: { createdAt: 'desc' },
    },
  },
});

// Count posts per user
const users = await prisma.user.findMany({
  include: {
    _count: {
      select: { posts: true },
    },
  },
});
```

### 3. Many-to-Many Relations

```typescript
// Thêm categories cho post
const post = await prisma.post.update({
  where: { id: postId },
  data: {
    categories: {
      connect: [
        { id: 'category1' },
        { id: 'category2' },
      ],
    },
  },
  include: {
    categories: true,
  },
});

// Xóa categories khỏi post
await prisma.post.update({
  where: { id: postId },
  data: {
    categories: {
      disconnect: [
        { id: 'category1' },
      ],
    },
  },
});

// Get posts with categories
const posts = await prisma.post.findMany({
  include: {
    categories: true,
    author: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
});
```

---

## 💰 Transactions

### 1. Sequential Transactions

```typescript
// Tất cả operations thành công hoặc rollback
const result = await prisma.$transaction(async (tx) => {
  // Tạo user
  const user = await tx.user.create({
    data: {
      email: 'john@example.com',
      name: 'John',
      password: 'password',
    },
  });
  
  // Tạo profile
  const profile = await tx.profile.create({
    data: {
      userId: user.id,
      bio: 'New user',
    },
  });
  
  // Tạo notification
  await tx.notification.create({
    data: {
      userId: user.id,
      message: 'Welcome!',
    },
  });
  
  return { user, profile };
});
```

### 2. Batch Transactions

```typescript
// Chạy nhiều operations cùng lúc
const [user, posts, comments] = await prisma.$transaction([
  prisma.user.create({ data: { ... } }),
  prisma.post.createMany({ data: [...] }),
  prisma.comment.deleteMany({ where: { ... } }),
]);
```

### 3. Interactive Transactions

```typescript
// Transaction với timeout và isolation level
const result = await prisma.$transaction(
  async (tx) => {
    // Kiểm tra balance
    const account = await tx.account.findUnique({
      where: { id: accountId },
    });
    
    if (account.balance < amount) {
      throw new Error('Insufficient funds');
    }
    
    // Trừ tiền
    await tx.account.update({
      where: { id: accountId },
      data: {
        balance: { decrement: amount },
      },
    });
    
    // Tạo transaction record
    return await tx.transaction.create({
      data: {
        accountId,
        amount: -amount,
        type: 'WITHDRAWAL',
      },
    });
  },
  {
    maxWait: 5000, // 5s
    timeout: 10000, // 10s
    isolationLevel: 'Serializable',
  }
);
```

---

## ⚡ Raw Queries

### 1. Raw SQL Queries

```typescript
// Execute raw SQL
const users = await prisma.$queryRaw`
  SELECT * FROM users 
  WHERE email LIKE ${`%@gmail.com`}
  ORDER BY created_at DESC
  LIMIT 10
`;

// Execute raw với parameters
const email = 'john@example.com';
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// Execute update/delete
const result = await prisma.$executeRaw`
  UPDATE posts 
  SET views = views + 1 
  WHERE id = ${postId}
`;
console.log(`Affected rows: ${result}`);
```

### 2. Raw Queries với Type Safety

```typescript
import { Prisma } from '@prisma/client';

// Define type cho raw query result
type UserWithPostCount = {
  id: string;
  email: string;
  name: string;
  postCount: number;
};

const users: UserWithPostCount[] = await prisma.$queryRaw`
  SELECT 
    u.id,
    u.email,
    u.name,
    COUNT(p.id)::int as "postCount"
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  GROUP BY u.id
  ORDER BY "postCount" DESC
  LIMIT 10
`;
```

### 3. Query với Prisma.sql

```typescript
import { Prisma } from '@prisma/client';

// Safe từ SQL injection
const email = 'john@example.com';
const users = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM users WHERE email = ${email}`
);
```

---

## ✨ Best Practices

### 1. Error Handling

```typescript
import { Prisma } from '@prisma/client';

async function createUser(email: string, name: string, password: string) {
  try {
    const user = await prisma.user.create({
      data: { email, name, password },
    });
    return user;
  } catch (error) {
    // Unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Email already exists');
      }
    }
    
    // Foreign key constraint
    if (error.code === 'P2003') {
      throw new Error('Related record not found');
    }
    
    // Record not found
    if (error.code === 'P2025') {
      throw new Error('Record not found');
    }
    
    throw error;
  }
}
```

### 2. Performance Optimization

```typescript
// ❌ N+1 Query Problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
}

// ✅ Solution: Include relation
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
});

// ✅ Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // Không lấy password, createdAt, updatedAt
  },
});

// ✅ Use indexes
// Trong schema.prisma:
model User {
  email String @unique
  
  @@index([createdAt])
  @@index([email, name])
}
```

### 3. Connection Pooling

```typescript
// File: prisma.service.ts
import { PrismaClient } from '@prisma/client';

// Singleton pattern
let prisma: PrismaClient;

export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

// Hoặc cấu hình connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=20`,
    },
  },
});
```

### 4. Soft Delete

```prisma
// Schema
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

```typescript
// Middleware cho soft delete
prisma.$use(async (params, next) => {
  // Chuyển delete thành update
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }
  
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data.deletedAt = new Date();
    } else {
      params.args.data = { deletedAt: new Date() };
    }
  }
  
  return next(params);
});

// Lọc bỏ deleted records
prisma.$use(async (params, next) => {
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.action = 'findFirst';
    params.args.where = {
      ...params.args.where,
      deletedAt: null,
    };
  }
  
  if (params.action === 'findMany') {
    if (params.args.where) {
      if (!params.args.where.deletedAt) {
        params.args.where.deletedAt = null;
      }
    } else {
      params.args.where = { deletedAt: null };
    }
  }
  
  return next(params);
});
```

### 5. Logging & Monitoring

```typescript
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // > 1s
    console.warn('Slow query detected:', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params,
    });
  }
});
```

---

## 🐛 Troubleshooting

### 1. Lỗi Thường Gặp

#### P2002: Unique constraint failed

```typescript
// Lỗi: Email đã tồn tại
try {
  await prisma.user.create({
    data: { email: 'existing@example.com', ... },
  });
} catch (error) {
  if (error.code === 'P2002') {
    console.error('Email already exists');
  }
}
```

#### P2025: Record not found

```typescript
// Dùng findUniqueOrThrow để throw error tự động
const user = await prisma.user.findUniqueOrThrow({
  where: { id: '123' },
});

// Hoặc handle manually
const user = await prisma.user.findUnique({
  where: { id: '123' },
});
if (!user) {
  throw new Error('User not found');
}
```

### 2. Database Out of Sync

```bash
# Reset database và migrations
npx prisma migrate reset

# Hoặc pull schema từ database hiện tại
npx prisma db pull

# Sau đó generate client
npx prisma generate
```

### 3. Schema vs Database Drift

```bash
# Kiểm tra drift
npx prisma migrate status

# Tạo migration để sync
npx prisma migrate dev --name fix_drift

# Hoặc push schema trực tiếp (development only)
npx prisma db push
```

### 4. Performance Issues

```bash
# Enable query logging
DATABASE_URL="postgresql://...?log_statement=all"

# Analyze slow queries
npx prisma studio
```

---

## 📚 Các Lệnh Prisma Quan Trọng

```bash
# Khởi tạo Prisma
npx prisma init

# Generate Prisma Client
npx prisma generate

# Format schema.prisma
npx prisma format

# Validate schema
npx prisma validate

# Pull schema từ database
npx prisma db pull

# Push schema lên database (dev only)
npx prisma db push

# Tạo migration
npx prisma migrate dev --name <name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Kiểm tra migration status
npx prisma migrate status

# Mở Prisma Studio (GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

---

## 🎓 Ví Dụ Thực Tế: User & Posts Module

### Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  
  @@index([email])
  @@index([createdAt])
  @@map("users")
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  views     Int      @default(0)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([authorId])
  @@index([published, createdAt])
  @@map("posts")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, name: string, password: string) {
    return this.prisma.user.create({
      data: { email, name, password },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findAll(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        posts: {
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

---

## 🚀 Tổng Kết

### Workflow Cơ Bản

1. **Setup**: `npx prisma init`
2. **Define Schema**: Viết models trong `schema.prisma`
3. **Create Migration**: `npx prisma migrate dev --name init`
4. **Generate Client**: `npx prisma generate`
5. **Use Client**: Import và dùng trong code

### Tips Quan Trọng

- ✅ Luôn dùng `select` để chỉ lấy fields cần thiết
- ✅ Dùng `include` để tránh N+1 queries
- ✅ Thêm indexes cho các fields hay query
- ✅ Dùng transactions cho operations quan trọng
- ✅ Handle errors đúng cách (P2002, P2025, etc.)
- ✅ Log slow queries để optimize
- ❌ Không commit file `.env`
- ❌ Không dùng `migrate dev` trong production
- ❌ Không expose password trong select/include

---

## 📖 Tài Liệu Tham Khảo

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)

---

**Happy Coding with Prisma! 🎉**
