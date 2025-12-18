import { Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { IngestModule } from '../ingest/ingest.module';

@Module({
  imports: [IngestModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
