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
import { ContentBlock } from '@langchain/core/messages';
import { DocumentInterface } from '@langchain/core/documents';
import { JsonValue } from '@prisma/client/runtime/library';
import { RetrievalService } from '../retrieval/retrieval.service';

type MessageType = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CitationType = {
  index: number;
  snippet: string;
  text: string;
  fileId: string;
  fileUrl: string;
  page: number;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
};

// type ChatType = {
//   id: string;
//   title: string;
//   messages: JSON[];
//   createdAt: Date;
//   updatedAt: Date;
//   userId: string;
//   projectId: string | null;
// };

type BaseMessage =
  | {
      answer: string;
      relateDocs: never[];
      citations?: undefined;
      chat?: undefined;
    }
  | {
      answer: string | (ContentBlock | ContentBlock.Text)[];
      citations: CitationType[];
      relateDocs: [DocumentInterface<Record<string, any>>, number][];
      chat: {
        id: string;
        userId: string;
        title: string;
        messages: JsonValue[];
        createdAt: Date;
        updatedAt: Date;
        projectId: string | null;
      };
    };

@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly vectorService: VectorService,
    private prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
  ) {}

  // -- PRIVATE CHAT FUNC --

  private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
    // -- VALIDATIONS --
    // ... TODO: ...

    console.log('ChatDto', JSON.stringify(chatDto));

    const topK = 5;
    const historyNum = 6;

    // 1. Get relevant docs from vector DB
    // const relateDocs = await this.vectorService.getRetrievalsWithK(
    //   chatDto.message,
    //   topK,
    //   chatDto.userId as string,
    //   chatDto.projectId,
    // );
    // // Empty docs => return "Chatbot Don't know"
    // if (!relateDocs || relateDocs.length === 0) {
    //   return {
    //     answer: 'Tôi không tìm thấy thông tin trong tài liệu.',
    //     relateDocs: [],
    //   };
    // }

    // Get docs over 0.75 score threshold
    const relateDocs = await this.retrievalService.retrieveScore(
      chatDto.message,
      chatDto.userId as string,
      chatDto.projectId,
    );

    // console.log('Related Docs: ', relateDocs);

    // 2. Clean context
    const context = relateDocs
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([d, _]) => `### Chunk ${d.metadata.chunkIndex}\n${d.pageContent}`)
      .join('\n\n');
    console.log('Context: ', context);

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

    const historyMessages = await this.prisma.chats.findUnique({
      where: { id: chatId },
    });

    if (!historyMessages) {
      throw new Error('Chat not found');
    }
    // console.log('clean mess', historyMessages.messages);

    const contentHistory: MessageType[] = (
      (historyMessages.messages ?? []) as MessageType[]
    )
      .slice(-historyNum)
      .filter((m: MessageType) => m && m.role && m.content) // Filter out invalid messages
      .map((m: MessageType) => ({
        role: m.role,
        content: m.content,
      }));

    const messages = [
      ...contentHistory, // Last up to 6 messages
      { role: 'system' as const, content: SYSTEM_PROMPT.trim() },
      { role: 'user' as const, content: FINAL_USER_PROMPT.trim() },
    ];

    // console.log('message var:', messages);

    // 3. Call LLM
    const response = await this.openaiService.getChatModel().invoke(messages);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const citations: CitationType[] = relateDocs.map(([doc, _]) => ({
      index: doc.metadata.chunkIndex as number,
      snippet: doc.pageContent.substring(0, 200) + '...',
      text: doc.pageContent,
      fileId: doc.metadata.fileId as string,
      fileUrl: doc.metadata.fileUrl as string,
      page: doc.metadata.page as number,
      chunkIndex: doc.metadata.chunkIndex as number,
      startOffset: doc.metadata.startOffset as number,
      endOffset: doc.metadata.endOffset as number,
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

  // async chatLite(chatDto: ChatDto): Promise<BaseMessage> {
  async chatLite(chatDto: ChatDto) {
    return await this.chatUtil(chatDto);
  }

  // -- Chat history --
  async chatHistory(chatDto: ChatDto) {
    // -- VALIDATIONS --
    // ... TODO: ...

    return await this.chatUtil(chatDto);
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
