import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { PdfService } from './loaders/pdf.loader';
import { OcrService } from './loaders/ocr.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { VectorService } from './vector/vector.service';
import { PgvectorService } from './vector/pgvector.client';
import { OpenaiService } from '../llm/openai/openai.service';

@Module({
  providers: [
    IngestService,
    PdfService,
    OcrService,
    TextSplitterService,
    VectorService,
    PgvectorService,
    OpenaiService,
  ],
  exports: [IngestService, VectorService],
})
export class IngestModule {}
