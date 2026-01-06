# Streaming Chat Implementation Guide

**Hướng dẫn chi tiết cài đặt Streaming Chat với Server-Sent Events (SSE)**

> 📌 Tài liệu này hướng dẫn từng bước để implement real-time streaming chat trong ứng dụng RAG (Retrieval-Augmented Generation), giúp user không phải đợi response hoàn chỉnh mà thấy từng token xuất hiện như ChatGPT.

---

## 📖 Table of Contents

1. [Tổng quan về Streaming Chat](#1-tổng-quan-về-streaming-chat)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Backend Implementation (NestJS)](#3-backend-implementation-nestjs)
4. [Frontend Implementation](#4-frontend-implementation)
5. [Error Handling & Resilience](#5-error-handling--resilience)
6. [Testing](#6-testing)
7. [Troubleshooting](#7-troubleshooting)
8. [Best Practices](#8-best-practices)

---

## 1. Tổng quan về Streaming Chat

### 1.1. Streaming là gì?

**Traditional (Non-streaming):**

```
User gửi câu hỏi → Server xử lý 30-60s → Trả về toàn bộ response
❌ User phải đợi rất lâu, không biết server có đang hoạt động không
```

**Streaming:**

```
User gửi câu hỏi → Server trả citations ngay → Stream từng token liên tục
✅ User thấy response xuất hiện từng chữ một như ChatGPT
```

### 1.2. Tại sao cần Streaming?

| Khía cạnh | Non-streaming | Streaming |
|-----------|--------------|-----------|
| **UX** | Đợi lâu, boring, không biết progress | Thấy response ngay, engaging |
| **Perceived Performance** | Cảm giác chậm | Cảm giác nhanh dù tổng thời gian tương tự |
| **Error Feedback** | Chỉ biết lỗi sau 30-60s | Biết lỗi ngay khi xảy ra |
| **Citations** | Phải đợi hết mới thấy | Thấy ngay từ đầu |

### 1.3. Công nghệ sử dụng

- **Server-Sent Events (SSE)**: Giao thức HTTP một chiều (server → client)
- **Content-Type**: `text/event-stream`
- **Format**: `data: <JSON>\n\n` (mỗi message kết thúc bằng 2 newlines)
- **Alternative**: WebSocket (hai chiều, phức tạp hơn, dùng khi cần real-time bidirectional)

---

## 2. Kiến trúc hệ thống

### 2.1. Data Flow

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. POST /chat/global/stream
       │    {message, projectId}
       ▼
┌─────────────────────────────────────────┐
│         NestJS Controller               │
│  @Post('/global/stream')                │
│  chatGlobalStream(@Res() res, ...)     │
└──────┬──────────────────────────────────┘
       │ 2. Call Service
       ▼
┌─────────────────────────────────────────┐
│         Chat Service                     │
│  • Retrieve relevant documents (RAG)    │
│  • Rerank với Cross-Encoder             │
│  • Create LLM prompt with context       │
│  • Return {stream, citations, callback} │
└──────┬──────────────────────────────────┘
       │ 3. Return streaming object
       ▼
┌─────────────────────────────────────────┐
│         Controller Response             │
│  • Set SSE headers                      │
│  • Send citations immediately           │
│  • Stream LLM tokens one-by-one         │
│  • Save to DB after streaming complete  │
│  • Send 'done' event                    │
└──────┬──────────────────────────────────┘
       │ 4. SSE Stream
       ▼
┌─────────────┐
│   Client    │
│  EventSource│
│  • onmessage│
│  • Parse    │
│  • Render   │
└─────────────┘
```

### 2.2. Response Format

Có 4 loại events được stream về client:

```typescript
// 1. CITATIONS - Gửi đầu tiên
data: {"type":"citations","data":[{fileId, fileName, score, content}]}\n\n

// 2. TOKEN - Stream liên tục (nhiều lần)
data: {"type":"token","data":"Entropy"}\n\n
data: {"type":"token","data":" là"}\n\n
data: {"type":"token","data":" một"}\n\n

// 3. DONE - Kết thúc thành công
data: {"type":"done","chatId":"uuid-xxx"}\n\n

// 4. WARNING - Lưu DB thất bại nhưng stream thành công
data: {"type":"warning","message":"Response generated but not saved","answer":"full text"}\n\n

// 5. ERROR - Lỗi trong quá trình streaming
data: {"type":"error","message":"Connection timeout"}\n\n
```

---

## 3. Backend Implementation (NestJS)

### 3.1. Service Layer - Return Streaming Object

**File:** `src/chat/chat.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { OpenaiService } from '../llm/openai/openai.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
    private readonly openaiService: OpenaiService,
  ) {}

  // Define return type cho streaming
  type BaseMessage = 
    | { answer: string } // No documents found
    | { 
        answer: AsyncIterableIterator<any>; // LLM stream
        citations: CitationType[]; 
        saveCallback: (fullAnswer: string) => Promise<any>;
      };

  async chatGlobal(chatDto: ChatDto): Promise<BaseMessage> {
    // 1. RAG: Retrieve và rerank documents
    const scoredDocs = await this.retrievalService.retrieveAndRerank(
      chatDto.message,
      chatDto.projectId,
      { topK: 50, finalTopK: 10 }
    );

    if (scoredDocs.length === 0) {
      return { answer: 'Không tìm thấy tài liệu liên quan.' };
    }

    // 2. Build context từ scored documents
    const context = this.buildContextFromDocs(scoredDocs);

    // 3. Build citations trả về ngay
    const citations = scoredDocs.map(doc => ({
      fileId: doc.metadata.fileId,
      fileName: doc.metadata.originalFileName,
      score: doc.finalScore,
      content: doc.pageContent.substring(0, 200), // Preview
    }));

    // 4. Create chat record trong DB (empty messages)
    const chatId = chatDto.chatId || crypto.randomUUID();
    const historyMessages = chatDto.chatId 
      ? await this.prisma.chats.findUnique({ where: { id: chatDto.chatId } })
      : await this.prisma.chats.create({
          data: {
            id: chatId,
            userId: chatDto.userId,
            projectId: chatDto.projectId,
            title: chatDto.message.substring(0, 50),
            messages: [],
          },
        });

    // 5. Build messages cho LLM
    const messages = [
      {
        role: 'system',
        content: `Bạn là trợ lý AI. Dựa vào context sau để trả lời:\n\n${context}`,
      },
      ...(historyMessages?.messages || []), // Chat history
      { role: 'user', content: chatDto.message },
    ];

    // 6. Stream LLM response
    const stream = await this.openaiService.getChatModel().stream(messages);

    // 7. Return streaming object
    return {
      answer: stream, // AsyncIterableIterator
      citations: citations, // Available immediately
      saveCallback: async (fullAnswer: string) => {
        // Save to DB after streaming completes - WITH RETRY LOGIC
        const updatedMessages = [
          ...(historyMessages?.messages || []),
          { role: 'user', content: chatDto.message },
          { role: 'assistant', content: fullAnswer, citation: citations },
        ];

        // Retry logic for connection drops
        let retries = 3;
        let lastError: any;
        
        while (retries > 0) {
          try {
            // Health check before save
            await this.prisma.$queryRaw`SELECT 1`;
            
            const chat = await this.prisma.chats.update({
              where: { id: chatId },
              data: { messages: updatedMessages },
            });

            return chat;
          } catch (error) {
            lastError = error;
            retries--;
            
            console.error(`❌ Database save failed (${3 - retries}/3):`, error.message);
            
            if (retries > 0) {
              // Exponential backoff: 1s, 2s, 3s
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
              
              // Try reconnect
              try {
                await this.prisma.$connect();
                console.log('🔄 Reconnected, retrying...');
              } catch (reconnectError) {
                console.error('❌ Reconnection failed:', reconnectError.message);
              }
            }
          }
        }
        
        // All retries failed
        throw lastError;
      },
    };
  }

  private buildContextFromDocs(scoredDocs: any[]): string {
    // Group chunks by file for better context
    const fileGroups = new Map();
    
    scoredDocs.forEach(doc => {
      const fileId = doc.metadata.fileId;
      if (!fileGroups.has(fileId)) {
        fileGroups.set(fileId, {
          fileName: doc.metadata.originalFileName,
          chunks: [],
        });
      }
      fileGroups.get(fileId).chunks.push({
        content: doc.pageContent,
        index: doc.metadata.chunkIndex,
      });
    });

    // Build context string
    const contextParts = [];
    for (const [fileId, group] of fileGroups) {
      // Sort chunks by index for coherent reading
      group.chunks.sort((a, b) => a.index - b.index);
      
      let fileContext = `--- ${group.fileName} ---\n`;
      fileContext += group.chunks.map(c => c.content).join('\n\n');
      contextParts.push(fileContext);
    }

    return contextParts.join('\n\n');
  }
}
```

### 3.2. Controller Layer - Stream to Client

**File:** `src/chat/chat.controller.ts`

```typescript
import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import type { Response } from 'express'; // Use 'type' import for decorator compatibility
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ==================== STREAMING ENDPOINT ====================
  @Post('/global/stream')
  async chatGlobalStream(
    @Res() res: Response, // Manual response control
    @Req() req: { user: JwtPayloadWithRt },
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;

    // Get streaming object from service
    const result = await this.chatService.chatGlobal(chatDto);

    // Handle non-streaming case (no documents found)
    if ('answer' in result && typeof result.answer === 'string') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ type: 'error', message: result.answer })}\n\n`);
      res.end();
      return;
    }

    // Streaming case
    const { answer: stream, citations, saveCallback } = result;

    // ===== SET SSE HEADERS =====
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // ===== 1. SEND CITATIONS FIRST =====
    res.write(`data: ${JSON.stringify({ type: 'citations', data: citations })}\n\n`);

    // ===== 2. STREAM LLM TOKENS =====
    let fullAnswer = '';
    try {
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          fullAnswer += content;
          res.write(`data: ${JSON.stringify({ type: 'token', data: content })}\n\n`);
        }
      }

      // ===== 3. SAVE TO DATABASE =====
      try {
        const savedChat = await saveCallback(fullAnswer);
        res.write(`data: ${JSON.stringify({ type: 'done', chatId: savedChat.id })}\n\n`);
      } catch (dbError) {
        // Connection dropped - graceful degradation
        console.error('❌ Database save failed:', dbError.message);
        res.write(`data: ${JSON.stringify({ 
          type: 'warning', 
          message: 'Response generated but not saved due to connection issue',
          answer: fullAnswer 
        })}\n\n`);
      }
    } catch (error) {
      // Streaming error
      console.error('❌ Streaming error:', error.message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  // ==================== NON-STREAMING ENDPOINT (FALLBACK) ====================
  @Post('/global')
  async chatGlobal(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    
    const result = await this.chatService.chatGlobal(chatDto);
    
    // Consume stream and return full response
    if ('answer' in result && typeof result.answer !== 'string') {
      let fullAnswer = '';
      for await (const chunk of result.answer) {
        fullAnswer += chunk.content;
      }
      await result.saveCallback(fullAnswer);
      return { answer: fullAnswer, citations: result.citations };
    }
    
    return result;
  }
}
```

### 3.3. Global Error Handlers

**File:** `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ===== GLOBAL ERROR HANDLERS =====
  // Prevent server crash from unhandled DB connection drops
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
  });

  app.enableCors();
  await app.listen(8080);
}
bootstrap();
```

### 3.4. OpenAI Service Configuration

**File:** `src/llm/openai/openai.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class OpenaiService {
  private chatModel: ChatOpenAI;

  constructor() {
    this.chatModel = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      streaming: true, // IMPORTANT: Enable streaming
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  getChatModel() {
    return this.chatModel;
  }
}
```

---

## 4. Frontend Implementation

### 4.1. React Example with EventSource

```typescript
import React, { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface Citation {
  fileId: string;
  fileName: string;
  score: number;
  content: string;
}

export function ChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Initialize assistant message
    let assistantMessage: Message = { role: 'assistant', content: '', citations: [] };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Create EventSource for SSE
      const eventSource = new EventSource(
        'http://localhost:8080/api/v1/chat/global/stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            message: input,
            projectId: 'your-project-id',
          }),
        }
      );

      // Note: EventSource doesn't support custom headers/body in standard API
      // Use fetch with ReadableStream instead (see 4.2)

    } catch (error) {
      console.error('Stream error:', error);
      setIsStreaming(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.citations && msg.citations.length > 0 && (
              <div className="citations">
                <h4>📚 Nguồn tham khảo:</h4>
                {msg.citations.map((cite, i) => (
                  <div key={i} className="citation">
                    <strong>{cite.fileName}</strong> (Score: {(cite.score * 100).toFixed(0)}%)
                    <p>{cite.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isStreaming}
          placeholder="Nhập câu hỏi..."
        />
        <button onClick={sendMessage} disabled={isStreaming}>
          {isStreaming ? 'Đang xử lý...' : 'Gửi'}
        </button>
      </div>
    </div>
  );
}
```

### 4.2. React with Fetch + ReadableStream (Recommended)

**EventSource không hỗ trợ POST + custom headers**, nên dùng `fetch` với `ReadableStream`:

```typescript
import React, { useState } from 'react';

export function ChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Initialize assistant message
    let assistantContent = '';
    let citations: Citation[] = [];
    
    setMessages(prev => [...prev, { role: 'assistant', content: '', citations: [] }]);

    try {
      const response = await fetch('http://localhost:8080/api/v1/chat/global/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: input,
          projectId: 'your-project-id',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE format: data: {...}\n\n
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6); // Remove "data: "
            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case 'citations':
                  citations = event.data;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].citations = citations;
                    return updated;
                  });
                  break;

                case 'token':
                  assistantContent += event.data;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = assistantContent;
                    return updated;
                  });
                  break;

                case 'done':
                  console.log('✅ Chat saved with ID:', event.chatId);
                  setIsStreaming(false);
                  break;

                case 'warning':
                  console.warn('⚠️', event.message);
                  assistantContent = event.answer; // Use full answer from warning
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = assistantContent;
                    return updated;
                  });
                  setIsStreaming(false);
                  break;

                case 'error':
                  console.error('❌', event.message);
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = `Lỗi: ${event.message}`;
                    return updated;
                  });
                  setIsStreaming(false);
                  break;
              }
            } catch (parseError) {
              console.error('Parse error:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      setIsStreaming(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.citations && msg.citations.length > 0 && (
              <div className="citations">
                <h4>📚 Nguồn:</h4>
                {msg.citations.map((cite, i) => (
                  <div key={i}>
                    <strong>{cite.fileName}</strong> ({(cite.score * 100).toFixed(0)}%)
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        disabled={isStreaming}
      />
      <button onClick={sendMessage} disabled={isStreaming}>
        {isStreaming ? '⏳' : 'Gửi'}
      </button>
    </div>
  );
}
```

### 4.3. Vue.js Example

```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="(msg, idx) in messages" :key="idx" :class="`message ${msg.role}`">
        <div class="content">{{ msg.content }}</div>
        <div v-if="msg.citations?.length" class="citations">
          <h4>📚 Nguồn:</h4>
          <div v-for="(cite, i) in msg.citations" :key="i">
            <strong>{{ cite.fileName }}</strong> ({{ (cite.score * 100).toFixed(0) }}%)
          </div>
        </div>
      </div>
    </div>

    <input
      v-model="input"
      @keyup.enter="sendMessage"
      :disabled="isStreaming"
      placeholder="Nhập câu hỏi..."
    />
    <button @click="sendMessage" :disabled="isStreaming">
      {{ isStreaming ? '⏳' : 'Gửi' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const messages = ref([]);
const input = ref('');
const isStreaming = ref(false);

async function sendMessage() {
  if (!input.value.trim()) return;

  messages.value.push({ role: 'user', content: input.value });
  const userInput = input.value;
  input.value = '';
  isStreaming.value = true;

  let assistantContent = '';
  let citations = [];
  messages.value.push({ role: 'assistant', content: '', citations: [] });

  try {
    const response = await fetch('http://localhost:8080/api/v1/chat/global/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        message: userInput,
        projectId: 'your-project-id',
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.substring(6));

          switch (event.type) {
            case 'citations':
              citations = event.data;
              messages.value[messages.value.length - 1].citations = citations;
              break;
            case 'token':
              assistantContent += event.data;
              messages.value[messages.value.length - 1].content = assistantContent;
              break;
            case 'done':
              isStreaming.value = false;
              break;
            case 'error':
              console.error(event.message);
              isStreaming.value = false;
              break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream error:', error);
    isStreaming.value = false;
  }
}
</script>
```

---

## 5. Error Handling & Resilience

### 5.1. Connection Drop Scenarios

| Scenario | Backend Handling | Frontend Handling |
|----------|-----------------|-------------------|
| **DB connection drops during streaming** | Retry 3 times, send `warning` event | Display response, show warning toast |
| **LLM streaming fails** | Catch error, send `error` event | Show error message, allow retry |
| **Network timeout** | N/A (client-side) | Reconnect, show loading spinner |
| **Invalid token** | Return 401 before streaming | Redirect to login |

### 5.2. Backend Retry Logic

```typescript
// Already implemented in saveCallback
let retries = 3;
while (retries > 0) {
  try {
    await this.prisma.$queryRaw`SELECT 1`; // Health check
    return await this.prisma.chats.update({...});
  } catch (error) {
    retries--;
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      await this.prisma.$connect(); // Reconnect
    }
  }
}
```

### 5.3. Frontend Reconnection

```typescript
const MAX_RETRIES = 3;
let retryCount = 0;

async function sendMessageWithRetry() {
  try {
    await sendMessage();
    retryCount = 0; // Reset on success
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(() => sendMessageWithRetry(), 2000 * retryCount);
    } else {
      alert('Không thể kết nối đến server. Vui lòng thử lại sau.');
    }
  }
}
```

---

## 6. Testing

### 6.1. Backend Testing with cURL

```bash
# Test streaming endpoint
curl -N -X POST http://localhost:8080/api/v1/chat/global/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "What is entropy?",
    "projectId": "uuid-xxx"
  }'

# Expected output:
# data: {"type":"citations","data":[...]}
#
# data: {"type":"token","data":"Entropy"}
#
# data: {"type":"token","data":" is"}
#
# data: {"type":"token","data":" a"}
# ...
# data: {"type":"done","chatId":"uuid"}
```

### 6.2. Postman Testing

1. Create POST request to `http://localhost:8080/api/v1/chat/global/stream`
2. Add headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <token>`
3. Add body:

   ```json
   {
     "message": "What is entropy?",
     "projectId": "uuid-xxx"
   }
   ```

4. **Important**: Disable "Automatically follow redirects" in Settings
5. Send request → See streaming response in real-time

### 6.3. Browser Testing (DevTools)

```javascript
// Open browser console
const token = 'your-jwt-token';
const response = await fetch('http://localhost:8080/api/v1/chat/global/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: 'What is entropy?',
    projectId: 'uuid-xxx',
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

---

## 7. Troubleshooting

### 7.1. Common Issues

#### ❌ "Connection terminated unexpectedly" error

**Cause:** Database connection drops during streaming (common with NeonDB auto-suspend)

**Solutions:**

1. ✅ Already implemented: Retry logic with reconnection
2. Check `.env` keepalive settings:

   ```env
   DB_KEEPALIVE=true
   DB_KEEPALIVE_DELAY=10000
   DB_POOL_IDLE_TIMEOUT=30000
   ```

3. Use NeonDB Pooler endpoint (not direct connection)
4. Consider switching to Supabase/Railway for better connection stability

#### ❌ "Stream not working in Postman"

**Cause:** Response is JSON-wrapped by global interceptor

**Solution:** Use `@Res()` decorator to bypass interceptor (already implemented)

#### ❌ "EventSource error: CORS"

**Cause:** CORS not configured for streaming

**Solution:** Enable CORS in `main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
```

#### ❌ "Tokens not appearing one by one"

**Cause:** Nginx/proxy buffering

**Solution:** Add header in controller:

```typescript
res.setHeader('X-Accel-Buffering', 'no');
```

#### ❌ "Frontend not receiving events"

**Cause:** Incorrect SSE format parsing

**Solution:** Check format is `data: <JSON>\n\n` (exactly 2 newlines)

### 7.2. Debugging Tips

```typescript
// Add debug logging in controller
console.log('📤 Sending event:', { type: 'token', data: content });
res.write(`data: ${JSON.stringify({ type: 'token', data: content })}\n\n`);

// Add debug logging in frontend
reader.read().then(({ value }) => {
  const text = decoder.decode(value);
  console.log('📥 Received chunk:', text);
});
```

---

## 8. Best Practices

### 8.1. Performance Optimization

1. **Send citations first** - User thấy nguồn ngay, tăng trust
2. **Stream tokens immediately** - Không buffer, gửi ngay khi có
3. **Save DB sau streaming** - Không block stream bởi DB write
4. **Use connection pooling** - Giảm overhead tạo connection mới
5. **Compress responses** - Dùng gzip cho production

### 8.2. Security

1. **Always validate JWT** - Dùng `@UseGuards(JwtAuthGuard)`
2. **Rate limiting** - Giới hạn số request/phút để tránh abuse
3. **Timeout protection** - Set timeout cho LLM stream (60s)
4. **Input sanitization** - Validate `message` length, SQL injection

```typescript
@UseGuards(JwtAuthGuard, ThrottlerGuard) // Rate limiting
@Post('/global/stream')
async chatGlobalStream(...) {
  // Validate input
  if (chatDto.message.length > 2000) {
    throw new BadRequestException('Message too long');
  }
  
  // Set timeout
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Stream timeout')), 60000)
  );
  
  const streamPromise = this.chatService.chatGlobal(chatDto);
  
  const result = await Promise.race([streamPromise, timeoutPromise]);
  // ...
}
```

### 8.3. Monitoring

```typescript
// Add metrics tracking
let streamStartTime = Date.now();
let tokenCount = 0;

for await (const chunk of stream) {
  tokenCount++;
  res.write(`data: ${JSON.stringify({ type: 'token', data: chunk.content })}\n\n`);
}

const duration = Date.now() - streamStartTime;
console.log(`📊 Stream completed: ${tokenCount} tokens in ${duration}ms`);

// Send to monitoring service (DataDog, NewRelic, etc.)
metricsService.recordStreamDuration(duration);
metricsService.recordTokenCount(tokenCount);
```

### 8.4. User Experience

1. **Show loading spinner** khi chờ citations
2. **Animate token appearance** (typewriter effect)
3. **Scroll to bottom** khi có token mới
4. **Disable input** khi đang streaming
5. **Allow stop streaming** (cancel button)

```typescript
// Cancel streaming
const abortController = new AbortController();

const response = await fetch(url, {
  method: 'POST',
  signal: abortController.signal, // Pass abort signal
  ...
});

// On cancel button click
abortController.abort();
```

---

## 9. Deployment Considerations

### 9.1. Environment Variables

```env
# Production settings
NODE_ENV=production

# Database - Use pooler for better connection stability
DATABASE_URL=postgresql://user:pass@pooler.neon.tech:5432/db?sslmode=require

# Connection pool
DB_POOL_MAX=25
DB_POOL_MIN=5
DB_KEEPALIVE=true
DB_POOL_IDLE_TIMEOUT=60000

# OpenAI
OPENAI_API_KEY=sk-xxx
```

### 9.2. Nginx Configuration

```nginx
# Enable SSE support
location /api/v1/chat/global/stream {
    proxy_pass http://backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 300s; # Increase timeout for long streams
    chunked_transfer_encoding on;
}
```

### 9.3. Docker Considerations

```dockerfile
# Dockerfile
FROM node:20-alpine

# Increase memory limit for large streams
ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 8080
CMD ["node", "dist/main.js"]
```

---

## 10. Summary Checklist

### Backend ✅

- [ ] Service returns `{ answer: AsyncIterableIterator, citations, saveCallback }`
- [ ] Controller uses `@Res()` for manual response control
- [ ] SSE headers set correctly: `text/event-stream`, `no-cache`, `keep-alive`
- [ ] Citations sent first, then stream tokens, then save DB
- [ ] Error handling with try-catch and retry logic
- [ ] Global error handlers in `main.ts`
- [ ] LLM configured with `streaming: true`

### Frontend ✅

- [ ] Use `fetch` with `ReadableStream` (not EventSource for POST)
- [ ] Parse SSE format: `data: <JSON>\n\n`
- [ ] Handle all event types: `citations`, `token`, `done`, `warning`, `error`
- [ ] Update UI incrementally on each token
- [ ] Show loading state during streaming
- [ ] Allow cancel streaming with AbortController

### Testing ✅

- [ ] Test with cURL
- [ ] Test with Postman
- [ ] Test in browser DevTools
- [ ] Test error scenarios (connection drop, timeout)
- [ ] Test with different message lengths

### Production ✅

- [ ] Configure Nginx for SSE
- [ ] Set up monitoring/metrics
- [ ] Add rate limiting
- [ ] Use database pooler
- [ ] Set appropriate timeouts

---

## 📚 Additional Resources

- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [LangChain Streaming Guide](https://js.langchain.com/docs/expression_language/streaming)
- [NestJS Response Handling](https://docs.nestjs.com/controllers#library-specific-approach)
- [OpenAI Streaming API](https://platform.openai.com/docs/api-reference/streaming)

---

**🎉 Happy Streaming!**

Nếu có câu hỏi hoặc gặp vấn đề, tham khảo phần [Troubleshooting](#7-troubleshooting) hoặc check logs trong console.
