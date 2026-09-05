import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CohereRerank } from '@langchain/cohere';
import { Document } from '@langchain/core/documents';

@Injectable()
export class CohereRerankerService {
  constructor(private readonly config: ConfigService) {}

  async rerank(
    query: string,
    documents: Document[],
    limit: number,
  ): Promise<Document[]> {
    if (documents.length === 0) return [];

    const apiKey = this.config.get<string>('COHERE_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('COHERE_API_KEY is not configured');
    }

    return new CohereRerank({
      apiKey,
      topN: limit,
      model:
        this.config.get<string>('COHERE_RERANK_MODEL') ?? 'rerank-v4.0-pro',
    }).compressDocuments(documents, query);
  }
}
