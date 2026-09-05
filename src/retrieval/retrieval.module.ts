import { Logger, Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { IngestModule } from '../ingest/ingest.module';
import { CohereRerankerService } from './cohere-reranker.service';

@Module({
  imports: [IngestModule],
  providers: [RetrievalService, CohereRerankerService, Logger],
  exports: [RetrievalService],
})
export class RetrievalModule {}
