import { ConsoleLogger, Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { TextSplitterService } from './splitters/text-splitter';
import { VectorService } from './vector/vector.service';
import { PgvectorService } from './vector/pgvector.client';
import { OpenaiService } from '../llm/openai/openai.service';
import { CloudService } from './loaders/cloud.loader';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    IngestService,
    CloudService,
    TextSplitterService,
    VectorService,
    PgvectorService,
    OpenaiService,
    ConsoleLogger,

  ],
  exports: [IngestService, VectorService],
})
export class IngestModule { }
