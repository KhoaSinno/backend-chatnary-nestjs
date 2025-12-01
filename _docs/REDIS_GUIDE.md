# 📘 Hướng Dẫn Sử Dụng Redis trong NestJS

## 📑 Mục Lục

- [Giới Thiệu](#giới-thiệu)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình Redis](#cấu-hình-redis)
- [Setup trong NestJS](#setup-trong-nestjs)
- [Các Operations Cơ Bản](#các-operations-cơ-bản)
- [Caching Strategies](#caching-strategies)
- [Pub/Sub Pattern](#pubsub-pattern)
- [Session Management](#session-management)
- [Rate Limiting](#rate-limiting)
- [Bull Queue (Job Processing)](#bull-queue-job-processing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Giới Thiệu

**Redis (Remote Dictionary Server)** là một in-memory data structure store, được sử dụng như:

- 💾 **Database**: Lưu trữ key-value
- 🚀 **Cache**: Tăng tốc độ truy xuất data
- 📨 **Message Broker**: Pub/Sub messaging
- 🔄 **Queue**: Job processing với Bull/BullMQ
- 🔐 **Session Store**: Quản lý sessions
- ⏱️ **Rate Limiter**: Giới hạn requests

### Tại Sao Dùng Redis?

✅ **Cực kỳ nhanh** - Lưu trữ trong RAM  
✅ **Hỗ trợ nhiều data structures** - String, Hash, List, Set, Sorted Set  
✅ **Atomic operations** - Thread-safe  
✅ **TTL (Time To Live)** - Auto expire keys  
✅ **Persistence** - RDB snapshots & AOF logs  
✅ **Replication & Clustering** - High availability  

---

## 📦 Cài Đặt

### 1. Cài Đặt Redis Server

#### Docker (Khuyến Nghị)

```bash
# Pull Redis image
docker pull redis:latest

# Run Redis container
docker run --name redis-dev -p 6379:6379 -d redis:latest

# Run với password
docker run --name redis-dev -p 6379:6379 -d redis:latest redis-server --requirepass yourpassword

# Redis với persistence
docker run --name redis-dev -p 6379:6379 -v redis-data:/data -d redis:latest redis-server --appendonly yes
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-yourpassword}
    restart: unless-stopped
    networks:
      - app-network

volumes:
  redis-data:

networks:
  app-network:
    driver: bridge
```

```bash
# Start Redis
docker-compose up -d redis

# Stop Redis
docker-compose down
```

#### Windows (Manual Install)

```bash
# Download từ: https://github.com/microsoftarchive/redis/releases
# Hoặc dùng WSL2 với Ubuntu

# WSL2 Ubuntu
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

#### macOS

```bash
# Homebrew
brew install redis

# Start Redis
brew services start redis

# Stop Redis
brew services stop redis
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Check status
sudo systemctl status redis-server
```

### 2. Cài Đặt Redis Clients cho NestJS

```bash
# Option 1: ioredis (Khuyến nghị - Full features)
pnpm add ioredis
pnpm add -D @types/ioredis

# Option 2: cache-manager với redis store
pnpm add cache-manager cache-manager-redis-store
pnpm add @nestjs/cache-manager

# Option 3: Redis (Official client)
pnpm add redis

# Option 4: Upstash Redis (Serverless)
pnpm add @upstash/redis
```

### 3. Cài Đặt Bull Queue (Optional)

```bash
# Bull cho background jobs
pnpm add @nestjs/bull bull
pnpm add -D @types/bull

# Hoặc BullMQ (version mới hơn)
pnpm add @nestjs/bullmq bullmq
```

---

## ⚙️ Cấu Hình Redis

### 1. Environment Variables

Tạo hoặc cập nhật file `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword
REDIS_DB=0

# Redis URL (alternative)
REDIS_URL=redis://username:password@localhost:6379/0

# Upstash Redis (Serverless)
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Cache TTL (seconds)
CACHE_TTL=300
```

### 2. Redis Config Service

**File: `src/config/redis.config.ts`**

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  
  // Connection options
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // Keep alive
  keepAlive: 30000,
  
  // Timeout
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Max retries
  maxRetriesPerRequest: 3,
}));
```

---

## 🔧 Setup trong NestJS

### Option 1: IORedis (Khuyến Nghị)

#### 1.1. Redis Service

**File: `src/redis/redis.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    this.client = new Redis(redisConfig);

    // Event listeners
    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('❌ Redis error:', err);
    });

    this.client.on('close', () => {
      this.logger.warn('⚠️ Redis connection closed');
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Redis is ready');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  getClient(): Redis {
    return this.client;
  }

  // ========== STRING OPERATIONS ==========
  
  async set(key: string, value: string | number | object, ttl?: number): Promise<void> {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (ttl) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async del(...keys: string[]): Promise<number> {
    return await this.client.del(...keys);
  }

  async exists(...keys: string[]): Promise<number> {
    return await this.client.exists(...keys);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  async incrby(key: string, increment: number): Promise<number> {
    return await this.client.incrby(key, increment);
  }

  // ========== HASH OPERATIONS ==========
  
  async hset(key: string, field: string, value: string | number | object): Promise<number> {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return await this.client.hset(key, field, serializedValue);
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async hgetall<T = Record<string, any>>(key: string): Promise<T> {
    const data = await this.client.hgetall(key);
    const result: any = {};

    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }

    return result as T;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return await this.client.hdel(key, ...fields);
  }

  async hexists(key: string, field: string): Promise<number> {
    return await this.client.hexists(key, field);
  }

  // ========== LIST OPERATIONS ==========
  
  async lpush(key: string, ...values: (string | number)[]): Promise<number> {
    return await this.client.lpush(key, ...values.map(String));
  }

  async rpush(key: string, ...values: (string | number)[]): Promise<number> {
    return await this.client.rpush(key, ...values.map(String));
  }

  async lpop<T = any>(key: string): Promise<T | null> {
    const value = await this.client.lpop(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    const value = await this.client.rpop(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.client.llen(key);
  }

  // ========== SET OPERATIONS ==========
  
  async sadd(key: string, ...members: (string | number)[]): Promise<number> {
    return await this.client.sadd(key, ...members.map(String));
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async sismember(key: string, member: string | number): Promise<number> {
    return await this.client.sismember(key, String(member));
  }

  async srem(key: string, ...members: (string | number)[]): Promise<number> {
    return await this.client.srem(key, ...members.map(String));
  }

  async scard(key: string): Promise<number> {
    return await this.client.scard(key);
  }

  // ========== SORTED SET OPERATIONS ==========
  
  async zadd(key: string, score: number, member: string): Promise<number> {
    return await this.client.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.zrange(key, start, stop);
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    return await this.client.zrangebyscore(key, min, max);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return await this.client.zrem(key, ...members);
  }

  async zscore(key: string, member: string): Promise<string | null> {
    return await this.client.zscore(key, member);
  }

  // ========== UTILITY OPERATIONS ==========
  
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async flushdb(): Promise<string> {
    return await this.client.flushdb();
  }

  async flushall(): Promise<string> {
    return await this.client.flushall();
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async info(section?: string): Promise<string> {
    return section ? await this.client.info(section) : await this.client.info();
  }
}
```

#### 1.2. Redis Module

**File: `src/redis/redis.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Make it available globally
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

#### 1.3. Import vào App Module

**File: `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Option 2: NestJS Cache Manager với Redis

**File: `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD,
      ttl: 300, // seconds
    }),
  ],
})
export class AppModule {}
```

**Sử dụng trong Service:**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getUser(id: string) {
    // Check cache
    const cachedUser = await this.cacheManager.get(`user:${id}`);
    if (cachedUser) {
      return cachedUser;
    }

    // Fetch from DB
    const user = await this.prisma.user.findUnique({ where: { id } });

    // Save to cache (5 minutes)
    await this.cacheManager.set(`user:${id}`, user, 300);

    return user;
  }
}
```

---

## 🔍 Các Operations Cơ Bản

### 1. String Operations

```typescript
// Set & Get
await redisService.set('user:1', { id: 1, name: 'John' });
const user = await redisService.get('user:1');

// Set with TTL (expire after 60 seconds)
await redisService.set('session:abc', 'user123', 60);

// Increment counter
await redisService.incr('page:views');
await redisService.incrby('page:views', 10);

// Check if exists
const exists = await redisService.exists('user:1'); // 1 = exists, 0 = not exists

// Delete
await redisService.del('user:1');

// Multiple delete
await redisService.del('user:1', 'user:2', 'user:3');

// Set expiration
await redisService.expire('temp:data', 3600); // 1 hour

// Get TTL
const ttl = await redisService.ttl('session:abc'); // seconds remaining
```

### 2. Hash Operations (Object Storage)

```typescript
// Set hash fields
await redisService.hset('user:1', 'name', 'John');
await redisService.hset('user:1', 'email', 'john@example.com');
await redisService.hset('user:1', 'age', 30);

// Get single field
const name = await redisService.hget('user:1', 'name');

// Get all fields
const user = await redisService.hgetall('user:1');
// { name: 'John', email: 'john@example.com', age: 30 }

// Delete field
await redisService.hdel('user:1', 'age');

// Check if field exists
const hasEmail = await redisService.hexists('user:1', 'email');
```

### 3. List Operations (Queue/Stack)

```typescript
// Push to list (queue)
await redisService.rpush('notifications', 'Message 1');
await redisService.rpush('notifications', 'Message 2');

// Pop from list
const message = await redisService.lpop('notifications'); // FIFO

// Stack operations
await redisService.lpush('stack', 'Item 1');
const item = await redisService.lpop('stack'); // LIFO

// Get range
const messages = await redisService.lrange('notifications', 0, 9); // First 10 items

// Get length
const count = await redisService.llen('notifications');
```

### 4. Set Operations (Unique Values)

```typescript
// Add members
await redisService.sadd('tags', 'nodejs', 'typescript', 'redis');

// Get all members
const tags = await redisService.smembers('tags');
// ['nodejs', 'typescript', 'redis']

// Check membership
const isMember = await redisService.sismember('tags', 'nodejs');

// Remove member
await redisService.srem('tags', 'redis');

// Get count
const count = await redisService.scard('tags');
```

### 5. Sorted Set (Leaderboard)

```typescript
// Add scores
await redisService.zadd('leaderboard', 100, 'player1');
await redisService.zadd('leaderboard', 200, 'player2');
await redisService.zadd('leaderboard', 150, 'player3');

// Get top players (descending)
const client = redisService.getClient();
const topPlayers = await client.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
// ['player2', '200', 'player3', '150', 'player1', '100']

// Get rank
const rank = await client.zrevrank('leaderboard', 'player1');

// Get score
const score = await redisService.zscore('leaderboard', 'player1');

// Increment score
await client.zincrby('leaderboard', 50, 'player1');
```

---

## 🚀 Caching Strategies

### 1. Cache-Aside Pattern

```typescript
@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getProduct(id: string) {
    const cacheKey = `product:${id}`;

    // 1. Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('Cache hit');
      return cached;
    }

    // 2. Cache miss - fetch from DB
    console.log('Cache miss');
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    // 3. Store in cache (TTL: 1 hour)
    if (product) {
      await this.redis.set(cacheKey, product, 3600);
    }

    return product;
  }

  async updateProduct(id: string, data: any) {
    // Update DB
    const product = await this.prisma.product.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await this.redis.del(`product:${id}`);

    return product;
  }
}
```

### 2. Write-Through Cache

```typescript
async createProduct(data: CreateProductDto) {
  // 1. Write to DB
  const product = await this.prisma.product.create({ data });

  // 2. Write to cache
  await this.redis.set(`product:${product.id}`, product, 3600);

  return product;
}
```

### 3. Cache with Decorator

```typescript
// cache.decorator.ts
export function Cacheable(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const redis: RedisService = this.redis;
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      // Check cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute method
      const result = await originalMethod.apply(this, args);

      // Save to cache
      await redis.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// Usage
@Injectable()
export class UserService {
  constructor(private redis: RedisService) {}

  @Cacheable(600) // Cache for 10 minutes
  async getUser(id: string) {
    return await this.prisma.user.findUnique({ where: { id } });
  }
}
```

### 4. Cache Invalidation

```typescript
// Invalidate single key
await redis.del('user:123');

// Invalidate pattern
const keys = await redis.keys('user:*');
if (keys.length > 0) {
  await redis.del(...keys);
}

// Invalidate all cache
await redis.flushdb();
```

---

## 📡 Pub/Sub Pattern

### Publisher Service

```typescript
@Injectable()
export class NotificationPublisher {
  constructor(private redis: RedisService) {}

  async publishNotification(userId: string, message: string) {
    const channel = `notifications:${userId}`;
    const payload = JSON.stringify({
      userId,
      message,
      timestamp: new Date(),
    });

    const client = this.redis.getClient();
    await client.publish(channel, payload);
  }

  async broadcastMessage(message: string) {
    const client = this.redis.getClient();
    await client.publish('broadcast', message);
  }
}
```

### Subscriber Service

```typescript
import Redis from 'ioredis';

@Injectable()
export class NotificationSubscriber implements OnModuleInit {
  private subscriber: Redis;

  constructor(private configService: ConfigService) {
    this.subscriber = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
    });
  }

  async onModuleInit() {
    // Subscribe to channel
    await this.subscriber.subscribe('broadcast', 'notifications:user123');

    // Handle messages
    this.subscriber.on('message', (channel, message) => {
      console.log(`Message from ${channel}:`, message);
      
      if (channel === 'broadcast') {
        this.handleBroadcast(message);
      } else if (channel.startsWith('notifications:')) {
        this.handleNotification(channel, message);
      }
    });
  }

  private handleBroadcast(message: string) {
    console.log('Broadcast:', message);
    // Send to all connected clients via WebSocket
  }

  private handleNotification(channel: string, message: string) {
    const data = JSON.parse(message);
    console.log('Notification:', data);
    // Send to specific user via WebSocket
  }
}
```

---

## 🔐 Session Management

### Session Service

```typescript
@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 86400; // 24 hours

  constructor(private redis: RedisService) {}

  async createSession(userId: string, data: any): Promise<string> {
    const sessionId = uuidv4();
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    await this.redis.hset(key, 'userId', userId);
    await this.redis.hset(key, 'data', JSON.stringify(data));
    await this.redis.hset(key, 'createdAt', new Date().toISOString());
    await this.redis.expire(key, this.SESSION_TTL);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<any> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const session = await this.redis.hgetall(key);

    if (!session || !session.userId) {
      return null;
    }

    return {
      userId: session.userId,
      data: JSON.parse(session.data || '{}'),
      createdAt: session.createdAt,
    };
  }

  async updateSession(sessionId: string, data: any): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redis.hset(key, 'data', JSON.stringify(data));
    await this.redis.expire(key, this.SESSION_TTL); // Refresh TTL
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redis.del(key);
  }

  async getUserSessions(userId: string): Promise<string[]> {
    const keys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
    const sessions: string[] = [];

    for (const key of keys) {
      const sessionUserId = await this.redis.hget(key, 'userId');
      if (sessionUserId === userId) {
        sessions.push(key.replace(this.SESSION_PREFIX, ''));
      }
    }

    return sessions;
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    if (sessions.length > 0) {
      const keys = sessions.map(id => `${this.SESSION_PREFIX}${id}`);
      await this.redis.del(...keys);
    }
  }
}
```

---

## ⏱️ Rate Limiting

### Rate Limiter Service

```typescript
@Injectable()
export class RateLimiterService {
  constructor(private redis: RedisService) {}

  /**
   * Fixed Window Rate Limiting
   * Example: 10 requests per minute
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / windowSeconds);
    const redisKey = `ratelimit:${key}:${window}`;

    const current = await this.redis.incr(redisKey);

    if (current === 1) {
      await this.redis.expire(redisKey, windowSeconds);
    }

    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    const resetAt = (window + 1) * windowSeconds;

    return { allowed, remaining, resetAt };
  }

  /**
   * Sliding Window Rate Limiting (More accurate)
   */
  async checkSlidingWindowLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const now = Date.now();
    const redisKey = `ratelimit:sliding:${key}`;
    const client = this.redis.getClient();

    // Remove old entries
    await client.zremrangebyscore(redisKey, 0, now - windowSeconds * 1000);

    // Count current requests
    const count = await client.zcard(redisKey);

    if (count >= limit) {
      return false;
    }

    // Add new request
    await client.zadd(redisKey, now, `${now}`);
    await client.expire(redisKey, windowSeconds);

    return true;
  }

  /**
   * Token Bucket Rate Limiting
   */
  async checkTokenBucket(
    key: string,
    capacity: number,
    refillRate: number,
  ): Promise<boolean> {
    const redisKey = `ratelimit:bucket:${key}`;
    const now = Date.now();

    const bucket = await this.redis.hgetall<{
      tokens: number;
      lastRefill: number;
    }>(redisKey);

    let tokens = bucket?.tokens || capacity;
    let lastRefill = bucket?.lastRefill || now;

    // Refill tokens
    const elapsed = (now - lastRefill) / 1000;
    const tokensToAdd = elapsed * refillRate;
    tokens = Math.min(capacity, tokens + tokensToAdd);

    if (tokens < 1) {
      return false;
    }

    // Consume token
    tokens -= 1;

    await this.redis.hset(redisKey, 'tokens', tokens);
    await this.redis.hset(redisKey, 'lastRefill', now);
    await this.redis.expire(redisKey, 3600);

    return true;
  }
}
```

### Rate Limit Guard

```typescript
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private rateLimiter: RateLimiterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const key = `ip:${ip}`;

    const result = await this.rateLimiter.checkRateLimit(key, 100, 60); // 100 req/min

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter: result.resetAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add headers
    request.res.setHeader('X-RateLimit-Limit', '100');
    request.res.setHeader('X-RateLimit-Remaining', result.remaining);
    request.res.setHeader('X-RateLimit-Reset', result.resetAt);

    return true;
  }
}

// Usage in controller
@Controller('api')
@UseGuards(RateLimitGuard)
export class ApiController {
  // ...
}
```

---

## 🔄 Bull Queue (Job Processing)

### Setup Bull Module

```bash
pnpm add @nestjs/bull bull
pnpm add -D @types/bull
```

**File: `src/app.module.ts`**

```typescript
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
})
export class AppModule {}
```

### Email Queue Producer

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface EmailJob {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendEmail(data: EmailJob) {
    // Add job to queue
    await this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendBulkEmails(emails: EmailJob[]) {
    const jobs = emails.map(email => ({
      name: 'send-email',
      data: email,
    }));

    await this.emailQueue.addBulk(jobs);
  }

  async scheduleEmail(data: EmailJob, sendAt: Date) {
    const delay = sendAt.getTime() - Date.now();
    
    await this.emailQueue.add('send-email', data, {
      delay: delay > 0 ? delay : 0,
    });
  }
}
```

### Email Queue Consumer

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJob>) {
    this.logger.log(`Processing job ${job.id}`);
    
    try {
      const { to, subject, body } = job.data;
      
      // Simulate email sending
      await this.sendEmailViaProvider(to, subject, body);
      
      this.logger.log(`Email sent to ${to}`);
      
      return { success: true, to };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error; // Will retry based on attempts config
    }
  }

  private async sendEmailViaProvider(to: string, subject: string, body: string) {
    // Actual email sending logic (SendGrid, SES, etc.)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### Queue Events

```typescript
import { OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email')
export class EmailConsumer {
  @OnQueueActive()
  onActive(job: Job) {
    console.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    console.log(`Job ${job.id} completed with result:`, result);
  }

  @OnQueueFailed()
  onError(job: Job, error: Error) {
    console.error(`Job ${job.id} failed with error:`, error.message);
  }
}
```

### Queue Management

```typescript
@Injectable()
export class QueueManagementService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async pauseQueue() {
    await this.emailQueue.pause();
  }

  async resumeQueue() {
    await this.emailQueue.resume();
  }

  async cleanQueue() {
    await this.emailQueue.clean(0, 'completed');
    await this.emailQueue.clean(0, 'failed');
  }

  async getJob(jobId: string) {
    return await this.emailQueue.getJob(jobId);
  }

  async removeJob(jobId: string) {
    const job = await this.emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }
}
```

---

## ✨ Best Practices

### 1. Key Naming Convention

```typescript
// ✅ Good - Hierarchical structure
'user:123:profile'
'user:123:posts'
'session:abc123'
'cache:product:456'
'ratelimit:ip:192.168.1.1'

// ❌ Bad - Unclear structure
'user123profile'
'data_456'
```

### 2. Set TTL for Keys

```typescript
// ✅ Always set TTL to prevent memory leaks
await redis.set('temp:data', value, 3600); // 1 hour

// ❌ No TTL - memory leak risk
await redis.set('temp:data', value);
```

### 3. Error Handling

```typescript
async function getFromCache(key: string) {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Redis error:', error);
    // Fallback to database or return null
    return null;
  }
}
```

### 4. Connection Pooling

```typescript
// Use single Redis instance (Singleton)
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

### 5. Monitoring

```typescript
// Monitor slow commands
const client = redis.getClient();

client.on('ready', () => {
  client.config('SET', 'slowlog-log-slower-than', '10000'); // 10ms
  client.config('SET', 'slowlog-max-len', '128');
});

// Get slow log
async function getSlowLog() {
  const client = redis.getClient();
  const slowLog = await client.slowlog('get', 10);
  console.log('Slow queries:', slowLog);
}
```

### 6. Pipeline for Bulk Operations

```typescript
// ✅ Use pipeline for multiple commands
async function setMultiple(data: Record<string, any>) {
  const client = redis.getClient();
  const pipeline = client.pipeline();

  for (const [key, value] of Object.entries(data)) {
    pipeline.set(key, JSON.stringify(value));
  }

  await pipeline.exec();
}

// ❌ Slow - Multiple round trips
async function setMultipleSlow(data: Record<string, any>) {
  for (const [key, value] of Object.entries(data)) {
    await redis.set(key, value); // Each is a separate network call
  }
}
```

### 7. Use Scan Instead of Keys

```typescript
// ✅ Use SCAN for production
async function findKeys(pattern: string): Promise<string[]> {
  const client = redis.getClient();
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [newCursor, foundKeys] = await client.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      100,
    );
    cursor = newCursor;
    keys.push(...foundKeys);
  } while (cursor !== '0');

  return keys;
}

// ❌ KEYS blocks Redis - Never use in production
const keys = await redis.keys('user:*'); // Blocks Redis!
```

---

## 🐛 Troubleshooting

### 1. Connection Issues

```typescript
// Check connection
try {
  await redis.ping();
  console.log('Redis connected');
} catch (error) {
  console.error('Redis connection failed:', error);
}

// Check Redis server
// Run in terminal:
// redis-cli ping
// redis-cli info server
```

### 2. Memory Issues

```bash
# Check memory usage
redis-cli info memory

# Find large keys
redis-cli --bigkeys

# Set max memory
redis-cli config set maxmemory 256mb
redis-cli config set maxmemory-policy allkeys-lru
```

### 3. Performance Issues

```typescript
// Enable query logging
const redis = new Redis({
  lazyConnect: true,
  showFriendlyErrorStack: true,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Monitor commands
redis.monitor((err, monitor) => {
  monitor.on('monitor', (time, args) => {
    console.log('Command:', args);
  });
});
```

### 4. Data Persistence

```bash
# Enable AOF (Append Only File)
redis-cli config set appendonly yes
redis-cli config set appendfsync everysec

# Manual save
redis-cli save
redis-cli bgsave
```

---

## 📚 Common Use Cases

### 1. Shopping Cart

```typescript
@Injectable()
export class CartService {
  constructor(private redis: RedisService) {}

  async addToCart(userId: string, productId: string, quantity: number) {
    const key = `cart:${userId}`;
    await this.redis.hset(key, productId, quantity);
    await this.redis.expire(key, 86400 * 7); // 7 days
  }

  async getCart(userId: string) {
    const key = `cart:${userId}`;
    return await this.redis.hgetall(key);
  }

  async removeFromCart(userId: string, productId: string) {
    const key = `cart:${userId}`;
    await this.redis.hdel(key, productId);
  }

  async clearCart(userId: string) {
    const key = `cart:${userId}`;
    await this.redis.del(key);
  }
}
```

### 2. Real-time Analytics

```typescript
@Injectable()
export class AnalyticsService {
  constructor(private redis: RedisService) {}

  async trackPageView(url: string) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `pageviews:${date}:${url}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400 * 30); // 30 days
  }

  async getPageViews(url: string, date: string) {
    const key = `pageviews:${date}:${url}`;
    const views = await this.redis.get(key);
    return parseInt(views || '0', 10);
  }

  async trackUserActivity(userId: string, action: string) {
    const timestamp = Date.now();
    const key = `activity:${userId}`;
    await this.redis.zadd(key, timestamp, `${action}:${timestamp}`);
    await this.redis.expire(key, 86400); // 24 hours
  }
}
```

### 3. Distributed Lock

```typescript
@Injectable()
export class LockService {
  constructor(private redis: RedisService) {}

  async acquireLock(
    resource: string,
    ttl: number = 10000,
  ): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = uuidv4();
    const client = this.redis.getClient();

    const result = await client.set(
      lockKey,
      lockValue,
      'PX',
      ttl,
      'NX',
    );

    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    const client = this.redis.getClient();

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await client.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }

  async withLock<T>(
    resource: string,
    callback: () => Promise<T>,
    ttl: number = 10000,
  ): Promise<T> {
    const lockValue = await this.acquireLock(resource, ttl);

    if (!lockValue) {
      throw new Error('Failed to acquire lock');
    }

    try {
      return await callback();
    } finally {
      await this.releaseLock(resource, lockValue);
    }
  }
}

// Usage
await lockService.withLock('payment:user123', async () => {
  // Critical section - only one instance can execute this
  await processPayment(userId);
});
```

---

## 🚀 Redis Cloud Options

### 1. Upstash Redis (Serverless)

```bash
pnpm add @upstash/redis
```

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Same API as ioredis
await redis.set('key', 'value');
const value = await redis.get('key');
```

### 2. AWS ElastiCache

```env
REDIS_HOST=your-cluster.cache.amazonaws.com
REDIS_PORT=6379
```

### 3. Azure Cache for Redis

```env
REDIS_HOST=your-cache.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-access-key
```

---

## 🎓 Tổng Kết

### Redis là giải pháp tốt cho

✅ Caching - Giảm database load  
✅ Session storage - User sessions  
✅ Real-time analytics - Counters, leaderboards  
✅ Rate limiting - API throttling  
✅ Queue management - Background jobs  
✅ Pub/Sub - Real-time messaging  
✅ Distributed locks - Prevent race conditions  

### Lưu Ý Quan Trọng

- Redis lưu data trong RAM → Nhanh nhưng giới hạn memory
- Luôn set TTL để tránh memory leak
- Dùng SCAN thay vì KEYS trong production
- Monitor memory usage thường xuyên
- Backup data với RDB/AOF
- Dùng Redis Cluster cho high availability

---

**Happy Caching with Redis! 🚀**
