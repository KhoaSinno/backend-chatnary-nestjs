import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmMessage } from '../llm/llm.types';
import { Citation } from './chat.types';

const HISTORY_LIMIT = 6;

@Injectable()
export class ChatConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveChat(input: {
    chatId?: string;
    userId: string;
    projectId?: string;
    firstMessage: string;
  }): Promise<string> {
    if (input.chatId) {
      const chat = await this.prisma.chat.findFirst({
        where: { id: input.chatId, userId: input.userId },
        select: { id: true, projectId: true },
      });

      if (!chat || chat.projectId !== (input.projectId ?? null)) {
        throw new NotFoundException('Chat not found');
      }
      return chat.id;
    }

    if (input.projectId)
      await this.assertProjectAccess(input.userId, input.projectId);

    const chat = await this.prisma.chat.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        title: this.titleFrom(input.firstMessage),
      },
      select: { id: true },
    });
    return chat.id;
  }

  async recentHistory(chatId: string): Promise<LlmMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { role: true, content: true },
    });

    return messages.reverse().flatMap((message) => {
      if (
        message.role !== 'system' &&
        message.role !== 'user' &&
        message.role !== 'assistant'
      ) {
        return [];
      }
      return [{ role: message.role, content: message.content }];
    });
  }

  async saveExchange(input: {
    chatId: string;
    userMessage: string;
    assistantMessage: string;
    citations: Citation[];
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          chatId: input.chatId,
          role: 'user',
          content: input.userMessage,
        },
      }),
      this.prisma.chatMessage.create({
        data: {
          chatId: input.chatId,
          role: 'assistant',
          content: input.assistantMessage,
          metadata: { citations: input.citations },
        },
      }),
      this.prisma.chat.update({
        where: { id: input.chatId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  private async assertProjectAccess(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ userId }, { projectMembers: { some: { userId } } }],
      },
      select: { id: true },
    });

    if (!project)
      throw new ForbiddenException('You cannot access this project');
  }

  private titleFrom(message: string): string {
    return message.length > 50 ? `${message.slice(0, 50)}...` : message;
  }
}
