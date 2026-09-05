import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { IngestModule } from '../ingest/ingest.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { DocumentModule } from '../document/document.module';
import { ChatModule } from '../chat/chat.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ChatModule,
    DocumentModule,
    IngestModule,
    PrismaModule,
    RetrievalModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
