# 🚀 QUICK START: Cải Tiến Chat History - Priority Actions

## 📋 Checklist Cải Tiến Quan Trọng Nhất

### ✅ Phase 1: Critical Fixes (Làm ngay trong 1-2 tuần)

#### 1. Tạo Separate Message Model

**Tại sao:** Better type safety, easier querying, better performance

**File:** `prisma/schema.prisma`

```prisma
model ChatMessage {
  id        String   @id @default(uuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      String   // 'user' | 'assistant' | 'system'
  content   String   @db.Text
  metadata  Json?    // citations, token count, etc.
  createdAt DateTime @default(now())
  
  @@index([chatId, createdAt])
  @@map("chat_messages")
}

model Chat {
  id        String        @id @default(uuid())
  userId    String
  projectId String?
  title     String?       @db.VarChar(200)
  messages  ChatMessage[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  
  @@index([userId, createdAt])
  @@map("chats")
}
```

**Chạy migration:**

```bash
npx prisma migrate dev --name add-chat-messages-table
```

---

#### 2. Update Chat Service để sử dụng Message Model

**File:** `src/chat/chat.service.ts`

**OLD:**

```typescript
const historyMessages = await this.prisma.chats.findUnique({
  where: { id: chatId },
  select: { messages: true },
});

const contentHistory: MessageType[] = (
  (historyMessages?.messages ?? []) as MessageType[]
).slice(-historyNum);
```

**NEW:**

```typescript
// Get last N messages efficiently
const recentMessages = await this.prisma.chatMessage.findMany({
  where: { chatId },
  orderBy: { createdAt: 'desc' },
  take: historyNum,
  select: {
    role: true,
    content: true,
  },
});

// Reverse to get chronological order
const contentHistory: MessageType[] = recentMessages.reverse();
```

**Save messages:**

**OLD:**

```typescript
// Update với messages array (inefficient)
await this.prisma.chats.update({
  where: { id: chatId },
  data: {
    messages: [...existingMessages, userMsg, assistantMsg],
  },
});
```

**NEW:**

```typescript
// Create individual messages (efficient)
await this.prisma.chatMessage.createMany({
  data: [
    {
      chatId,
      role: 'user',
      content: chatDto.message,
      metadata: { timestamp: new Date() },
    },
    {
      chatId,
      role: 'assistant',
      content: answer,
      metadata: { 
        citations: citations.map(c => c.index),
        responseTime: Date.now() - startTime,
      },
    },
  ],
});
```

---

#### 3. Add Error Handling Middleware

**File:** `src/chat/chat.service.ts`

```typescript
private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
  const startTime = Date.now();
  let chatId = chatDto.chatId;

  try {
    // Validate chat access if chatId provided
    if (chatId) {
      await this.validateChatAccess(chatId, chatDto.userId);
    }

    // ... rest of logic ...

    return {
      answer,
      citations,
      chatId,
    };

  } catch (error) {
    // Log error with context
    this.logger.error('Chat processing failed', {
      chatId,
      userId: chatDto.userId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });

    // Handle specific errors
    if (error instanceof BadRequestException || 
        error instanceof ForbiddenException) {
      throw error;
    }

    // Re-throw generic error
    throw new Error(
      'Unable to process your message. Please try again later.'
    );
  }
}

private async validateChatAccess(
  chatId: string,
  userId: string
): Promise<void> {
  const chat = await this.prisma.chat.findUnique({
    where: { id: chatId },
    select: { userId: true },
  });

  if (!chat) {
    throw new BadRequestException('Chat not found');
  }

  if (chat.userId !== userId) {
    throw new ForbiddenException('Access denied to this chat');
  }
}
```

---

#### 4. Add Rate Limiting

**Install:**

```bash
pnpm add @nestjs/throttler
```

**File:** `src/app.module.ts`

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 20,  // 20 requests
    }]),
    // ... other imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**File:** `src/chat/chat.controller.ts`

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('chat')
export class ChatController {
  @Post('global')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Override: 10 per minute
  async chatGlobal(@Body() chatDto: ChatDto, @Req() req) {
    return this.chatService.chatGlobal(chatDto, req.user.userId);
  }
}
```

---

#### 5. Add Token-Based History Window

**File:** `src/chat/utils/token-counter.util.ts`

```typescript
export class TokenCounter {
  // Rough estimation: ~4 characters per token
  static estimate(text: string): number {
    return Math.ceil(text.length / 4);
  }

  static estimateMessages(messages: { content: string }[]): number {
    return messages.reduce(
      (sum, msg) => sum + this.estimate(msg.content),
      0
    );
  }
}
```

**File:** `src/chat/chat.service.ts`

```typescript
import { TokenCounter } from './utils/token-counter.util';

private async getRelevantHistory(
  chatId: string,
  maxTokens: number = 2000
): Promise<MessageType[]> {
  // Get more messages than needed
  const messages = await this.prisma.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take: 20, // Get up to 20 recent messages
    select: {
      role: true,
      content: true,
    },
  });

  // Filter by token count
  const relevantMessages: MessageType[] = [];
  let tokenCount = 0;

  for (const msg of messages) {
    const msgTokens = TokenCounter.estimate(msg.content);
    
    if (tokenCount + msgTokens <= maxTokens) {
      relevantMessages.unshift(msg); // Add to front (chronological)
      tokenCount += msgTokens;
    } else {
      break;
    }
  }

  return relevantMessages;
}

// Use in chatUtil
private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
  // ... setup ...

  // Use token-based history instead of fixed count
  const contentHistory = await this.getRelevantHistory(
    chatId,
    2000 // Max 2000 tokens
  );

  // ... rest of logic ...
}
```

---

### ✅ Phase 2: Performance Optimization (Tuần 3-4)

#### 6. Add Redis Caching

**Install:**

```bash
pnpm add ioredis
pnpm add -D @types/ioredis
```

**File:** `src/cache/cache.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private redis: Redis;

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }
}
```

**File:** `src/cache/cache.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
```

**Update `src/chat/chat.service.ts`:**

```typescript
@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
    private readonly cache: CacheService, // Add this
  ) {}

  private async getHistoryWithCache(
    chatId: string,
    maxTokens: number = 2000
  ): Promise<MessageType[]> {
    const cacheKey = `chat:history:${chatId}`;
    
    // Try cache first
    const cached = await this.cache.get<MessageType[]>(cacheKey);
    if (cached) {
      console.log('✅ History cache hit');
      return cached;
    }

    // Fallback to database
    const messages = await this.getRelevantHistory(chatId, maxTokens);
    
    // Cache for 5 minutes
    await this.cache.set(cacheKey, messages, 300);
    
    return messages;
  }

  // Invalidate cache when new message is added
  private async saveMessagesAndInvalidateCache(
    chatId: string,
    userMessage: string,
    assistantMessage: string,
    citations: CitationType[]
  ): Promise<void> {
    // Save to DB
    await this.prisma.chatMessage.createMany({
      data: [
        { chatId, role: 'user', content: userMessage },
        { 
          chatId, 
          role: 'assistant', 
          content: assistantMessage,
          metadata: { citations: citations.map(c => c.index) },
        },
      ],
    });

    // Invalidate cache
    await this.cache.del(`chat:history:${chatId}`);
  }
}
```

---

#### 7. Add Chat Title Auto-Generation

**File:** `src/chat/chat.service.ts`

```typescript
private async generateChatTitle(
  firstMessage: string
): Promise<string> {
  try {
    const prompt = `Generate a concise, descriptive title (max 6 words) for a chat that starts with this message. Reply with ONLY the title in Vietnamese.\n\nMessage: ${firstMessage}`;

    const title = await this.openaiService
      .getRewriteModel()
      .invoke([{ role: 'user', content: prompt }])
      .then((res) => (res.content as string).trim());

    // Clean up and limit length
    const cleaned = title
      .replace(/^["']|["']$/g, '') // Remove quotes
      .substring(0, 100);

    return cleaned || firstMessage.substring(0, 50) + '...';
    
  } catch (error) {
    console.warn('Failed to generate title, using fallback');
    return firstMessage.substring(0, 50) + '...';
  }
}

// Use when creating new chat
if (!chatId) {
  const title = await this.generateChatTitle(chatDto.message);
  
  const created = await this.prisma.chat.create({
    data: {
      userId: chatDto.userId,
      projectId: chatDto.projectId,
      title,
    },
  });
  
  chatId = created.id;
}
```

---

## 🧪 Testing Script

**File:** `src/chat/chat.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../llm/openai/openai.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { CacheService } from '../cache/cache.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: jest.Mocked<PrismaService>;
  let openai: jest.Mocked<OpenaiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: {
            chat: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            chatMessage: {
              findMany: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: OpenaiService,
          useValue: {
            getRewriteModel: jest.fn(),
          },
        },
        {
          provide: RetrievalService,
          useValue: {
            retrieveAndRerank: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get(PrismaService);
    openai = module.get(OpenaiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateChatTitle', () => {
    it('should generate title from first message', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        content: 'Hỏi về Entropy và IG',
      });

      openai.getRewriteModel.mockReturnValue({
        invoke: mockInvoke,
      } as any);

      const title = await service['generateChatTitle'](
        'IG, entropy la gi, tinh nhu nao?'
      );

      expect(title).toBe('Hỏi về Entropy và IG');
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('should use fallback if generation fails', async () => {
      openai.getRewriteModel.mockReturnValue({
        invoke: jest.fn().mockRejectedValue(new Error('API error')),
      } as any);

      const longMessage = 'a'.repeat(100);
      const title = await service['generateChatTitle'](longMessage);

      expect(title).toContain('...');
      expect(title.length).toBeLessThanOrEqual(53);
    });
  });

  describe('validateChatAccess', () => {
    it('should allow access to own chat', async () => {
      prisma.chat.findUnique.mockResolvedValue({
        id: 'chat-1',
        userId: 'user-1',
      } as any);

      await expect(
        service['validateChatAccess']('chat-1', 'user-1')
      ).resolves.not.toThrow();
    });

    it('should deny access to other users chat', async () => {
      prisma.chat.findUnique.mockResolvedValue({
        id: 'chat-1',
        userId: 'user-1',
      } as any);

      await expect(
        service['validateChatAccess']('chat-1', 'user-2')
      ).rejects.toThrow('Access denied');
    });

    it('should throw error for non-existent chat', async () => {
      prisma.chat.findUnique.mockResolvedValue(null);

      await expect(
        service['validateChatAccess']('invalid-id', 'user-1')
      ).rejects.toThrow('Chat not found');
    });
  });
});
```

**Run tests:**

```bash
pnpm test chat.service
```

---

## 📝 Environment Variables

**File:** `.env`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chatnary"

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=20

# Chat Settings
CHAT_HISTORY_MAX_TOKENS=2000
CHAT_HISTORY_MAX_MESSAGES=20
CHAT_CACHE_TTL=300

# OpenAI
OPENAI_API_KEY=your-api-key
```

---

## 🚀 Deployment Steps

### 1. Update Prisma Schema

```bash
npx prisma migrate dev --name add-chat-messages
npx prisma generate
```

### 2. Install Dependencies

```bash
pnpm install @nestjs/throttler ioredis
pnpm install -D @types/ioredis
```

### 3. Update Code

- Copy all code snippets từ guide này
- Test locally trước khi deploy

### 4. Test

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Manual test
node test-chat-simple.js
```

### 5. Deploy

```bash
# Build
pnpm build

# Start production
pnpm start:prod
```

---

## 📊 Monitoring Commands

### Check Redis

```bash
redis-cli
> keys chat:*
> get chat:history:some-chat-id
> ttl chat:history:some-chat-id
```

### Check Database

```sql
-- Count messages per chat
SELECT chatId, COUNT(*) as message_count
FROM chat_messages
GROUP BY chatId
ORDER BY message_count DESC;

-- Check chat titles
SELECT id, title, createdAt
FROM chats
ORDER BY createdAt DESC
LIMIT 10;

-- Average response time (from metadata)
SELECT AVG(CAST(metadata->>'responseTime' AS INTEGER)) as avg_response_time
FROM chat_messages
WHERE role = 'assistant'
AND metadata->>'responseTime' IS NOT NULL;
```

---

## ✅ Success Metrics

Track these sau khi implement:

1. **Performance**
   - Response time giảm (nhờ caching): Target < 3s
   - Cache hit rate > 50%

2. **Reliability**
   - Error rate giảm: Target < 1%
   - No crashes từ malformed data

3. **User Experience**
   - Chat titles tự động được tạo
   - History context chính xác hơn

4. **Security**
   - No unauthorized access to chats
   - Rate limiting prevents abuse

---

## 🆘 Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping
# Should return PONG

# Start Redis (if not running)
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:alpine
```

### Migration Issues

```bash
# Reset database (CAREFUL: loses data)
npx prisma migrate reset

# Apply specific migration
npx prisma migrate deploy
```

### Test Failures

```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall
pnpm install

# Re-run tests
pnpm test --clearCache
```

---

**Bắt đầu với Phase 1, hoàn thành trong 1-2 tuần để có foundation vững chắc!** 🚀
