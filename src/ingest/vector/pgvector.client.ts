import { ConsoleLogger, Injectable } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { pgConfig, getPgConfigNeon } from '../../config/pg.config';

@Injectable()
export class PgvectorService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: ConsoleLogger,
  ) {}
  async initVectorStore() {
    // Use NeonDB if DATABASE_URL_NEON is set, otherwise use local
    const useNeon = !!process.env.DATABASE_URL_NEON;
    const config = useNeon ? getPgConfigNeon() : pgConfig;

    this.logger.log('🔧 PGVector Config:', {
      useNeon,
      connectionString: useNeon
        ? process.env.DATABASE_URL_NEON?.substring(0, 30) + '...'
        : `${process.env.POSTGRES_HOST || 'db'}:${process.env.POSTGRES_PORT || '5432'}`,
    });

    const vectorStore = await PGVectorStore.initialize(
      this.openaiService.embeddings(),
      config,
    );

    this.logger.log('✅ Connected to PGVector successfully!');
    return vectorStore;
  }
}
