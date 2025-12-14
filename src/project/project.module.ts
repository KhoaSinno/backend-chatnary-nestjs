import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../llm/openai/openai.service';
import { IngestModule } from '../ingest/ingest.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [IngestModule, DocumentModule],
  controllers: [ProjectController],
  providers: [ProjectService, ChatService, PrismaService, OpenaiService],
})
export class ProjectModule {}
