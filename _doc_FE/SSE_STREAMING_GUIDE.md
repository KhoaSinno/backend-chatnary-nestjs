# SSE Streaming Chat - Implementation Guide

## Overview

This document describes the Server-Sent Events (SSE) streaming implementation for real-time chat responses in the Chatnary backend. SSE allows the server to push AI-generated responses token-by-token to the client, creating a ChatGPT-like streaming experience.

## 🎯 What is SSE Streaming?

Server-Sent Events (SSE) is a standard that allows a server to push real-time updates to the client over a single HTTP connection. Unlike WebSockets (which are bidirectional), SSE is a one-way communication channel from server to client, perfect for streaming AI responses.

### Why SSE for Chat?

- ✅ **Better UX**: Users see responses appear in real-time instead of waiting for the entire response
- ✅ **Standard HTTP**: Uses regular HTTP/HTTPS, works through firewalls and proxies
- ✅ **Built-in Reconnection**: Browsers automatically reconnect if the connection drops
- ✅ **Simple Protocol**: Easier to implement than WebSockets for one-way streaming
- ✅ **Perfect for AI**: Ideal for streaming LLM token-by-token responses

## 📍 SSE Endpoint Details

### Endpoint Information

```
Method: GET
URL: /api/v1/chat/stream
Auth: Bearer token in Authorization header
Content-Type: text/event-stream
```

### Query Parameters

| Parameter   | Type   | Required    | Description                                       |
| ----------- | ------ | ----------- | ------------------------------------------------- |
| `message`   | string | ✅ Yes      | The user's question/prompt                        |
| `projectId` | string | ❌ Optional | Project context for RAG retrieval                 |
| `chatId`    | string | ❌ Optional | Existing chat session ID for conversation history |

### Headers Required

```http
Authorization: Bearer <accessToken>
Accept: text/event-stream
```

## 🔄 Event Flow

The SSE stream sends events in the following sequence:

```
1. CITATIONS Event
   ↓
2. TOKEN Events (multiple, streamed)
   ↓
3. DONE Event
```

### Event Types

#### 1. **CITATIONS Event**

Sent **first** with all relevant document citations and the chat ID.

```json
{
  "data": {
    "type": "CITATIONS",
    "content": [
      {
        "index": 0,
        "snippet": "Preview text (first 150 chars)...",
        "text": "Full chunk content from document",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 1,
        "score": 0.96973956,
        "startOffset": 0,
        "endOffset": 1250,
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b"
      }
      // ... more citations
    ],
    "chatId": "53852a0e-6bb8-49c0-b17d-e5accb980355"
  }
}
```

**Purpose**: Provides document references that will be used to answer the question. Frontend can display these as citations.

#### 2. **TOKEN Events**

Sent **multiple times** as the AI generates the response word-by-word.

```json
{
  "data": {
    "type": "TOKEN",
    "content": "word "
  }
}
```

**Purpose**: Stream the AI response in real-time. Concatenate all token contents to build the full answer.

#### 3. **DONE Event**

Sent **once** when streaming is complete.

```json
{
  "data": {
    "type": "DONE"
  }
}
```

**Purpose**: Signals that the stream has finished and the connection can be closed.

#### 4. **ERROR Event** (Only on Errors)

Sent if an error occurs during processing.

```json
{
  "data": {
    "type": "ERROR",
    "content": "Error message description"
  }
}
```

**Purpose**: Notify the client of errors (e.g., no documents found, LLM failure, etc.).

## 🏗️ Implementation Architecture

### Backend Flow

```
User Request (SSE)
    ↓
[Controller] chat.controller.ts
    ↓ Extract query params (message, projectId, chatId)
    ↓
[Service] chat.service.ts - chatStream()
    ↓
prepareRagContext()
    ├─ Load chat history
    ├─ Rewrite question to standalone
    ├─ Retrieve & rerank documents
    ├─ Build context from file groups
    └─ Prepare citations
    ↓
[Observable Stream]
    ├─ Emit CITATIONS event
    ├─ Stream LLM response
    │   └─ Emit TOKEN events (real-time)
    ├─ Save to database
    └─ Emit DONE event
```

### Key Components

#### 1. **Controller** (`chat.controller.ts`)

```typescript
@Sse('/stream')
chatStream(
  @Req() req: { user: JwtPayloadWithRt },
  @Query('message') message: string,
  @Query('projectId') projectId?: string,
  @Query('chatId') chatId?: string,
) {
  const chatDto: ChatDto = {
    message,
    projectId,
    chatId,
    userId: req.user.userId,
  };
  return this.chatService.chatStream(chatDto);
}
```

**Key Point**: SSE uses GET requests, so parameters come from `@Query()` not `@Body()`.

#### 2. **Service** (`chat.service.ts`)

```typescript
chatStream(chatDto: ChatDto): Observable<SSEMessage> {
  const subject = new Subject<SSEMessage>();

  (async () => {
    try {
      // 1. Prepare RAG context (docs, citations, messages)
      const { chatId, messages, citations } = await this.prepareRagContext(chatDto);

      // 2. Send citations first
      subject.next({
        data: { type: 'CITATIONS', content: citations, chatId }
      });

      // 3. Stream LLM response
      const stream = await this.openaiService.getChatModel().stream(messages);
      let fullAnswer = '';

      for await (const chunk of stream) {
        const token = chunk.content as string;
        if (token) {
          fullAnswer += token;
          subject.next({ data: { type: 'TOKEN', content: token } });
        }
      }

      // 4. Save to database
      await this.saveChatToDb(chatId, chatDto.message, fullAnswer, citations);

      // 5. Signal completion
      subject.next({ data: { type: 'DONE' } });
      subject.complete();
    } catch (error) {
      subject.next({ data: { type: 'ERROR', content: 'Error message' } });
      subject.complete();
    }
  })();

  return subject.asObservable();
}
```

#### 3. **Custom Type** (`SSEMessage`)

```typescript
type SSEMessage = {
  data: {
    type: 'TOKEN' | 'CITATIONS' | 'CHAT_ID' | 'ERROR' | 'DONE';
    content?: string | CitationType[];
    chatId?: string;
  };
};
```

**Why Custom Type?** The browser's `MessageEvent` type is for DOM events and has 27+ required properties. Our custom type matches exactly what we're sending.

## 🔧 Technical Fixes Applied

### Problem 1: MessageEvent Type Mismatch

**Error:**

```
Type '{ data: { type: string; content: string; }; }' is not assignable to parameter of type 'MessageEvent<any>'.
Type is missing properties: lastEventId, origin, ports, source, and 23 more.
```

**Solution:** Created custom `SSEMessage` type instead of using browser's `MessageEvent`.

### Problem 2: Async Observable Conflict

**Error:**

```
The return type of an async function must be the global Promise<T> type.
```

**Solution:** Removed `async` keyword since the method returns `Observable`, not `Promise`.

### Problem 3: Body on GET Request

**Error:**

```
Cannot set properties of undefined (setting 'userId')
```

**Solution:** Changed from `@Body()` to `@Query()` since SSE uses GET requests which don't support request bodies.

### Problem 4: Private Method Access

**Error:**

```
Property 'chatStream' is private and only accessible within class 'ChatService'.
```

**Solution:** Made `chatStream()` method public so the controller can access it.

## 📊 Test Results

### Test 1: Vietnamese Question

**Question:** "Những ưu điểm của hệ sinh dùng cho trí tuệ nhân tạo là gì"

**Results:**

- ✅ Status: Success
- 📦 Total Downloaded: 56,796 bytes
- ⏱️ Response: Streamed in real-time
- 📄 Events: CITATIONS → 275+ TOKEN events → DONE

### Test 2: Tuition Fee Question

**Question:** "Đối tượng nào được miễn giảm học phí năm 2025 2026"

**Results:**

- ✅ Status: Success
- 📦 Total Downloaded: 23,359 bytes
- ⏱️ Response: Streamed in real-time
- 📄 Events: CITATIONS → TOKEN events → DONE

## 💻 Frontend Implementation

### JavaScript/TypeScript Example

```javascript
const accessToken = 'eyJhbGci...'; // Your JWT token
const question = 'Những ưu điểm của hệ sinh dùng cho trí tuệ nhân tạo là gì';

const eventSource = new EventSource(
  `http://localhost:8080/api/v1/chat/stream?message=${encodeURIComponent(question)}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

let fullAnswer = '';
let citations = [];
let chatId = null;

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  switch (data.data.type) {
    case 'CITATIONS':
      citations = data.data.content;
      chatId = data.data.chatId;
      console.log('Received citations:', citations.length);
      break;

    case 'TOKEN':
      fullAnswer += data.data.content;
      // Update UI with streaming text
      updateChatUI(fullAnswer);
      break;

    case 'DONE':
      console.log('Stream completed');
      eventSource.close();
      // Finalize UI, save chatId for next message
      break;

    case 'ERROR':
      console.error('Error:', data.data.content);
      eventSource.close();
      showError(data.data.content);
      break;
  }
});

eventSource.addEventListener('error', (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
});
```

### React Example

```typescript
import { useEffect, useState } from 'react';

function useSSEChat(message: string, accessToken: string) {
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;

    setIsStreaming(true);
    setAnswer('');
    setError(null);

    const eventSource = new EventSource(
      `http://localhost:8080/api/v1/chat/stream?message=${encodeURIComponent(message)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);

      switch (data.data.type) {
        case 'CITATIONS':
          setCitations(data.data.content);
          setChatId(data.data.chatId);
          break;

        case 'TOKEN':
          setAnswer((prev) => prev + data.data.content);
          break;

        case 'DONE':
          setIsStreaming(false);
          eventSource.close();
          break;

        case 'ERROR':
          setError(data.data.content);
          setIsStreaming(false);
          eventSource.close();
          break;
      }
    });

    eventSource.addEventListener('error', () => {
      setError('Connection error');
      setIsStreaming(false);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [message, accessToken]);

  return { answer, citations, chatId, isStreaming, error };
}
```

## 🧪 Testing with cURL

### Basic Test

```bash
curl -N -X GET "http://localhost:8080/api/v1/chat/stream?message=Your%20question" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Accept: text/event-stream"
```

### With Project Context

```bash
curl -N -X GET "http://localhost:8080/api/v1/chat/stream?message=test&projectId=project-uuid" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Accept: text/event-stream"
```

### With Existing Chat Session

```bash
curl -N -X GET "http://localhost:8080/api/v1/chat/stream?message=follow-up&chatId=chat-uuid" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Accept: text/event-stream"
```

## 🎨 Frontend UI Recommendations

### Display Strategy

1. **Citations Section**: Show citations as cards/badges before the answer starts
2. **Streaming Text**: Use a typewriter effect or smooth append to show tokens
3. **Loading State**: Show a "thinking..." indicator while waiting for first token
4. **Error Handling**: Display user-friendly error messages
5. **Connection Status**: Indicate when connection is active/closed

### UX Best Practices

- ✅ Disable send button while streaming
- ✅ Show typing indicator when waiting for response
- ✅ Auto-scroll to bottom as new tokens arrive
- ✅ Allow canceling the stream (close EventSource)
- ✅ Save chatId for conversation continuation
- ✅ Display citations with clickable links to documents

## 🔒 Security Considerations

1. **Authentication**: Every request must include a valid JWT Bearer token
2. **Authorization**: The backend validates userId from the token
3. **Input Validation**: Message and IDs are validated server-side
4. **Rate Limiting**: Consider implementing rate limits on SSE connections
5. **Timeout**: SSE connections should timeout if idle too long

## 📝 Database Schema

Chat messages are saved to the database after streaming completes:

```sql
-- User message
INSERT INTO ChatMessage (chatId, role, content)
VALUES ('chat-uuid', 'user', 'User question');

-- Assistant message with citations
INSERT INTO ChatMessage (chatId, role, content, metadata)
VALUES (
  'chat-uuid',
  'assistant',
  'Full AI answer',
  '{"citations": [...]}'  -- JSON array of citations
);
```

## 🐛 Troubleshooting

### Issue: "Cannot set properties of undefined"

**Cause:** SSE connection not passing authentication properly

**Solution:** Ensure Bearer token is in the Authorization header

### Issue: Connection drops immediately

**Cause:** CORS or authentication failure

**Solution:** Check CORS settings and token validity

### Issue: No events received

**Cause:** Missing `Accept: text/event-stream` header

**Solution:** Add the header to the request

### Issue: Frontend can't parse events

**Cause:** JSON parsing error

**Solution:** Ensure you're parsing `event.data` as JSON

## 📚 Related Files

- **Controller**: `src/chat/chat.controller.ts` - Endpoint definition
- **Service**: `src/chat/chat.service.ts` - Stream logic
- **Types**: Custom SSEMessage type definition
- **API Docs**: `API_ENDPOINTS.md` - Full endpoint documentation

## 🚀 Future Enhancements

- [ ] Add progress percentage events
- [ ] Support streaming for project-specific chats
- [ ] Add metadata events (thinking time, token count, etc.)
- [ ] Implement stream cancellation from server side
- [ ] Add connection keepalive/heartbeat events
- [ ] Support multiple simultaneous streams per user

---

**Last Updated:** 2026-01-15  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
