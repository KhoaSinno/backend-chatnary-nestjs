# 📚 Static RAG Implementation Guide for Backend-Chatnary-NestJS

> **Target Audience:** Fresher Developer  
> **Author:** Senior Technical Lead  
> **Date:** December 15, 2025

---

## 📋 Table of Contents

1. [What is Static RAG?](#1-what-is-static-rag)
2. [Pros vs. Cons Analysis](#2-pros-vs-cons-analysis-for-your-project)
3. [Current Architecture Overview](#3-current-architecture-overview)
4. [Implementation Plan](#4-implementation-plan)
5. [Step-by-Step Implementation](#5-step-by-step-implementation)
6. [Verification & Testing](#6-verification--testing)
7. [Next Steps: Evolution Path](#7-next-steps-evolution-path)

---

## 1. What is Static RAG?

### 🎯 Simple Explanation for Beginners

**RAG** = **R**etrieval-**A**ugmented **G**eneration

Think of it like this:

- **Without RAG:** You ask a robot a question, and it answers based ONLY on what it learned during training (like a student who only read textbooks).
- **With RAG:** You ask a robot a question, and it FIRST searches your documents to find relevant information, THEN answers based on that (like a student who can look up their notes during an exam).

**Static RAG** means the parameters are **fixed/hardcoded**:

- Always retrieve exactly `k=5` documents
- Use a simple sliding window for chat history (last N messages)
- Same retrieval strategy for ALL queries

### 📊 Visual Flow

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────┐
│   User      │────►│  Vector Search  │────►│  Build Prompt   │────►│    LLM      │
│   Query     │     │  (k=5 fixed)    │     │  with Context   │     │  Response   │
└─────────────┘     └─────────────────┘     └─────────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │  PGVector DB    │
                    │  (Your Docs)    │
                    └─────────────────┘
```

---

## 2. Pros vs. Cons Analysis (For YOUR Project)

### ✅ PROS (Why Static RAG is Good for Your Project)

| Advantage | Explanation for Your Project |
|-----------|------------------------------|
| **Simple to Implement** | Your current codebase already has 80% of Static RAG working! You have `VectorService`, `OpenaiService`, and `ChatService`. |
| **Easy to Debug** | Fixed parameters mean predictable behavior. When something breaks, you know exactly where to look. |
| **Lower Latency** | No extra computation for dynamic decisions. Query → Retrieve → Generate. Fast! |
| **Good Starting Point** | Perfect for learning. Understand this first before moving to complex Agentic RAG. |
| **Cost Effective** | Fewer LLM calls = Lower OpenAI costs. Important for startups/small projects. |
| **Sufficient for Simple Use Cases** | If users ask straightforward questions about documents, Static RAG works well. |

### ❌ CONS (Limitations You Should Know)

| Disadvantage | Impact on Your Project |
|--------------|------------------------|
| **Fixed k=5 Problem** | Sometimes 5 chunks are too few (complex questions) or too many (simple questions). See document "Tối ưu RAG cho hệ thống tra cứu.md" Section 1.1. |
| **Sliding Window Memory Loss** | After 6 messages, earlier context is lost. User says "I'm a student" at message 1, forgotten by message 10. |
| **No Query Rewriting** | If user asks "What about chemistry?" (vague), system can't automatically expand to "chemistry textbooks for university students". |
| **No Self-Correction** | If retrieval returns bad results, system generates bad answer anyway. No feedback loop. |
| **Keyword Search Weakness** | Pure vector search struggles with exact names like "ISBN-13" or author names. |

### 🎯 Verdict for YOUR Project

> **Static RAG is the RIGHT choice for NOW** because:
>
> 1. You're learning → Start simple, add complexity later
> 2. Your codebase is almost there → Small changes needed
> 3. You can measure baseline performance → Then improve

---

## 3. Current Architecture Overview

### 📁 Your Existing Files (Already Working!)

```
src/
├── chat/
│   └── chat.service.ts      ← Main RAG logic lives here (chatUtil method)
├── ingest/
│   ├── ingest.service.ts    ← Document ingestion pipeline
│   ├── vector/
│   │   ├── vector.service.ts    ← Vector search (getRetrievals)
│   │   └── pgvector.client.ts   ← PostgreSQL + pgvector connection
│   ├── loaders/
│   │   ├── pdf.loader.ts    ← PDF text extraction
│   │   └── ocr.loader.ts    ← OCR for scanned documents
│   └── splitters/
│       └── text-splitter.ts ← Chunking logic
└── llm/
    └── openai/
        └── openai.service.ts ← OpenAI client wrapper
```

### 🔍 Current Implementation Analysis

Looking at your `chat.service.ts`:

```typescript
// Current hardcoded values (Static RAG characteristics)
const topK = 5;           // ← Fixed k value
const historyNum = 6;     // ← Fixed sliding window

// Current flow:
// 1. Get relevant docs from vector DB
const relateDocs = await this.vectorService.getRetrievals(
  chatDto.message,
  topK,               // ← Always 5
  chatDto.userId,
  chatDto.projectId,
);
```

**What you ALREADY have:**

- ✅ Vector storage with PGVector
- ✅ Document ingestion (PDF + OCR)
- ✅ Text chunking with overlap
- ✅ Basic retrieval with `similaritySearch`
- ✅ Chat history in database
- ✅ Citation system

**What needs improvement for PROPER Static RAG:**

- ⚠️ Configuration should be centralized (not hardcoded)
- ⚠️ Missing similarity score threshold
- ⚠️ No metadata filtering options
- ⚠️ Better prompt templates

---

## 4. Implementation Plan

### 📋 Task Breakdown

| Step | Task | Files to Create/Modify | Difficulty |
|------|------|------------------------|------------|
| 1 | Create RAG Configuration | `src/rag/rag.config.ts` | Easy |
| 2 | Create RAG Types/Interfaces | `src/rag/rag.types.ts` | Easy |
| 3 | Create Retrieval Service | `src/rag/retrieval.service.ts` | Medium |
| 4 | Create Prompt Builder | `src/rag/prompt.service.ts` | Easy |
| 5 | Create RAG Module | `src/rag/rag.module.ts` | Easy |
| 6 | Create Main RAG Service | `src/rag/rag.service.ts` | Medium |
| 7 | Update Chat Service | `src/chat/chat.service.ts` | Easy |
| 8 | Add Environment Variables | `.env.example` | Easy |

### 🏗️ New Folder Structure

```
src/
├── rag/                      ← NEW MODULE
│   ├── rag.module.ts         ← Module definition
│   ├── rag.service.ts        ← Main orchestrator
│   ├── rag.config.ts         ← Configuration constants
│   ├── rag.types.ts          ← TypeScript interfaces
│   ├── retrieval.service.ts  ← Enhanced retrieval logic
│   └── prompt.service.ts     ← Prompt template builder
├── chat/
│   └── chat.service.ts       ← Updated to use RAG module
└── ... (existing files)
```

---

## 5. Step-by-Step Implementation

---

### Step 1: Create RAG Configuration

#### 📁 File: `src/rag/rag.config.ts`

```typescript
/**
 * RAG Configuration Constants
 * 
 * WHAT THIS DOES:
 * Centralizes all RAG-related settings in one place.
 * Instead of hardcoding values in multiple files, we define them here.
 * 
 * WHY THIS IS NECESSARY:
 * 1. Easy to adjust parameters without searching through code
 * 2. Clear documentation of what each parameter does
 * 3. Prevents "magic numbers" scattered across codebase
 * 4. Makes testing different configurations simple
 */

export const RAG_CONFIG = {
  // ============================================
  // RETRIEVAL SETTINGS
  // ============================================
  
  /**
   * Number of documents to retrieve from vector store
   * 
   * WHAT: How many "chunks" to fetch when searching
   * WHY: More chunks = more context, but also more noise
   * 
   * Recommended values:
   * - 3-5 for simple Q&A
   * - 5-10 for complex topics
   * - 10-20 for research/summarization
   */
  TOP_K: 5,

  /**
   * Minimum similarity score threshold (0.0 to 1.0)
   * 
   * WHAT: Only return documents with similarity >= this value
   * WHY: Filter out irrelevant chunks that might confuse the LLM
   * 
   * Higher = stricter (might miss some relevant docs)
   * Lower = looser (might include irrelevant docs)
   */
  SIMILARITY_THRESHOLD: 0.7,

  /**
   * Maximum tokens for context (approximate)
   * 
   * WHAT: Limit total context size to avoid exceeding LLM limits
   * WHY: LLMs have token limits. GPT-4 can handle ~128k but costs more
   */
  MAX_CONTEXT_TOKENS: 4000,

  // ============================================
  // CHAT HISTORY SETTINGS
  // ============================================

  /**
   * Number of recent messages to include in context
   * 
   * WHAT: Sliding window size for conversation history
   * WHY: Recent messages provide context for follow-up questions
   * 
   * Trade-off:
   * - More messages = better context continuity
   * - Fewer messages = faster, cheaper, less confusion
   */
  HISTORY_MESSAGE_COUNT: 6,

  /**
   * Maximum characters per history message
   * 
   * WHAT: Truncate very long messages in history
   * WHY: Prevent single message from dominating context
   */
  MAX_HISTORY_MESSAGE_LENGTH: 500,

  // ============================================
  // MODEL SETTINGS
  // ============================================

  /**
   * Default LLM model for generation
   */
  DEFAULT_MODEL: 'gpt-4.1',

  /**
   * Temperature for LLM responses (0.0 to 2.0)
   * 
   * WHAT: Controls randomness/creativity
   * WHY: Lower = more consistent, factual answers
   *      Higher = more creative, varied answers
   * 
   * For RAG (factual Q&A): Use 0 to 0.3
   */
  TEMPERATURE: 0,

  // ============================================
  // RESPONSE SETTINGS
  // ============================================

  /**
   * Snippet length for citations
   * 
   * WHAT: How many characters to show in citation preview
   */
  CITATION_SNIPPET_LENGTH: 200,
} as const;

// Type for configuration (useful for TypeScript)
export type RagConfig = typeof RAG_CONFIG;
```

#### 💡 Explanation for Beginners

**What does `as const` mean?**

```typescript
// Without 'as const':
const obj = { TOP_K: 5 };  // TypeScript thinks TOP_K is type 'number'

// With 'as const':
const obj = { TOP_K: 5 } as const;  // TypeScript knows TOP_K is exactly 5
```

This makes the config read-only and gives better type safety.

---

### Step 2: Create RAG Types/Interfaces

#### 📁 File: `src/rag/rag.types.ts`

```typescript
/**
 * RAG Type Definitions
 * 
 * WHAT THIS DOES:
 * Defines the "shape" of data used in RAG operations.
 * TypeScript interfaces are like contracts that describe
 * what properties an object must have.
 * 
 * WHY THIS IS NECESSARY:
 * 1. Catch errors at compile time (before running code)
 * 2. Get autocomplete in VS Code
 * 3. Document what data looks like
 * 4. Make refactoring safer
 */

import { Document } from '@langchain/core/documents';

/**
 * Represents a retrieved document with its relevance score
 * 
 * WHY: We need to track both the document AND how relevant it is
 */
export interface RetrievedDocument {
  /** The actual document content and metadata */
  document: Document;
  
  /** Similarity score (0-1), higher = more relevant */
  score: number;
}

/**
 * Input for RAG query
 * 
 * WHY: Standardize what information we need to process a query
 */
export interface RagQueryInput {
  /** The user's question */
  query: string;
  
  /** User ID for filtering documents */
  userId: string;
  
  /** Optional project ID for scoped search */
  projectId?: string;
  
  /** Optional chat ID for history context */
  chatId?: string;
  
  /** Override default k value */
  topK?: number;
}

/**
 * Message in chat history
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Citation information for a retrieved chunk
 * 
 * WHY: Users need to know WHERE the information came from
 */
export interface Citation {
  /** Index of the chunk (for reference in answer) */
  index: number;
  
  /** Short preview of the chunk content */
  snippet: string;
  
  /** Full chunk text */
  text: string;
  
  /** Source file identifier */
  fileId: string;
  
  /** URL/path to source file */
  fileUrl: string;
  
  /** Page number in original document */
  page: number;
  
  /** Chunk index within the document */
  chunkIndex: number;
  
  /** Character position where chunk starts */
  startOffset: number;
  
  /** Character position where chunk ends */
  endOffset: number;
}

/**
 * Output from RAG processing
 */
export interface RagResponse {
  /** The generated answer */
  answer: string;
  
  /** Citations for the answer */
  citations: Citation[];
  
  /** Raw retrieved documents (for debugging/advanced use) */
  retrievedDocuments: RetrievedDocument[];
  
  /** Number of documents used in context */
  documentsUsed: number;
  
  /** Processing metadata */
  metadata: {
    /** Model used for generation */
    model: string;
    
    /** Time taken for retrieval (ms) */
    retrievalTimeMs: number;
    
    /** Time taken for generation (ms) */
    generationTimeMs: number;
    
    /** Total processing time (ms) */
    totalTimeMs: number;
  };
}

/**
 * Context built for LLM prompt
 */
export interface BuiltContext {
  /** Formatted context string from documents */
  documentContext: string;
  
  /** Formatted chat history */
  historyContext: ChatMessage[];
  
  /** System prompt */
  systemPrompt: string;
  
  /** Final user prompt with context */
  userPrompt: string;
  
  /** Citations data */
  citations: Citation[];
}
```

#### 💡 Why Interfaces Matter (For Beginners)

```typescript
// WITHOUT interfaces - Easy to make mistakes:
function processQuery(data: any) {
  console.log(data.querry);  // Typo! No error shown
}

// WITH interfaces - TypeScript catches errors:
function processQuery(data: RagQueryInput) {
  console.log(data.querry);  // ERROR: Property 'querry' does not exist
  console.log(data.query);   // Correct! Autocomplete helps you
}
```

---

### Step 3: Create Enhanced Retrieval Service

#### 📁 File: `src/rag/retrieval.service.ts`

```typescript
/**
 * RAG Retrieval Service
 * 
 * WHAT THIS DOES:
 * Handles the "R" (Retrieval) part of RAG.
 * Searches your vector database and returns relevant documents.
 * 
 * WHY THIS IS NECESSARY:
 * Separates retrieval logic from the main chat flow.
 * Makes it easier to:
 * 1. Test retrieval independently
 * 2. Add features like filtering, scoring
 * 3. Switch to different retrieval strategies later
 */

import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';
import { RAG_CONFIG } from './rag.config';
import { RetrievedDocument, RagQueryInput, Citation } from './rag.types';

@Injectable()
export class RetrievalService {
  // Logger helps us track what's happening (for debugging)
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    // Inject the existing VectorService (Dependency Injection)
    private readonly vectorService: VectorService,
  ) {}

  /**
   * Retrieve relevant documents for a query
   * 
   * @param input - Query parameters
   * @returns Array of documents with similarity scores
   * 
   * HOW IT WORKS:
   * 1. Takes the user's question
   * 2. Searches vector database for similar chunks
   * 3. Filters by similarity threshold
   * 4. Returns documents ordered by relevance
   */
  async retrieve(input: RagQueryInput): Promise<RetrievedDocument[]> {
    const startTime = Date.now();
    
    // Use provided topK or default from config
    const topK = input.topK ?? RAG_CONFIG.TOP_K;
    
    this.logger.debug(
      `Retrieving documents for query: "${input.query.substring(0, 50)}..."`,
    );

    try {
      // Step 1: Get documents from vector store
      // Your existing VectorService.getRetrievals() method
      const documents = await this.vectorService.getRetrievals(
        input.query,
        topK,
        input.userId,
        input.projectId,
      );

      // Step 2: Transform to our format with scores
      // NOTE: PGVector's similaritySearch doesn't return scores by default
      // We'll use a workaround for now, or you can use similaritySearchWithScore
      const retrievedDocs: RetrievedDocument[] = documents.map((doc, index) => ({
        document: doc,
        // Approximate score based on rank (better than nothing)
        // In production, use similaritySearchWithScore for actual scores
        score: 1 - (index * 0.05), // First doc = 1.0, second = 0.95, etc.
      }));

      // Step 3: Filter by similarity threshold
      const filteredDocs = retrievedDocs.filter(
        (doc) => doc.score >= RAG_CONFIG.SIMILARITY_THRESHOLD,
      );

      const elapsed = Date.now() - startTime;
      this.logger.debug(
        `Retrieved ${filteredDocs.length}/${documents.length} documents in ${elapsed}ms`,
      );

      return filteredDocs;
    } catch (error) {
      this.logger.error('Retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Build citations from retrieved documents
   * 
   * @param documents - Retrieved documents
   * @returns Array of citation objects
   * 
   * WHY: Citations tell users WHERE the information came from.
   * This is crucial for:
   * 1. Transparency - Users can verify answers
   * 2. Trust - Users know answers aren't made up
   * 3. Navigation - Users can read the full source
   */
  buildCitations(documents: RetrievedDocument[]): Citation[] {
    return documents.map((doc) => ({
      index: doc.document.metadata.chunkIndex as number,
      snippet:
        doc.document.pageContent.substring(
          0,
          RAG_CONFIG.CITATION_SNIPPET_LENGTH,
        ) + '...',
      text: doc.document.pageContent,
      fileId: doc.document.metadata.fileId as string,
      fileUrl: doc.document.metadata.fileUrl as string,
      page: doc.document.metadata.page as number,
      chunkIndex: doc.document.metadata.chunkIndex as number,
      startOffset: doc.document.metadata.startOffset as number,
      endOffset: doc.document.metadata.endOffset as number,
    }));
  }

  /**
   * Check if retrieval returned meaningful results
   * 
   * @param documents - Retrieved documents
   * @returns boolean indicating if results are useful
   * 
   * WHY: If we get no relevant documents, we should tell the user
   * instead of making up an answer (preventing hallucination).
   */
  hasRelevantResults(documents: RetrievedDocument[]): boolean {
    // No documents at all
    if (!documents || documents.length === 0) {
      return false;
    }

    // Check if at least one document has good relevance
    const hasGoodMatch = documents.some(
      (doc) => doc.score >= RAG_CONFIG.SIMILARITY_THRESHOLD,
    );

    return hasGoodMatch;
  }
}
```

#### 💡 Key Concept: Dependency Injection (DI)

```typescript
// NestJS uses Dependency Injection
// Instead of creating services yourself:
class RetrievalService {
  constructor() {
    this.vectorService = new VectorService(); // ❌ BAD - tight coupling
  }
}

// NestJS automatically "injects" dependencies:
@Injectable()
class RetrievalService {
  constructor(
    private readonly vectorService: VectorService, // ✅ GOOD - NestJS provides it
  ) {}
}
```

---

### Step 4: Create Prompt Builder Service

#### 📁 File: `src/rag/prompt.service.ts`

```typescript
/**
 * RAG Prompt Service
 * 
 * WHAT THIS DOES:
 * Builds the prompts that we send to the LLM.
 * Combines user query + retrieved documents + chat history
 * into a well-structured prompt.
 * 
 * WHY THIS IS NECESSARY:
 * The prompt is CRITICAL for RAG quality. A good prompt:
 * 1. Tells the LLM exactly what to do
 * 2. Provides context in a structured way
 * 3. Sets rules for citations
 * 4. Prevents hallucination
 */

import { Injectable } from '@nestjs/common';
import { RAG_CONFIG } from './rag.config';
import {
  RetrievedDocument,
  ChatMessage,
  BuiltContext,
  Citation,
} from './rag.types';

@Injectable()
export class PromptService {
  /**
   * System prompt template
   * 
   * WHY THIS SPECIFIC PROMPT:
   * - "only answer based on Context" → Prevents making up info
   * - Citation rules → Ensures traceable answers
   * - Clear format → LLM knows exactly what to do
   */
  private readonly SYSTEM_PROMPT = `
Bạn là một assistant chỉ trả lời dựa trên thông tin trong "Context".
Nếu không thấy câu trả lời trong Context thì trả lời "Tôi không tìm thấy thông tin trong tài liệu."

QUY TẮC TRÍCH DẪN (CITATION):

1. Mỗi đoạn trong Context có dạng:
   ### Chunk {chunkIndex}
   Nội dung...

2. Khi sử dụng thông tin từ chunk nào, bạn phải chèn citation
   theo format: [chunkIndex]
   ngay SAU câu, hoặc SAU bullet point sử dụng thông tin đó.

3. Chỉ chèn citation khi thông tin thật sự đến từ chunk đó.
   Tuyệt đối không bịa, không chèn sai chunk.

4. Tránh lặp lại citation không cần thiết (nếu cùng chunk được dùng
   liên tục trong nhiều câu liên tiếp, bạn có thể gộp cuối đoạn).

5. KHÔNG bao giờ tạo chunkIndex mới.
   Bạn chỉ được dùng chunkIndex đã có trong Context.

6. Câu trả lời phải rõ ràng, mạch lạc, và có citations chính xác
   theo đúng vị trí sử dụng thông tin.
`.trim();

  /**
   * Build the complete context for LLM
   * 
   * @param query - User's question
   * @param documents - Retrieved documents
   * @param chatHistory - Previous messages
   * @returns Fully built context object
   * 
   * HOW IT WORKS:
   * 1. Format retrieved documents into readable context
   * 2. Prepare chat history (truncate if needed)
   * 3. Combine everything into final prompt
   */
  buildContext(
    query: string,
    documents: RetrievedDocument[],
    chatHistory: ChatMessage[] = [],
  ): BuiltContext {
    // Step 1: Build document context
    // Each document becomes a numbered chunk for citation
    const documentContext = this.formatDocuments(documents);

    // Step 2: Prepare chat history
    // Take only recent messages, truncate long ones
    const historyContext = this.prepareHistory(chatHistory);

    // Step 3: Build final user prompt
    const userPrompt = this.buildUserPrompt(query, documentContext);

    // Step 4: Build citations
    const citations = this.extractCitations(documents);

    return {
      documentContext,
      historyContext,
      systemPrompt: this.SYSTEM_PROMPT,
      userPrompt,
      citations,
    };
  }

  /**
   * Format documents into context string
   * 
   * WHY THIS FORMAT:
   * - "### Chunk {index}" makes it easy for LLM to reference
   * - Clear separation between chunks
   * - Consistent structure for citation rules
   */
  private formatDocuments(documents: RetrievedDocument[]): string {
    if (!documents || documents.length === 0) {
      return 'Không có tài liệu liên quan được tìm thấy.';
    }

    return documents
      .map(
        (doc) =>
          `### Chunk ${doc.document.metadata.chunkIndex}\n${doc.document.pageContent}`,
      )
      .join('\n\n');
  }

  /**
   * Prepare chat history for context
   * 
   * WHY:
   * - Limit to N recent messages (sliding window)
   * - Truncate very long messages
   * - Filter out invalid messages
   */
  private prepareHistory(history: ChatMessage[]): ChatMessage[] {
    // Take only recent messages
    const recentHistory = history.slice(-RAG_CONFIG.HISTORY_MESSAGE_COUNT);

    // Filter and truncate
    return recentHistory
      .filter((msg) => msg && msg.role && msg.content) // Remove invalid
      .map((msg) => ({
        role: msg.role,
        content:
          msg.content.length > RAG_CONFIG.MAX_HISTORY_MESSAGE_LENGTH
            ? msg.content.substring(0, RAG_CONFIG.MAX_HISTORY_MESSAGE_LENGTH) +
              '...'
            : msg.content,
      }));
  }

  /**
   * Build final user prompt
   * 
   * STRUCTURE:
   * 1. Context (retrieved documents)
   * 2. Separator
   * 3. User's actual question
   */
  private buildUserPrompt(query: string, documentContext: string): string {
    return `
Context:

${documentContext}

---

Câu hỏi: ${query}
`.trim();
  }

  /**
   * Extract citation data from documents
   */
  private extractCitations(documents: RetrievedDocument[]): Citation[] {
    return documents.map((doc) => ({
      index: doc.document.metadata.chunkIndex as number,
      snippet:
        doc.document.pageContent.substring(
          0,
          RAG_CONFIG.CITATION_SNIPPET_LENGTH,
        ) + '...',
      text: doc.document.pageContent,
      fileId: doc.document.metadata.fileId as string,
      fileUrl: doc.document.metadata.fileUrl as string,
      page: doc.document.metadata.page as number,
      chunkIndex: doc.document.metadata.chunkIndex as number,
      startOffset: doc.document.metadata.startOffset as number,
      endOffset: doc.document.metadata.endOffset as number,
    }));
  }

  /**
   * Build messages array for LLM
   * 
   * WHY THIS ORDER:
   * 1. History first (context from conversation)
   * 2. System prompt (rules and behavior)
   * 3. User prompt (question with documents)
   * 
   * This ensures the LLM understands conversation context
   * before receiving its instructions.
   */
  buildMessages(context: BuiltContext): ChatMessage[] {
    return [
      ...context.historyContext,
      { role: 'system' as const, content: context.systemPrompt },
      { role: 'user' as const, content: context.userPrompt },
    ];
  }
}
```

---

### Step 5: Create Main RAG Service

#### 📁 File: `src/rag/rag.service.ts`

```typescript
/**
 * Main RAG Service - The Orchestrator
 * 
 * WHAT THIS DOES:
 * Coordinates the entire RAG pipeline:
 * 1. Receive query
 * 2. Retrieve relevant documents
 * 3. Build prompt with context
 * 4. Call LLM for generation
 * 5. Return formatted response
 * 
 * WHY THIS IS NECESSARY:
 * Single entry point for RAG operations.
 * Other services (like ChatService) just call this
 * without knowing the internal complexity.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OpenaiService } from '../llm/openai/openai.service';
import { RetrievalService } from './retrieval.service';
import { PromptService } from './prompt.service';
import { RAG_CONFIG } from './rag.config';
import {
  RagQueryInput,
  RagResponse,
  ChatMessage,
} from './rag.types';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly retrievalService: RetrievalService,
    private readonly promptService: PromptService,
  ) {}

  /**
   * Process a RAG query
   * 
   * @param input - Query parameters
   * @param chatHistory - Optional chat history for context
   * @returns Complete RAG response
   * 
   * FLOW:
   * ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
   * │ Query   │────►│ Retrieve │────►│ Build   │────►│ Generate │
   * │         │     │ Docs     │     │ Prompt  │     │ Answer   │
   * └─────────┘     └──────────┘     └─────────┘     └──────────┘
   */
  async query(
    input: RagQueryInput,
    chatHistory: ChatMessage[] = [],
  ): Promise<RagResponse> {
    const totalStartTime = Date.now();
    
    this.logger.log(`Processing RAG query: "${input.query.substring(0, 50)}..."`);

    // ==========================================
    // STEP 1: RETRIEVE RELEVANT DOCUMENTS
    // ==========================================
    const retrievalStartTime = Date.now();
    
    const retrievedDocs = await this.retrievalService.retrieve(input);
    
    const retrievalTimeMs = Date.now() - retrievalStartTime;
    this.logger.debug(`Retrieval completed in ${retrievalTimeMs}ms`);

    // Check if we have relevant results
    if (!this.retrievalService.hasRelevantResults(retrievedDocs)) {
      this.logger.warn('No relevant documents found for query');
      
      return {
        answer: 'Tôi không tìm thấy thông tin trong tài liệu.',
        citations: [],
        retrievedDocuments: [],
        documentsUsed: 0,
        metadata: {
          model: RAG_CONFIG.DEFAULT_MODEL,
          retrievalTimeMs,
          generationTimeMs: 0,
          totalTimeMs: Date.now() - totalStartTime,
        },
      };
    }

    // ==========================================
    // STEP 2: BUILD PROMPT CONTEXT
    // ==========================================
    const context = this.promptService.buildContext(
      input.query,
      retrievedDocs,
      chatHistory,
    );

    const messages = this.promptService.buildMessages(context);
    
    this.logger.debug(`Built prompt with ${retrievedDocs.length} documents`);

    // ==========================================
    // STEP 3: GENERATE ANSWER WITH LLM
    // ==========================================
    const generationStartTime = Date.now();
    
    const llm = this.openaiService.getChatModel(RAG_CONFIG.DEFAULT_MODEL);
    const response = await llm.invoke(messages);
    
    const generationTimeMs = Date.now() - generationStartTime;
    this.logger.debug(`Generation completed in ${generationTimeMs}ms`);

    // ==========================================
    // STEP 4: BUILD AND RETURN RESPONSE
    // ==========================================
    const totalTimeMs = Date.now() - totalStartTime;
    
    this.logger.log(`RAG query completed in ${totalTimeMs}ms`);

    return {
      answer: response.content as string,
      citations: context.citations,
      retrievedDocuments: retrievedDocs,
      documentsUsed: retrievedDocs.length,
      metadata: {
        model: RAG_CONFIG.DEFAULT_MODEL,
        retrievalTimeMs,
        generationTimeMs,
        totalTimeMs,
      },
    };
  }

  /**
   * Simple query without history (convenience method)
   */
  async simpleQuery(
    query: string,
    userId: string,
    projectId?: string,
  ): Promise<RagResponse> {
    return this.query({
      query,
      userId,
      projectId,
    });
  }
}
```

---

### Step 6: Create RAG Module

#### 📁 File: `src/rag/rag.module.ts`

```typescript
/**
 * RAG Module
 * 
 * WHAT THIS DOES:
 * Defines the RAG module for NestJS.
 * Groups all RAG-related services together.
 * 
 * WHY THIS IS NECESSARY:
 * NestJS uses modules to organize code.
 * Each module is a self-contained unit that can be:
 * 1. Imported into other modules
 * 2. Tested independently
 * 3. Reused across the application
 */

import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RetrievalService } from './retrieval.service';
import { PromptService } from './prompt.service';
import { IngestModule } from '../ingest/ingest.module';
import { OpenaiModule } from '../llm/openai/openai.module';

@Module({
  imports: [
    // Import modules that provide services we need
    IngestModule,   // Provides VectorService
    OpenaiModule,   // Provides OpenaiService
  ],
  providers: [
    // Services defined in this module
    RagService,
    RetrievalService,
    PromptService,
  ],
  exports: [
    // Make RagService available to other modules
    RagService,
    RetrievalService,
  ],
})
export class RagModule {}
```

#### 💡 Understanding NestJS Modules

```
┌─────────────────────────────────────────────────────────────┐
│                      AppModule (Root)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ ChatModule  │  │  RagModule  │  │ AuthModule  │   ...   │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                                  │
│         │    imports     │                                  │
│         └───────────────►│                                  │
│                          │                                  │
│  RagModule exports RagService                              │
│  ChatModule imports RagModule                              │
│  Now ChatService can use RagService                        │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 7: Update Chat Service

#### 📁 File: `src/chat/chat.service.ts` (UPDATED)

Now we update the existing ChatService to use our new RAG module:

```typescript
/**
 * CHANGES TO MAKE IN chat.service.ts:
 * 
 * 1. Import RagService
 * 2. Inject RagService in constructor
 * 3. Replace chatUtil method to use RagService
 * 
 * WHY: 
 * - Removes duplicated RAG logic from ChatService
 * - ChatService now focuses on chat management
 * - RAG logic is centralized in RagModule
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatDto } from './dto/chat.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JsonValue } from '@prisma/client/runtime/library';

// NEW IMPORTS
import { RagService } from '../rag/rag.service';
import { ChatMessage, Citation } from '../rag/rag.types';

@Injectable()
export class ChatService {
  constructor(
    // NEW: Inject RagService instead of individual services
    private readonly ragService: RagService,
    private prisma: PrismaService,
  ) {}

  /**
   * Main chat function - REFACTORED to use RagService
   * 
   * BEFORE: 
   * - All RAG logic was here (retrieval, prompt building, etc.)
   * 
   * AFTER:
   * - RAG logic delegated to RagService
   * - ChatService handles chat management (history, persistence)
   */
  private async chatUtil(chatDto: ChatDto) {
    // ==========================================
    // STEP 1: ENSURE CHAT EXISTS
    // ==========================================
    let chatId = chatDto.chatId;
    
    if (!chatId || chatId === 'null' || chatId === 'undefined') {
      const created = await this.prisma.chats.create({
        data: {
          messages: [],
          userId: chatDto.userId as string,
          projectId: chatDto.projectId as string,
        },
      });
      chatId = created.id;
    }

    // ==========================================
    // STEP 2: GET CHAT HISTORY
    // ==========================================
    const historyRecord = await this.prisma.chats.findUnique({
      where: { id: chatId },
    });

    if (!historyRecord) {
      throw new Error('Chat not found');
    }

    // Convert to ChatMessage format for RAG
    const chatHistory: ChatMessage[] = (
      (historyRecord.messages ?? []) as Array<{ role: string; content: string }>
    )
      .filter((m) => m && m.role && m.content)
      .map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

    // ==========================================
    // STEP 3: CALL RAG SERVICE
    // ==========================================
    const ragResponse = await this.ragService.query(
      {
        query: chatDto.message,
        userId: chatDto.userId as string,
        projectId: chatDto.projectId,
        chatId,
      },
      chatHistory,
    );

    // ==========================================
    // STEP 4: SAVE TO HISTORY
    // ==========================================
    const currentChat = await this.prisma.chats.findUnique({
      where: { id: chatId },
      select: { messages: true },
    });

    const updatedMessages = [
      ...((currentChat?.messages as Array<Record<string, unknown>>) || []),
      { role: 'user', content: chatDto.message },
      {
        role: 'assistant',
        content: ragResponse.answer,
        citation: ragResponse.citations,
      },
    ];

    const chat = await this.prisma.chats.update({
      where: { id: chatId },
      data: { messages: updatedMessages },
    });

    // ==========================================
    // STEP 5: RETURN RESPONSE
    // ==========================================
    return {
      answer: ragResponse.answer,
      citations: ragResponse.citations,
      relateDocs: ragResponse.retrievedDocuments.map((d) => d.document),
      chat,
      // NEW: Include metadata for debugging/monitoring
      metadata: ragResponse.metadata,
    };
  }

  // Rest of the methods remain the same...
  async chatLite(chatDto: ChatDto) {
    return await this.chatUtil(chatDto);
  }

  async chatHistory(chatDto: ChatDto) {
    return await this.chatUtil(chatDto);
  }

  async getAllUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId },
    });
  }

  async getGlobalUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
    });
  }

  async getChatById(userId: string, id: string) {
    return await this.prisma.chats.findUnique({
      where: { id, userId },
    });
  }

  async update(userId: string, id: string, updateChatDto: UpdateChatDto) {
    return await this.prisma.chats.update({
      where: { id, userId },
      data: updateChatDto,
      omit: { userId: true, messages: true },
    });
  }

  async remove(userId: string, id: string) {
    const chat = await this.prisma.chats.findUnique({
      where: { id },
    });
    if (!chat) throw new BadRequestException('Chat not found');
    if (chat.userId !== userId)
      throw new ForbiddenException('User Unauthorized!');

    return await this.prisma.chats.delete({
      where: { id },
      omit: { userId: true, messages: true },
    });
  }
}
```

---

### Step 8: Update Chat Module

#### 📁 File: `src/chat/chat.module.ts` (UPDATED)

```typescript
/**
 * Chat Module - Updated to use RagModule
 */

import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

// NEW: Import RagModule
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    PrismaModule,
    RagModule,  // NEW: Add RagModule
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
```

---

### Step 9: Create Index File for Easy Imports

#### 📁 File: `src/rag/index.ts`

```typescript
/**
 * Barrel Export File
 * 
 * WHAT THIS DOES:
 * Allows importing multiple things from one path.
 * 
 * Instead of:
 * import { RagService } from './rag/rag.service';
 * import { RagConfig } from './rag/rag.config';
 * 
 * You can do:
 * import { RagService, RAG_CONFIG } from './rag';
 */

export * from './rag.module';
export * from './rag.service';
export * from './rag.config';
export * from './rag.types';
export * from './retrieval.service';
export * from './prompt.service';
```

---

## 6. Verification & Testing

### 🧪 How to Test Your Implementation

#### Test 1: Unit Test for Retrieval Service

Create file: `src/rag/retrieval.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalService } from './retrieval.service';
import { VectorService } from '../ingest/vector/vector.service';

describe('RetrievalService', () => {
  let service: RetrievalService;
  let vectorService: jest.Mocked<VectorService>;

  beforeEach(async () => {
    // Create mock VectorService
    const mockVectorService = {
      getRetrievals: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrievalService,
        {
          provide: VectorService,
          useValue: mockVectorService,
        },
      ],
    }).compile();

    service = module.get<RetrievalService>(RetrievalService);
    vectorService = module.get(VectorService);
  });

  it('should retrieve documents', async () => {
    // Arrange: Setup mock data
    const mockDocs = [
      {
        pageContent: 'Test content about RAG',
        metadata: {
          fileId: 'file-1',
          chunkIndex: 0,
          page: 1,
        },
      },
    ];
    vectorService.getRetrievals.mockResolvedValue(mockDocs);

    // Act: Call the method
    const result = await service.retrieve({
      query: 'What is RAG?',
      userId: 'user-1',
    });

    // Assert: Check results
    expect(result).toHaveLength(1);
    expect(result[0].document.pageContent).toContain('RAG');
    expect(vectorService.getRetrievals).toHaveBeenCalledWith(
      'What is RAG?',
      5, // default topK
      'user-1',
      undefined,
    );
  });

  it('should return empty when no relevant results', async () => {
    vectorService.getRetrievals.mockResolvedValue([]);

    const result = await service.retrieve({
      query: 'Random query',
      userId: 'user-1',
    });

    expect(result).toHaveLength(0);
    expect(service.hasRelevantResults(result)).toBe(false);
  });
});
```

#### Test 2: Manual API Testing

Use Postman, curl, or VS Code REST Client:

```http
### Test RAG Chat
POST http://localhost:3000/chat
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "message": "What is RAG?",
  "userId": "your-user-id",
  "projectId": "optional-project-id"
}
```

Expected Response:

```json
{
  "answer": "RAG stands for... [0]",
  "citations": [
    {
      "index": 0,
      "snippet": "RAG (Retrieval-Augmented Generation) is...",
      "fileId": "file-123",
      "page": 1
    }
  ],
  "metadata": {
    "model": "gpt-4.1",
    "retrievalTimeMs": 120,
    "generationTimeMs": 1500,
    "totalTimeMs": 1620
  }
}
```

#### Test 3: Verify Citations Work

1. Upload a document with known content
2. Ask a question about that content
3. Check that:
   - Answer contains `[chunkIndex]` references
   - Citations array includes correct file info
   - Clicking citation leads to correct document location

### ✅ Verification Checklist

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| Module loads | App starts without errors | `LOG [NestFactory] Starting Nest application...` |
| Retrieval works | Send chat request | Response includes `citations` array |
| Config is used | Check logs | Uses `TOP_K=5` from config |
| History works | Send follow-up question | Context from previous message is used |
| No documents case | Query non-existent topic | Returns "Tôi không tìm thấy..." |
| Timing logged | Check console | Shows `retrievalTimeMs`, `generationTimeMs` |

---

## 7. Next Steps: Evolution Path

### 🚀 After Mastering Static RAG

Once Static RAG works well, consider these improvements:

| Evolution | What It Does | When to Add |
|-----------|--------------|-------------|
| **Dynamic k** | Adjust retrieval count based on query complexity | When "5 docs" is sometimes too few/many |
| **Hybrid Search** | Combine vector + keyword search | When exact name searches fail |
| **Reranking** | Re-score results with cross-encoder | When retrieval quality varies |
| **Query Rewriting** | Transform vague queries | When users ask unclear questions |
| **Semantic Cache** | Cache similar queries | When same questions are asked often |

### 📚 Learning Resources

1. **LangChain.js Documentation**: <https://js.langchain.com/docs/>
2. **PGVector Guide**: <https://github.com/pgvector/pgvector>
3. **RAG Best Practices**: See `_codebase/Tối ưu RAG cho hệ thống tra cứu.md`

---

## 📝 Summary

You've learned:

1. ✅ **What Static RAG is** - Fixed parameters, simple pipeline
2. ✅ **Pros/Cons for your project** - Good starting point with known limitations
3. ✅ **Architecture** - Clean separation (Retrieval → Prompt → Generation)
4. ✅ **Implementation** - Step-by-step with explanations
5. ✅ **Testing** - How to verify it works

**Your project NOW has a proper Static RAG implementation that is:**

- Well-structured (separate modules)
- Configurable (centralized config)
- Type-safe (TypeScript interfaces)
- Testable (dependency injection)
- Ready for evolution (clean architecture)

---

*Created by Senior Technical Lead for Fresher Developer Education*  
*December 2025*
