import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';

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
  private readonly RETRIEVE_K = 50;
  // Chỉ lấy top kết quả chất lượng nhất gửi cho LLM
  private readonly FINAL_K = 8;

  // Trọng số cho Hybrid search (Fire tune base on real data)
  private readonly WEIGHT_VECTOR = 0.4;
  private readonly WEIGHT_KEYWORD = 0.6;

  constructor(
    private vectorService: VectorService,
    private logger: Logger,
  ) {}

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

    // Chuẩn hóa documents sang format dễ xử lý
    let candidates: ScoredDocument[] = rawDocs.map(([doc, score]) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      vectorScore: score, // Giả sử score càng cao càng tốt (Cosine Similarity)
    }));

    // BƯỚC 2: RERANKING - Tính điểm từ khóa (Keyword Boosting)
    // Đây là Core quality để tìm chính xác thông tin hỗn tạp
    candidates = this.performKeywordReranking(query, candidates);

    // BƯỚC 3: SORTING & SELECTION
    // Sắp xếp theo điểm số cuối cùng (Final Score)
    candidates.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    // Log để debug chất lượng tìm kiếm
    this.logSearchQuality(query, candidates);

    // Trả về top kết quả tốt nhất
    return candidates.slice(0, this.FINAL_K);
  }

  /**
   * Thuật toán tính điểm Keyword đơn giản nhưng hiệu quả (BM25 Simplified)
   * Tăng điểm cho các document chứa chính xác từ khóa trong query
   */
  private performKeywordReranking(
    query: string,
    docs: ScoredDocument[],
  ): ScoredDocument[] {
    // Tách query thành các token (từ đơn), loại bỏ từ quá ngắn
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2); // TODO: User chat: "IT là gì, AI là gì?, IC là gì? " -> loại bỏ luôn key thì toang

    if (queryTerms.length === 0) return docs;

    return docs.map((doc) => {
      const contentLower = doc.pageContent.toLowerCase();
      let keywordMatches = 0;

      // Đếm số lượng từ khóa xuất hiện trong đoạn văn
      queryTerms.forEach((term) => {
        // Sử dụng regex để tìm từ chính xác (word boundary) tránh match nhầm
        // Ví dụ: tìm "tài" không nên match "tài liệu"
        const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'g');
        const matches = contentLower.match(regex);
        if (matches) {
          keywordMatches += matches.length;
        }
        // Fallback: nếu không tìm thấy chính xác, tìm chuỗi con (cho tiếng Việt)
        else if (contentLower.includes(term)) {
          keywordMatches += 0.5;
        }
      });

      // Tính điểm keyword (Normalization đơn giản)
      // Giới hạn điểm keyword boost tối đa là 1.0 để không lấn át hoàn toàn Vector
      const keywordScore = Math.min(keywordMatches * 0.1, 1.0);

      // CÔNG THỨC HYBRID SCORE
      // Kết hợp sức mạnh của Vector (hiểu ngữ nghĩa) và Keyword (độ chính xác)
      doc.keywordScore = keywordScore;
      doc.finalScore =
        doc.vectorScore * this.WEIGHT_VECTOR +
        keywordScore * this.WEIGHT_KEYWORD;

      return doc;
    });
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

// ==== OLD CODE ====

// import { Injectable, Logger } from '@nestjs/common';
// import { VectorService } from '../ingest/vector/vector.service';

// @Injectable()
// export class RetrievalService {
//   private readonly INITIAL_K = 30;
//   private readonly SCORE_THRESHOLD = 0.3;
//   private readonly MIN_DOCS = 5;
//   private readonly MAX_DOCS = 10;
//   private readonly MIN_LENGTH = 30;

//   constructor(
//     private vectorService: VectorService,
//     private logger: Logger,
//   ) {}
//   // -- RETRIEVE DOCUMENTS WITH SCORE  --
//   async retrieveScore(query: string, userId: string, projectId?: string) {
//     // Get results with score
//     const docsScore = await this.vectorService.getRetrievalsWithScore(
//       query,
//       this.INITIAL_K,
//       userId,
//       projectId,
//     );

//     // edge case: no results
//     if (!docsScore.length) return [];

//     const sortedDocs = docsScore.sort((a, b) => b[1] - a[1]);

//     // Filter by score threshold and min length
//     let filteredDocsScore = docsScore.filter(
//       ([doc, score]) =>
//         score >= this.SCORE_THRESHOLD &&
//         doc.pageContent.length >= this.MIN_LENGTH,
//     );

//     // If not enough docs, take top MAX_DOCS
//     if (filteredDocsScore.length < this.MIN_DOCS) {
//       filteredDocsScore = docsScore.slice(0, this.MIN_DOCS);
//     }

//     this.logger.debug({
//       query,
//       topScores: sortedDocs.slice(0, 5).map((d) => d[1]),
//       selectedCount: filteredDocsScore.length,
//     });

//     // const adaptiveThreshold = Math.max(0.25, Math.min(maxScore * 0.8, 0.45));

//     return filteredDocsScore.slice(0, this.MAX_DOCS);
//   }
// }
