import { ConsoleLogger, Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { IngestModule } from '../ingest/ingest.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [IngestModule],
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService, ConsoleLogger],
})
export class DocumentModule {}
