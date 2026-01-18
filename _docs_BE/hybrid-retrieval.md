<!-- src\retrieval\retrieval.service.ts -->

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';
import { Document } from '@langchain/core/documents';
import {
  HybridRetrievalService,
  HybridResult,
} from './hybrid-retrieval.service';
import {
  DEFAULT_RETRIEVAL_CONFIG,
  RetrievalConfig,
  RetrievalStrategy,
} from './retrieval.config';

// ============================================================================
// TYPES
// ============================================================================

type MetadataDoc = {
  fileId?: string;
  projectId?: string;
  userId?: string;
  fileUrl?: string;
  endOffset?: number;
  startOffset?: number;
  chunkIndex?: number;
  page?: number;
  title?: string;
  originalFileName?: string;
};

export interface ScoredDocument {
  pageContent: string;
  metadata: MetadataDoc;
  vectorScore: number;
  keywordScore?: number;
  finalScore?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG;

  constructor(
    private readonly vectorService: VectorService,
    private readonly hybridService: HybridRetrievalService,
  ) {}

  /**
   * Main retrieval pipeline using hybrid search
   * Pipeline: BM25 + Vector → RRF → Cohere Rerank → Top K
   */
  async retrieveAndRerank(
    query: string,
    userId: string,
    projectId?: string,
  ): Promise<ScoredDocument[]> {
    const { retrieveK, finalK, strategy } = this.config;

    this.logger.log(
      `[RetrievalService] query="${query.substring(0, 50)}...", strategy=${strategy}`,
    );

    // Step 1: Get all documents for BM25 indexing
    const allDocs = await this.getAllDocumentsForUser(userId, projectId);

    if (!allDocs.length) {
      this.logger.warn('No documents found for user/project');
      return [];
    }

    // Step 2: Get vector retriever
    const vectorRetriever = await this.vectorService.getRetrieverWithFilter(
      retrieveK,
      userId,
      projectId,
    );

    // Step 3: Hybrid retrieval
    const cacheKey = projectId ? `${userId}_${projectId}` : userId;

    const hybridResults = await this.hybridService.retrieve(
      query,
      vectorRetriever,
      allDocs,
      {
        cacheKey,
        config: this.config,
      },
    );

    // Step 4: Convert to ScoredDocument format
    const scoredDocs = this.convertToScoredDocuments(hybridResults);

    this.logSearchQuality(query, scoredDocs);

    return scoredDocs.slice(0, finalK);
  }

  /**
   * Update retrieval configuration
   */
  setConfig(config: Partial<RetrievalConfig>): void {
    this.config = { ...this.config, ...config };
    this.hybridService.setConfig(config);
  }

  /**
   * Get current strategy
   */
  getStrategy(): RetrievalStrategy {
    return this.config.strategy;
  }

  /**
   * Clear BM25 cache when documents change
   */
  async invalidateCache(userId: string, projectId?: string): Promise<void> {
    const cacheKey = projectId ? `${userId}_${projectId}` : userId;
    this.hybridService.clearCache(cacheKey);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Get all documents for a user/project to build BM25 index
   */
  private async getAllDocumentsForUser(
    userId: string,
    projectId?: string,
  ): Promise<Document[]> {
    // Use vector service to fetch documents with a high limit
    const rawDocs = await this.vectorService.getRetrievalsWithScore(
      '', // Empty query to get all
      10000, // High limit to get all docs
      userId,
      projectId,
    );

    return rawDocs.map(
      ([doc]) =>
        new Document({
          id: doc.id,
          pageContent: doc.pageContent,
          metadata: { ...doc.metadata },
        }),
    );
  }

  /**
   * Convert HybridResult to ScoredDocument format for backward compatibility
   */
  private convertToScoredDocuments(
    hybridResults: HybridResult[],
  ): ScoredDocument[] {
    return hybridResults.map((result) => ({
      pageContent: result.pageContent,
      metadata: result.metadata as MetadataDoc,
      vectorScore: result.vectorScore || 0,
      keywordScore: result.bm25Score,
      finalScore: result.finalScore,
    }));
  }

  /**
   * Log search quality metrics for debugging
   */
  private logSearchQuality(query: string, sortedDocs: ScoredDocument[]): void {
    const topDoc = sortedDocs[0];
    if (!topDoc) return;

    this.logger.debug({
      msg: 'Hybrid Retrieval Results',
      query: query.substring(0, 50),
      totalDocs: sortedDocs.length,
      topResult: {
        preview: topDoc.pageContent.substring(0, 50),
        vectorScore: topDoc.vectorScore?.toFixed(3),
        keywordScore: topDoc.keywordScore?.toFixed(3),
        finalScore: topDoc.finalScore?.toFixed(3),
      },
    });
  }
}
```

<!-- ===================================================================== -->
<!-- src\retrieval\hybrid-retrieval.service.ts -->
<!-- ===================================================================== -->

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { BM25Retriever } from '@langchain/community/retrievers/bm25';
import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { Document } from '@langchain/core/documents';
import { CohereRerank } from '@langchain/cohere';
import {
  DEFAULT_RETRIEVAL_CONFIG,
  RetrievalConfig,
  RetrievalStrategy,
} from './retrieval.config';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ScoredDocument {
  doc: Document;
  score: number;
  rank: number;
  source: 'bm25' | 'vector' | 'hybrid';
}

export interface HybridResult {
  pageContent: string;
  metadata: Record<string, unknown>;
  bm25Score?: number;
  vectorScore?: number;
  rrfScore: number;
  finalScore: number;
}

interface BM25CacheEntry {
  retriever: BM25Retriever;
  createdAt: number;
  documentCount: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class HybridRetrievalService {
  private readonly logger = new Logger(HybridRetrievalService.name);

  // BM25 cache: key = userId_projectId
  private readonly bm25Cache = new Map<string, BM25CacheEntry>();

  // Configuration
  private config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG;

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Main hybrid retrieval with optional reranking
   * Pipeline: BM25 + Vector → RRF Fusion → (Optional) Cohere Rerank
   */
  async retrieve(
    query: string,
    vectorRetriever: VectorStoreRetriever,
    documents: Document[],
    options: {
      cacheKey?: string;
      config?: Partial<RetrievalConfig>;
    } = {},
  ): Promise<HybridResult[]> {
    const config = { ...this.config, ...options.config };
    const { strategy, retrieveK, finalK } = config;

    this.logger.log(
      `Hybrid retrieve: strategy=${strategy}, retrieveK=${retrieveK}, finalK=${finalK}`,
    );

    // Strategy: Vector Only
    if (strategy === RetrievalStrategy.VECTOR_ONLY) {
      return this.vectorOnlyRetrieval(query, vectorRetriever, finalK);
    }

    // Initialize or get cached BM25
    const cacheKey = options.cacheKey || 'default';
    await this.ensureBM25Initialized(cacheKey, documents, config);

    try {
      // Parallel retrieval
      const [bm25Results, vectorResults] = await Promise.all([
        this.retrieveBM25(cacheKey, query, retrieveK),
        this.retrieveVector(query, vectorRetriever, retrieveK),
      ]);

      this.logger.debug(
        `Retrieved: BM25=${bm25Results.length}, Vector=${vectorResults.length}`,
      );

      // RRF Fusion with weighted scores
      const fusedResults = this.reciprocalRankFusion(
        bm25Results,
        vectorResults,
        config,
      );

      // Strategy: Hybrid + RRF only
      if (strategy === RetrievalStrategy.HYBRID_RRF) {
        return fusedResults.slice(0, finalK);
      }

      // Strategy: Hybrid + Cohere Rerank
      if (strategy === RetrievalStrategy.HYBRID_RERANK) {
        this.logger.log(
          `RRF fusion produced ${fusedResults.length} unique docs`,
        );

        // Pass more candidates to Cohere for better recall
        const candidatesForRerank = Math.min(fusedResults.length, 50);
        const reranked = await this.cohereRerank(
          fusedResults.slice(0, candidatesForRerank),
          query,
          config,
        );

        // Expand context to include adjacent chunks from same file
        // This captures complete info like lists that span multiple chunks
        const expanded = this.expandContext(reranked, documents, 2);

        return expanded.slice(0, finalK);
      }

      return fusedResults.slice(0, finalK);
    } catch (error) {
      this.logger.error(
        'Hybrid retrieval failed, falling back to vector:',
        error,
      );
      return this.vectorOnlyRetrieval(query, vectorRetriever, finalK);
    }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<RetrievalConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear BM25 cache for a specific key or all
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.bm25Cache.delete(cacheKey);
      this.logger.log(`Cleared BM25 cache for: ${cacheKey}`);
    } else {
      this.bm25Cache.clear();
      this.logger.log('Cleared all BM25 cache');
    }
  }

  /**
   * Force refresh BM25 index for a cache key
   */
  async refreshBM25(cacheKey: string, documents: Document[]): Promise<void> {
    this.bm25Cache.delete(cacheKey);
    await this.ensureBM25Initialized(cacheKey, documents, this.config);
    this.logger.log(
      `Refreshed BM25 for: ${cacheKey} with ${documents.length} docs`,
    );
  }

  // ============================================================================
  // BM25 RETRIEVAL
  // ============================================================================

  private async ensureBM25Initialized(
    cacheKey: string,
    documents: Document[],
    config: RetrievalConfig,
  ): Promise<void> {
    const cached = this.bm25Cache.get(cacheKey);
    const now = Date.now();

    // Check if cache is valid
    if (
      cached &&
      now - cached.createdAt < config.bm25Cache.ttlMs &&
      cached.documentCount === documents.length
    ) {
      return;
    }

    // Tokenize documents for Vietnamese
    const tokenizedDocs = documents.map((doc) => ({
      ...doc,
      pageContent: this.tokenizeVietnamese(doc.pageContent),
    }));

    const retriever = BM25Retriever.fromDocuments(tokenizedDocs, {
      k: config.retrieveK,
    });

    this.bm25Cache.set(cacheKey, {
      retriever,
      createdAt: now,
      documentCount: documents.length,
    });

    this.logger.log(
      `BM25 initialized for ${cacheKey}: ${documents.length} docs`,
    );
  }

  private async retrieveBM25(
    cacheKey: string,
    query: string,
    k: number,
  ): Promise<ScoredDocument[]> {
    const cached = this.bm25Cache.get(cacheKey);
    if (!cached) {
      throw new Error(`BM25 not initialized for cache key: ${cacheKey}`);
    }

    const tokenizedQuery = this.tokenizeVietnamese(query);
    this.logger.log(
      `[BM25] Tokenized query: "${tokenizedQuery.substring(0, 100)}..."`,
    );

    const docs = await cached.retriever.invoke(tokenizedQuery);

    // Debug: Log top BM25 results
    this.logger.log(`[BM25] Retrieved ${docs.length} docs. Top 3:`);
    docs.slice(0, 3).forEach((doc, i) => {
      const chunkIdx = doc.metadata?.chunkIndex;
      const fileId = (doc.metadata?.fileId as string)?.substring(0, 8);
      this.logger.log(
        `  ${i + 1}. [chunk=${chunkIdx}, file=${fileId}] ${doc.pageContent.substring(0, 50)}...`,
      );
    });

    return docs.slice(0, k).map((doc, index) => ({
      doc,
      score: this.calculateBM25Score(index, k), // Approximate score from rank
      rank: index + 1,
      source: 'bm25' as const,
    }));
  }

  /**
   * Approximate BM25 score from rank (since actual scores aren't exposed)
   * Uses exponential decay: score = e^(-rank/k)
   */
  private calculateBM25Score(index: number, k: number): number {
    return Math.exp(-index / (k / 3));
  }

  // ============================================================================
  // VECTOR RETRIEVAL
  // ============================================================================

  private async retrieveVector(
    query: string,
    vectorRetriever: VectorStoreRetriever,
    k: number,
  ): Promise<ScoredDocument[]> {
    const docs = await vectorRetriever.invoke(query);

    // Debug: Log top Vector results
    this.logger.log(`[Vector] Retrieved ${docs.length} docs. Top 3:`);
    docs.slice(0, 3).forEach((doc, i) => {
      const chunkIdx = doc.metadata?.chunkIndex;
      const fileId = (doc.metadata?.fileId as string)?.substring(0, 8);
      this.logger.log(
        `  ${i + 1}. [chunk=${chunkIdx}, file=${fileId}] ${doc.pageContent.substring(0, 50)}...`,
      );
    });

    return docs.slice(0, k).map((doc, index) => ({
      doc,
      score: this.calculateVectorScore(index, k),
      rank: index + 1,
      source: 'vector' as const,
    }));
  }

  /**
   * Approximate vector score from rank
   */
  private calculateVectorScore(index: number, k: number): number {
    return Math.exp(-index / (k / 3));
  }

  private async vectorOnlyRetrieval(
    query: string,
    vectorRetriever: VectorStoreRetriever,
    k: number,
  ): Promise<HybridResult[]> {
    const docs = await vectorRetriever.invoke(query);

    return docs.slice(0, k).map((doc, index) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      vectorScore: this.calculateVectorScore(index, k),
      rrfScore: 0,
      finalScore: this.calculateVectorScore(index, k),
    }));
  }

  // ============================================================================
  // RRF FUSION
  // ============================================================================

  /**
   * Reciprocal Rank Fusion with weighted scores
   * Formula: RRF(d) = Σ weight_i / (k + rank_i(d))
   */
  private reciprocalRankFusion(
    bm25Results: ScoredDocument[],
    vectorResults: ScoredDocument[],
    config: RetrievalConfig,
  ): HybridResult[] {
    const { rrfK, weights } = config;
    const docScores = new Map<string, HybridResult>();

    // Process BM25 results
    for (const { doc, rank, score } of bm25Results) {
      const docId = this.getDocumentId(doc);
      const rrfScore = weights.bm25 / (rrfK + rank);

      if (!docScores.has(docId)) {
        docScores.set(docId, {
          pageContent: doc.pageContent,
          metadata: doc.metadata,
          bm25Score: score,
          vectorScore: undefined,
          rrfScore: rrfScore,
          finalScore: rrfScore,
        });
      } else {
        const existing = docScores.get(docId)!;
        existing.bm25Score = score;
        existing.rrfScore += rrfScore;
        existing.finalScore = existing.rrfScore;
      }
    }

    // Process Vector results
    for (const { doc, rank, score } of vectorResults) {
      const docId = this.getDocumentId(doc);
      const rrfScore = weights.vector / (rrfK + rank);

      if (!docScores.has(docId)) {
        docScores.set(docId, {
          pageContent: doc.pageContent,
          metadata: doc.metadata,
          bm25Score: undefined,
          vectorScore: score,
          rrfScore: rrfScore,
          finalScore: rrfScore,
        });
      } else {
        const existing = docScores.get(docId)!;
        existing.vectorScore = score;
        existing.rrfScore += rrfScore;
        existing.finalScore = existing.rrfScore;
      }
    }

    // Sort by RRF score
    const sorted = Array.from(docScores.values()).sort(
      (a, b) => b.finalScore - a.finalScore,
    );

    this.logger.debug(
      `RRF fusion: ${sorted.length} unique docs (BM25: ${bm25Results.length}, Vector: ${vectorResults.length})`,
    );

    return sorted;
  }

  // ============================================================================
  // COHERE RERANK
  // ============================================================================

  private async cohereRerank(
    results: HybridResult[],
    query: string,
    config: RetrievalConfig,
  ): Promise<HybridResult[]> {
    if (results.length === 0) return [];

    this.logger.log(
      `Cohere rerank: input=${results.length} docs, topN=${config.cohere.topN}`,
    );

    try {
      const cohereRerank = new CohereRerank({
        apiKey: process.env.COHERE_API_KEY,
        topN: config.cohere.topN,
        model: config.cohere.model,
      });

      // Convert to Document format for Cohere
      const docs = results.map(
        (r) =>
          new Document({
            pageContent: r.pageContent,
            metadata: r.metadata,
          }),
      );

      const reranked = await cohereRerank.compressDocuments(docs, query);

      this.logger.log(
        `Cohere rerank: output=${reranked.length} docs (requested ${config.cohere.topN})`,
      );

      // Map back with rerank scores
      return reranked.map((doc) => {
        // Find original result to preserve scores
        const original = results.find((r) => r.pageContent === doc.pageContent);

        return {
          pageContent: doc.pageContent,
          metadata: doc.metadata,
          bm25Score: original?.bm25Score,
          vectorScore: original?.vectorScore,
          rrfScore: original?.rrfScore || 0,
          finalScore: (doc.metadata.relevanceScore as number) || 0,
        };
      });
    } catch (error) {
      this.logger.error('Cohere rerank failed, using RRF scores:', error);
      return results;
    }
  }

  // ============================================================================
  // CONTEXT EXPANSION
  // ============================================================================

  /**
   * Expand context by including adjacent chunks from the same file
   * This helps capture complete information that spans multiple chunks
   * (e.g., a list of 8 advantages spread across chunks)
   */
  private expandContext(
    results: HybridResult[],
    allDocuments: Document[],
    windowSize: number = 2,
  ): HybridResult[] {
    if (results.length === 0 || allDocuments.length === 0) return results;

    const expandedResults: HybridResult[] = [];
    const addedContentHashes = new Set<string>();

    // Create index of all documents by fileId and chunkIndex
    const docIndex = new Map<string, Map<number, Document>>();
    for (const doc of allDocuments) {
      const fileId = doc.metadata?.fileId as string;
      const chunkIndex = doc.metadata?.chunkIndex as number;
      if (!fileId || chunkIndex === undefined) continue;

      if (!docIndex.has(fileId)) {
        docIndex.set(fileId, new Map());
      }
      docIndex.get(fileId)!.set(chunkIndex, doc);
    }

    // For each result, add adjacent chunks
    for (const result of results) {
      const contentHash = result.pageContent.substring(0, 100);

      // Add the original result if not already added
      if (!addedContentHashes.has(contentHash)) {
        expandedResults.push(result);
        addedContentHashes.add(contentHash);
      }

      // Get adjacent chunks from the same file
      const fileId = result.metadata?.fileId as string;
      const chunkIndex = result.metadata?.chunkIndex as number;

      if (!fileId || chunkIndex === undefined || !docIndex.has(fileId))
        continue;

      const fileChunks = docIndex.get(fileId)!;

      // Add adjacent chunks (before and after)
      for (let offset = -windowSize; offset <= windowSize; offset++) {
        if (offset === 0) continue; // Skip the current chunk

        const adjacentIndex = chunkIndex + offset;
        const adjacentDoc = fileChunks.get(adjacentIndex);

        if (adjacentDoc) {
          const adjacentHash = adjacentDoc.pageContent.substring(0, 100);

          if (!addedContentHashes.has(adjacentHash)) {
            // Create HybridResult for adjacent chunk with slightly lower score
            const adjacentResult: HybridResult = {
              pageContent: adjacentDoc.pageContent,
              metadata: adjacentDoc.metadata,
              bm25Score: undefined,
              vectorScore: undefined,
              rrfScore: 0,
              // Adjacent chunks get a score based on distance from original
              finalScore: result.finalScore * (1 - Math.abs(offset) * 0.1),
            };
            expandedResults.push(adjacentResult);
            addedContentHashes.add(adjacentHash);
          }
        }
      }
    }

    // Sort by final score and return
    const sorted = expandedResults.sort((a, b) => b.finalScore - a.finalScore);

    this.logger.log(
      `Context expansion: ${results.length} -> ${sorted.length} docs (window=${windowSize})`,
    );

    return sorted;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Simple Vietnamese text normalization for BM25
   * Handles basic preprocessing without requiring native modules
   */
  private tokenizeVietnamese(text: string): string {
    return (
      text
        .toLowerCase()
        // Normalize Vietnamese diacritics
        .normalize('NFC')
        // Remove special characters but keep Vietnamese letters
        .replace(/[^a-zA-Z0-9\u00C0-\u1EF9\s]/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Generate unique document ID
   */
  private getDocumentId(doc: Document): string {
    return (
      (doc.metadata?.id as string) ||
      (doc.metadata?.fileId as string) ||
      doc.pageContent.substring(0, 100)
    );
  }
}
```

<!-- ===================================================================== -->
<!-- src\retrieval\retrieval.config.ts -->
<!-- ===================================================================== -->

```typescript
/**
 * Retrieval Configuration
 * Centralized configuration for hybrid retrieval system
 */

export enum RetrievalStrategy {
  VECTOR_ONLY = 'VECTOR_ONLY',
  HYBRID_RRF = 'HYBRID_RRF', // BM25 + Vector with RRF fusion only
  HYBRID_RERANK = 'HYBRID_RERANK', // BM25 + Vector + RRF + Cohere Rerank
}

export interface RetrievalConfig {
  strategy: RetrievalStrategy;
  retrieveK: number; // Initial candidates per retrieval method
  finalK: number; // Final results to return
  rrfK: number; // RRF smoothing constant (default: 60)
  weights: {
    bm25: number;
    vector: number;
  };
  cohere: {
    model: string;
    topN: number;
  };
  bm25Cache: {
    ttlMs: number; // Time-to-live for BM25 index cache
  };
}

export const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  strategy: RetrievalStrategy.HYBRID_RERANK,

  // Retrieve more candidates for better recall
  retrieveK: 80, // Increased from 50 for better candidate coverage

  // Final top results after all processing
  finalK: 15,

  // RRF smoothing constant (research suggests 60 is optimal)
  rrfK: 60,

  // Weights for hybrid fusion - favor vector for semantic matching
  weights: {
    bm25: 0.3, // Reduced - BM25 struggles with Vietnamese
    vector: 0.7, // Increased - embeddings understand semantics better
  },

  // Cohere reranker settings
  cohere: {
    model: 'rerank-v3.5',
    topN: 30, // Increased to get more results
  },

  // BM25 index cache settings
  bm25Cache: {
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },
};
```

<!-- ===================================================================== -->
<!-- src\ingest\vector\vector.service.ts -->
<!-- ===================================================================== -->

```typescript
import { Injectable } from '@nestjs/common';
import { PgvectorService } from './pgvector.client';
import { ChunkResult } from '../splitters/text-splitter';

type Metadata = {
  fileId: string;
  projectId?: string;
  userId: string;
  fileUrl: string;
};
@Injectable()
export class VectorService {
  constructor(private readonly pgvectorService: PgvectorService) {}

  // -- ADD DOCUMENTS TO VECTOR STORE --
  async addDocuments({
    chunks,
    metadata,
  }: {
    chunks: ChunkResult[];
    metadata: Metadata;
  }) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    return vectorStore.addDocuments(
      chunks.map((chunk) => ({
        pageContent: chunk.content,
        metadata: {
          chunkIndex: chunk.chunkIndex,
          ...metadata,
          ...chunk.metadata,
        },
      })),
    );
  }

  // -- RETRIEVE SIMILAR DOCUMENTS --
  async getRetrievalsWithK(
    query: string,
    k: number,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearch(query, k, filter);
    return results;
  }

  // -- RETRIEVE SIMILAR WITH SCORE --
  async getRetrievalsWithScore(
    query: string,
    k = 30,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearchWithScore(
      query,
      k,
      filter,
    );

    //  for (const [doc, score] of similaritySearchWithScoreResults) {
    //   console.log(`* [SIM=${score.toFixed(3)}] ${doc.pageContent} [${JSON.stringify(doc.metadata)}]`);
    // }

    return results;
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }

  // -- GET RETRIEVER WITH FILTER --
  async getRetrieverWithFilter(k: number, userId: string, projectId?: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    return vectorStore.asRetriever({
      k,
      filter,
    });
  }
}
```
