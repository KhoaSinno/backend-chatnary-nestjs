import { ConsoleLogger, Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { IngestModule } from '../ingest/ingest.module';
import { PrismaService } from '../prisma/prisma.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    IngestModule,
    BullModule.registerQueue({
      name: 'ingest-queue',
    }),
  ],
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService, ConsoleLogger],
  exports: [DocumentService],
})
export class DocumentModule { }
