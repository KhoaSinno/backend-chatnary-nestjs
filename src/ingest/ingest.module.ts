import { ConsoleLogger, Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { TextSplitterService } from './splitters/text-splitter';
import { VectorService } from './vector/vector.service';
import { PgvectorService } from './vector/pgvector.client';
import { CloudService } from './loaders/cloud.loader';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule, PrismaModule],
  providers: [
    IngestService,
    CloudService,
    TextSplitterService,
    VectorService,
    PgvectorService,
    ConsoleLogger,
  ],
  exports: [IngestService, VectorService],
})
export class IngestModule {}
