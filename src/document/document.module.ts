import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { IngestModule } from '../ingest/ingest.module';

@Module({
  imports: [IngestModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
