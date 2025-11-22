import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { OpenaiService } from '../llm/openai/openai.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, OpenaiService],
})
export class ChatModule {}
