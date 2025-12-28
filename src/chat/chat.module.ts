import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { OpenaiService } from '../llm/openai/openai.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [RetrievalModule],
  controllers: [ChatController],
  providers: [ChatService, OpenaiService, PrismaService],
})
export class ChatModule {}
