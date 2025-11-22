import { Injectable } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { pgConfig } from '../../config/pg.config';

@Injectable()
export class PgvectorService {
  constructor(private readonly openaiService: OpenaiService) {}
  async initVectorStore() {
    const vectorStore = await PGVectorStore.initialize(
      this.openaiService.embeddings(),
      pgConfig,
    );
    return vectorStore;
  }
}
