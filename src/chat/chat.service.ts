import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatDto } from './dto/chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatConversationService } from './chat-conversation.service';
import { RagContextService } from './rag-context.service';
import { ChatResponse, ChatStreamEvent, RagContext } from './chat.types';

const NO_DOCUMENTS_ANSWER =
  'Tôi không tìm thấy thông tin nào phù hợp trong tài liệu của bạn để trả lời câu hỏi này.';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly prisma: PrismaService,
    private readonly conversations: ChatConversationService,
    private readonly ragContext: RagContextService,
  ) {}

  async chatGlobal(chatDto: ChatDto): Promise<ChatResponse> {
    return this.answer(chatDto);
  }

  async chatHistory(chatDto: ChatDto): Promise<ChatResponse> {
    return this.answer(chatDto);
  }

  chatStream(chatDto: ChatDto): Observable<ChatStreamEvent> {
    return new Observable<ChatStreamEvent>((subscriber) => {
      void this.stream(chatDto, subscriber);
    });
  }

  async getGlobalUserChat(userId: string) {
    return this.prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
      omit: { userId: true },
    });
  }

  async getChatById(userId: string, chatId: string) {
    return this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });
  }

  async update(userId: string, id: string, updateChatDto: UpdateChatDto) {
    await this.assertChatOwner(userId, id);
    return this.prisma.chat.update({
      where: { id },
      data: updateChatDto,
      omit: { userId: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertChatOwner(userId, id);
    return this.prisma.chat.delete({
      where: { id },
      omit: { userId: true },
    });
  }

  private async answer(chatDto: ChatDto): Promise<ChatResponse> {
    const prepared = await this.prepare(chatDto);
    const answer = prepared.rag
      ? await this.llm.answer(prepared.rag.messages)
      : NO_DOCUMENTS_ANSWER;
    const citations = prepared.rag?.citations ?? [];

    await this.conversations.saveExchange({
      chatId: prepared.chatId,
      userMessage: chatDto.message,
      assistantMessage: answer,
      citations,
    });

    return { answer, citations, chatId: prepared.chatId };
  }

  private async stream(
    chatDto: ChatDto,
    subscriber: {
      next: (event: ChatStreamEvent) => void;
      complete: () => void;
    },
  ): Promise<void> {
    try {
      const prepared = await this.prepare(chatDto);
      if (!prepared.rag) {
        await this.conversations.saveExchange({
          chatId: prepared.chatId,
          userMessage: chatDto.message,
          assistantMessage: NO_DOCUMENTS_ANSWER,
          citations: [],
        });
        subscriber.next({
          data: {
            type: 'ERROR',
            content: NO_DOCUMENTS_ANSWER,
            chatId: prepared.chatId,
          },
        });
        return;
      }

      subscriber.next({
        data: {
          type: 'CITATIONS',
          content: prepared.rag.citations,
          chatId: prepared.chatId,
        },
      });

      let answer = '';
      for await (const token of this.llm.streamAnswer(prepared.rag.messages)) {
        answer += token;
        subscriber.next({ data: { type: 'TOKEN', content: token } });
      }

      await this.conversations.saveExchange({
        chatId: prepared.chatId,
        userMessage: chatDto.message,
        assistantMessage: answer,
        citations: prepared.rag.citations,
      });
      subscriber.next({ data: { type: 'DONE' } });
    } catch (error) {
      this.logger.error('Failed to stream chat response', error);
      subscriber.next({
        data: { type: 'ERROR', content: 'Có lỗi xảy ra khi xử lý.' },
      });
    } finally {
      subscriber.complete();
    }
  }

  private async prepare(
    chatDto: ChatDto,
  ): Promise<{ chatId: string; rag: RagContext | null }> {
    const userId = this.userIdFrom(chatDto);
    const chatId = await this.conversations.resolveChat({
      chatId: chatDto.chatId,
      userId,
      projectId: chatDto.projectId,
      firstMessage: chatDto.message,
    });
    const history = await this.conversations.recentHistory(chatId);
    const rag = await this.ragContext.build({
      question: chatDto.message,
      history,
      userId,
      projectId: chatDto.projectId,
    });
    return { chatId, rag };
  }

  private userIdFrom(chatDto: ChatDto): string {
    if (!chatDto.userId) throw new BadRequestException('User ID is required');
    return chatDto.userId;
  }

  private async assertChatOwner(userId: string, chatId: string): Promise<void> {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');
  }
}
