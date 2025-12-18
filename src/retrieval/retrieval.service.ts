import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';

@Injectable()
export class RetrievalService {
  private readonly INITIAL_K = 30;
  private readonly SCORE_THRESHOLD = 0.3;
  private readonly MIN_DOCS = 3;
  private readonly MAX_DOCS = 5;

  constructor(
    private vectorService: VectorService,
    private logger: Logger,
  ) {}
  // TODO: Hybrid search
  // -- RETRIEVE DOCUMENTS WITH SCORE  --
  async retrieveScore(query: string, userId: string, projectId?: string) {
    // Get results with score
    const docsScore = await this.vectorService.getRetrievalsWithScore(
      query,
      this.INITIAL_K,
      userId,
      projectId,
    );

    // edge case: no results
    if (!docsScore.length) return [];

    const sortedDocs = docsScore.sort((a, b) => b[1] - a[1]);

    // Filter by score threshold
    let filteredDocsScore = docsScore.filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, score]) => score >= this.SCORE_THRESHOLD,
    );

    // If not enough docs, take top MAX_DOCS
    if (filteredDocsScore.length < this.MIN_DOCS) {
      filteredDocsScore = docsScore.slice(0, this.MIN_DOCS);
    }

    this.logger.debug({
      query,
      topScores: sortedDocs.slice(0, 5).map((d) => d[1]),
      selectedCount: filteredDocsScore.length,
    });

    // const adaptiveThreshold = Math.max(0.25, Math.min(maxScore * 0.8, 0.45));

    return filteredDocsScore.slice(0, this.MAX_DOCS);
  }
}
