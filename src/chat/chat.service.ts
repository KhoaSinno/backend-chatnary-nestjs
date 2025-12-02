import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OpenaiService } from '../llm/openai/openai.service';
import { ChatDto } from './dto/chat.dto';
import { VectorService } from '../ingest/vector/vector.service';
import { PrismaService } from '../prisma/prisma.service';

type MessageType = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly vectorService: VectorService,
    private prisma: PrismaService,
  ) {}

  // async chatLite(chatDto: ChatDto): Promise<BaseMessage> {
  async chatLite(chatDto: ChatDto) {
    // TODO: Upgrade with flexible topK ~ Score threshold
    const topK = 5;

    // 1. Get relevant docs from vector DB
    const relateDocs = await this.vectorService.getRetrievals(
      chatDto.message,
      topK,
    );
    if (!relateDocs || relateDocs.length === 0) {
      return {
        answer: 'Tôi không tìm thấy thông tin trong tài liệu.',
        relateDocs: [],
      };
    }
    console.log('Related Docs: ', relateDocs);

    // 2. Build context
    const context = relateDocs
      .map((d, i) => `### Document ${i + 1}\n${d.pageContent}`)
      .join('\n\n');
    console.log('Context: ', context);

    const SYSTEM_PROMPT = `
      Bạn là một assistant chỉ trả lời dựa trên thông tin trong "Context".
      Nếu không thấy câu trả lời trong Context thì trả lời "Tôi không tìm thấy thông tin trong tài liệu."
      Tuyệt đối không được bịa, không lấy thông tin ngoài tài liệu. `;

    const FINAL_USER_PROMPT = `
          Context:

          ${context}

          ---

          Câu hỏi: ${chatDto.message}
      `;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT.trim() },
      { role: 'user', content: FINAL_USER_PROMPT.trim() },
    ];

    // 3. Call LLM
    const response = await this.openaiService.model.invoke(messages);

    return { response, relateDocs };

    //     const r = await this.retriever.get(projectId);
    // const chain = createSimpleRAG(this.openai.llm, r);
    // return chain.invoke({ question });
  }

  // -- Chat history --
  async chatHistory(userId: string, chatDto: ChatDto) {
    const topK = 5;
    const historyNum = 5;

    // 1. Get relevant docs from vector DB
    const relateDocs = await this.vectorService.getRetrievals(
      chatDto.message,
      topK,
    );
    if (!relateDocs || relateDocs.length === 0) {
      return {
        answer: 'Tôi không tìm thấy thông tin trong tài liệu.',
        relateDocs: [],
      };
    }
    console.log('Related Docs: ', relateDocs);

    // 2. Build context
    const context = relateDocs
      .map((d, i) => `### Document ${i + 1}\n${d.pageContent}`)
      .join('\n\n');
    console.log('Context: ', context);

    const SYSTEM_PROMPT = `
      Bạn là một assistant chỉ trả lời dựa trên thông tin trong "Context".
      Nếu không thấy câu trả lời trong Context thì trả lời "Tôi không tìm thấy thông tin trong tài liệu."
      Tuyệt đối không được bịa, không lấy thông tin ngoài tài liệu. `;

    const FINAL_USER_PROMPT = `
          Context:

          ${context}

          ---

          Câu hỏi: ${chatDto.message}
      `;
    // 3. Get history messages
    // Ensure chat exists or create it
    let chatId = chatDto.chatId;
    if (!chatId) {
      const created = await this.prisma.chats.create({
        data: {
          messages: [],
          userId: userId,
        },
      });
      chatId = created.id;
    }

    // Add userMessage to history
    await this.prisma.chats.update({
      where: { id: chatId },
      data: {
        messages: {
          push: { role: 'user', content: chatDto.message },
        },
      },
    });

    const historyMessages = await this.prisma.chats.findUnique({
      where: { id: chatId },
    });

    if (!historyMessages) {
      throw new Error('Chat not found');
    }

    console.log('clean mess', historyMessages.messages);
    const contentHistory: MessageType[] = (historyMessages.messages ?? [])
      .slice(-historyNum)
      .map((m: MessageType) => ({ role: m.role, content: m.content }));

    const messages = [
      ...contentHistory, // Last up to 5 messages
      { role: 'system', content: SYSTEM_PROMPT.trim() },
      { role: 'user', content: FINAL_USER_PROMPT.trim() },
    ];

    console.log('message var:', messages);

    // 3. Call LLM
    const response = await this.openaiService.model.invoke(messages);

    // 4. Save assistant response to history
    await this.prisma.chats.update({
      where: { id: chatId },
      data: {
        messages: {
          push: { role: 'assistant', content: response.content as string },
        },
      },
    });

    return { response, relateDocs, historyMessages };
  }

  // -- Get all user chats --
  async getAllUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { createdAt: 'desc' },
      where: { userId },
    });
  }

  // -- Get Chat by ID --
  async getChatById(id: string) {
    return await this.prisma.chats.findUnique({
      where: { id },
    });
  }

  // -- Update chat (title) --
  async update(userId: string, id: string, updateChatDto: UpdateChatDto) {
    return await this.prisma.chats.update({
      where: { id, userId },
      data: updateChatDto,
    });
  }

  // -- Delete chat --
  async remove(userId: string, id: string) {
    const chat = await this.prisma.chats.findUnique({
      where: { id },
    });
    if (!chat) throw new BadRequestException('Chat not found');
    if (chat.userId !== userId)
      throw new ForbiddenException('User Unauthorized!');

    return await this.prisma.chats.delete({
      where: { id },
    });
  }
}
