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
      chatDto.userId as string,
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
      .map((d) => `### "chunkIndex" ${d.metadata.chunkIndex}\n${d.pageContent}`)
      .join('\n\n');
    // console.log('Context: ', context);

    const SYSTEM_PROMPT = `
      Bạn là một assistant chỉ trả lời dựa trên thông tin trong "Context".
      Nếu không thấy câu trả lời trong Context thì trả lời "Tôi không tìm thấy thông tin trong tài liệu."
      Dựa trên "Context", hãy trích dẫn theo "chunkIndex" ở đầu đoạn "Context" và trả về theo format trích dẫn [#] trong câu trả lời của bạn để người dùng dễ dàng tham khảo tài liệu gốc.
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
  async chatHistory(chatDto: ChatDto) {
    // -- VALIDATIONS --
    // ... TODO: ...

    const topK = 5;
    const historyNum = 6;

    // 1. Get relevant docs from vector DB
    const relateDocs = await this.vectorService.getRetrievals(
      chatDto.message,
      topK,
      chatDto.userId as string,
      chatDto.projectId,
    );
    // Empty docs => return "Chatbot Don't know"
    if (!relateDocs || relateDocs.length === 0) {
      return {
        answer: 'Tôi không tìm thấy thông tin trong tài liệu.',
        relateDocs: [],
      };
    }
    // console.log('Related Docs: ', relateDocs);

    // 2. Clean context
    const context = relateDocs
      .map((d) => `### Chunk ${d.metadata.chunkIndex}\n${d.pageContent}`)
      .join('\n\n');
    // console.log('Context: ', context);

    const SYSTEM_PROMPT = `
      Bạn là một assistant chỉ trả lời dựa trên thông tin trong "Context".
      Nếu không thấy câu trả lời trong Context thì trả lời "Tôi không tìm thấy thông tin trong tài liệu."

      QUY TẮC TRÍCH DẪN (CITATION):

      1. Mỗi đoạn trong Context có dạng:
        ### Chunk {chunkIndex}
        Nội dung...

      2. Khi sử dụng thông tin từ chunk nào, bạn phải chèn citation
        theo format: [chunkIndex]
        ngay SAU câu, hoặc SAU bullet point sử dụng thông tin đó.

      3. Chỉ chèn citation khi thông tin thật sự đến từ chunk đó.
        Tuyệt đối không bịa, không chèn sai chunk.

      4. Tránh lặp lại citation không cần thiết (nếu cùng chunk được dùng
        liên tục trong nhiều câu liên tiếp, bạn có thể gộp cuối đoạn).

      5. KHÔNG bao giờ tạo chunkIndex mới.
        Bạn chỉ được dùng chunkIndex đã có trong Context.

      6. Câu trả lời phải rõ ràng, mạch lạc, và có citations chính xác
        theo đúng vị trí sử dụng thông tin.
      `;

    const FINAL_USER_PROMPT = `
          Context:

          ${context}

          ---

          Câu hỏi: ${chatDto.message}
      `;
    // 3. Get history messages
    // Ensure chat exists or create it
    let chatId = chatDto.chatId;
    if (
      !chatId ||
      chatId == null ||
      chatId === 'null' ||
      chatId === 'undefined'
    ) {
      const created = await this.prisma.chats.create({
        data: {
          messages: [],
          userId: chatDto.userId as string,
          projectId: chatDto.projectId as string,
        },
      });
      chatId = created.id;
    }

    // Add userMessage to history
    // await this.prisma.chats.update({
    //   where: { id: chatId },
    //   data: {
    //     messages: {
    //       push: { role: 'user', content: chatDto.message },
    //     },
    //   },
    // });

    const historyMessages = await this.prisma.chats.findUnique({
      where: { id: chatId },
    });

    if (!historyMessages) {
      throw new Error('Chat not found');
    }
    // console.log('clean mess', historyMessages.messages);

    const contentHistory: MessageType[] = (historyMessages.messages ?? [])
      .slice(-historyNum)
      .filter((m: any) => m && m.role && m.content) // Filter out invalid messages
      .map((m: any) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      }));

    const messages = [
      ...contentHistory, // Last up to 6 messages
      { role: 'system' as const, content: SYSTEM_PROMPT.trim() },
      { role: 'user' as const, content: FINAL_USER_PROMPT.trim() },
    ];

    console.log('message var:', messages);

    // 3. Call LLM
    const response = await this.openaiService.model.invoke(messages);

    const citations = relateDocs.map((doc) => ({
      index: doc.metadata.chunkIndex,
      snippet: doc.pageContent.substring(0, 200) + '...',
      text: doc.pageContent,
      fileId: doc.metadata.fileId,
      fileUrl: doc.metadata.fileUrl,
      page: doc.metadata.page,
      chunkIndex: doc.metadata.chunkIndex,
      startOffset: doc.metadata.startOffset,
      endOffset: doc.metadata.endOffset,
    }));

    // 4. Save assistant response to history
    // Get current messages and append new ones (avoid nested arrays)
    const currentChat = await this.prisma.chats.findUnique({
      where: { id: chatId },
      select: { messages: true },
    });

    const updatedMessages = [
      ...((currentChat?.messages as MessageType[]) || []),
      { role: 'user' as const, content: chatDto.message },
      {
        role: 'assistant' as const,
        content: response.content as string,
        citation: citations,
      },
    ];

    const chat = await this.prisma.chats.update({
      where: { id: chatId },
      data: {
        messages: updatedMessages,
      },
    });

    return {
      answer: response.content,
      citations,
      relateDocs,
      chat,
    };
  }

  // -- Get all user chats --
  async getAllUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId },
    });
  }

  // -- Get global user chats --
  async getGlobalUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
    });
  }

  // -- Get Chat by ID --
  async getChatById(userId: string, id: string) {
    return await this.prisma.chats.findUnique({
      where: { id, userId },
    });
  }

  // -- Update chat (title, or move in project) --
  async update(userId: string, id: string, updateChatDto: UpdateChatDto) {
    return await this.prisma.chats.update({
      where: { id, userId },
      data: updateChatDto,
      omit: { userId: true, messages: true },
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
      omit: { userId: true, messages: true },
    });
  }
}
