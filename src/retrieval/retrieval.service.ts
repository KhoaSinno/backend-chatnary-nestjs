import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';
import { CohereRerank } from '@langchain/cohere';
import { Document } from '@langchain/core/documents';

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

@Injectable()
export class RetrievalService {
  // Lấy nhiều hơn để lọc kỹ hơn (Wide Net)
  private readonly RETRIEVE_K = 90;
  // Chỉ lấy top kết quả chất lượng nhất gửi cho LLM
  private readonly FINAL_K = 20;

  // Trọng số cho Hybrid search (Fire tune base on real data)
  private readonly WEIGHT_VECTOR = 0.3;
  private readonly WEIGHT_KEYWORD = 0.7;

  constructor(
    private vectorService: VectorService,
    private logger: Logger,
  ) { }

  /**
   * Pipeline tìm kiếm chuyên nghiệp:
   * 1. Retrieve (Vector Search)
   * 2. Rerank (Keyword Boosting / Cross-Encoder)
   * 3. Cutoff (Cut Top K)
   */
  async retrieveAndRerank(query: string, userId: string, projectId?: string) {
    // BƯỚC 1: RETRIEVAL - Lấy tập ứng viên rộng
    const rawDocs = await this.vectorService.getRetrievalsWithScore(
      query,
      this.RETRIEVE_K,
      userId,
      projectId,
    );

    if (!rawDocs.length) return [];

    const docsRerank: Document[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rawDocs.forEach(([doc, _]) => {
      docsRerank.push(
        new Document({
          id: doc.id,
          pageContent: doc.pageContent,
          metadata: { ...doc.metadata },
        }),
      );
    });

    const cohereRerank = new CohereRerank({
      apiKey: process.env.COHERE_API_KEY, // Default
      topN: this.FINAL_K, // Default 8
      model: 'rerank-v4.0-pro',
    });

    const rerankedDocuments = await cohereRerank.compressDocuments(
      docsRerank,
      query,
    );

    console.log(rerankedDocuments);

    // Chuẩn hóa documents sang format dễ xử lý
    const candidates: ScoredDocument[] = rerankedDocuments.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      finalScore: doc.metadata.relevanceScore as number,
      vectorScore: 0,
      keywordScore: 0,
    }));

    // Log để debug chất lượng tìm kiếm
    this.logSearchQuality(query, candidates);

    // Trả về top kết quả tốt nhất
    return candidates.slice(0, this.FINAL_K);
  }

  private logSearchQuality(query: string, sortedDocs: ScoredDocument[]) {
    const topDoc = sortedDocs[0];
    this.logger.debug({
      msg: 'Rerank Results',
      query,
      topResult: {
        preview: topDoc?.pageContent.substring(0, 50),
        vScore: topDoc?.vectorScore.toFixed(3),
        kScore: topDoc?.keywordScore?.toFixed(3),
        final: topDoc?.finalScore?.toFixed(3),
      },
    });
  }
}
