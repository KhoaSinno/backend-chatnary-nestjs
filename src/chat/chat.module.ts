import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { ChatConversationService } from './chat-conversation.service';
import { RagContextService } from './rag-context.service';

@Module({
  imports: [LlmModule, PrismaModule, RetrievalModule],
  controllers: [ChatController],
  providers: [ChatService, ChatConversationService, RagContextService],
  exports: [ChatService],
})
export class ChatModule {}
