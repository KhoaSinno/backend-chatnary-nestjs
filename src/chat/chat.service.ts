import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OpenaiService } from '../llm/openai/openai.service';
import { ChatDto } from './dto/chat.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ContentBlock } from '@langchain/core/messages';
import {
  RetrievalService,
  ScoredDocument,
} from '../retrieval/retrieval.service';
import * as path from 'node:path';

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
  startOffset: number;
  endOffset: number;
  score?: number;
  projectId: string;
};

type BaseMessage =
  | {
    answer: string;
    citations?: undefined;
    chat?: undefined;
  }
  | {
    answer: string | (ContentBlock | ContentBlock.Text)[];
    citations: CitationType[];
    // chat: {
    //   id: string;
    //   userId: string;
    //   title: string;
    //   messages: JsonValue[];
    //   createdAt: Date;
    //   updatedAt: Date;
    //   projectId: string | null;
    // };
    chatId: string;
  };

// 1. Grouping: Gom các chunk về theo từng File
// Mục đích: Không để chunk của file A nằm xen kẽ file B, gây lú ngữ cảnh.
type FileGroup = {
  fileId: string;
  fileName: string; // Để hiển thị cho LLM hiểu
  maxScore: number; // Điểm cao nhất mà file này đạt được (để đánh giá độ quan trọng của cả file)
  chunks: { content: string; index: number; score: number }[];
};
@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
  ) { }

  // -- CORE CHAT FUNCTIONALITY --
  private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
    const MAX_HISTORY_MESSAGES = 6;

    // Ensure chat exists
    const chatId = await this.ensureChatExists(chatDto.chatId, chatDto);

    // Rewrite question to standalone if chatId provided
    let finalQuestion = chatDto.message;

    // Load history from ChatMessage table (not JSON)
    const historyMessages = await this.prisma.chatMessage.findMany({
      where: { chatId: chatId },
      orderBy: { createdAt: 'asc' },
      take: MAX_HISTORY_MESSAGES,
    });

    const contentHistory: MessageType[] = historyMessages
      .filter((m) => m.role && m.content)
      .map((m) => ({ role: m.role as MessageType['role'], content: m.content }));

    if (contentHistory.length > 0) {
      finalQuestion = await this.createStandaloneQuestion(
        contentHistory,
        chatDto.message,
      );
    }

    // -- HELPER: Call Retrieve and Rerank, sorted doc's score--
    const scoredDocs = await this.callRetrieveAndRerank(
      finalQuestion,
      chatDto.userId as string,
      chatDto.projectId as string,
    );

    // Handle case when no documents found
    // Xử lý trường hợp không có tài liệu nào
    if (!scoredDocs || scoredDocs.length === 0) {
      // Return with not save
      return {
        answer:
          'Tôi không tìm thấy thông tin nào phù hợp trong tài liệu của bạn để trả lời câu hỏi này.',
      };
    }


    // -- HELPER: Create File Groups from Scored Docs --
    const fileGroups = this.createFileGroups(scoredDocs);

    // -- HELPER: Create Context from File Groups --
    const contextStr = this.createContextFromFileGroups(fileGroups);


    // -- HELPER: Create final inputLlm for LLM --
    const inputLlm = this.createFinalInputLlm(
      contextStr,
      chatDto.message,
      contentHistory,
    );

    // Call LLM
    const response = await this.openaiService.getChatModel().invoke(inputLlm);
    const aiAnswer = response.content as string;

    // ---------------------------------------------------------
    // 5. PREPARE CITATIONS (FE will controll it)
    // ---------------------------------------------------------
    // Map từ ScoredDocument sang CitationType
    const citations: CitationType[] = scoredDocs.map((doc) => ({
      index: doc.metadata.chunkIndex as number,
      snippet: doc.pageContent.substring(0, 150) + '...', // Preview ngắn
      text: doc.pageContent,
      fileId: doc.metadata.fileId as string,
      // Fallback các trường metadata nếu thiếu
      fileUrl: (doc.metadata.fileUrl as string) || '',
      page: (doc.metadata.page as number) || 0,
      score: doc.finalScore, // Trả về score để FE có thể hiện độ tin cậy
      startOffset: (doc.metadata.startOffset as number) || 0,
      endOffset: (doc.metadata.endOffset as number) || 0,
      projectId: doc.metadata.projectId as string,
    }));

    // ---------------------------------------------------------
    // 6. SAVE MESSAGES TO ChatMessage TABLE
    // ---------------------------------------------------------
    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        chatId: chatId!,
        role: 'user',
        content: chatDto.message,
      },
    });

    // Save assistant message with citations
    await this.prisma.chatMessage.create({
      data: {
        chatId: chatId!,
        role: 'assistant',
        content: aiAnswer,
        metadata: { citations },
      },
    });

    return {
      answer: aiAnswer,
      citations,
      chatId: chatId!,
    };
  }

  // -- PUBLIC CHAT FUNC --
  async chatGlobal(chatDto: ChatDto) {
    return await this.chatUtil(chatDto);
  }

  // -- Chat history --
  async chatHistory(chatDto: ChatDto) {
    // -- VALIDATIONS --
    // ... TODO: ...

    return await this.chatUtil(chatDto);
  }

  // -- HELPER FUNC FOR CHAT MANAGEMENT --
  private createFinalInputLlm(
    context: string,
    message: string,
    contentHistory: MessageType[],
  ) {
    // ---------------------------------------------------------
    // 3. PROMPT ENGINEERING (Tinh chỉnh cho Rerank)
    // ---------------------------------------------------------
    const SYSTEM_PROMPT = `
      Bạn là trợ lý AI chuyên nghiệp, nhiệm vụ là trả lời câu hỏi dựa trên các tài liệu được cung cấp.

      HƯỚNG DẪN XỬ LÝ THÔNG TIN:
      1. **Ưu tiên**: Các tài liệu được liệt kê đầu tiên trong Context là quan trọng nhất (đã được xếp hạng). Hãy dùng chúng làm cơ sở chính.
      2. **Tổng hợp**: Nếu thông tin nằm rải rác ở nhiều tài liệu, hãy tổng hợp lại một cách mạch lạc.
      3. **Mâu thuẫn**: Nếu các tài liệu mâu thuẫn nhau, hãy tin tưởng tài liệu có "Độ phù hợp" cao hơn (nằm trên cùng).
      4. **Trung thực**: Nếu không tìm thấy thông tin để trả lời, hãy nói "Tài liệu hiện tại không chứa thông tin về vấn đề này". Đừng bịa đặt.
      5. Nếu câu hỏi độc lập (rephrased) có vẻ sai lệch so với ý định ban đầu, hãy ưu tiên trả lời theo ngữ cảnh tài liệu tìm được.

      QUY TẮC: BẮT BUỘC TRÍCH DẪN (CITATION) :
      - Đã trích dẫn thì phải chính xác
      - Mọi thông tin đưa ra phải có dẫn chứng.
      - Sử dụng format **[#index]** ngay sau câu thông tin liên quan.
      - Ví dụ: "Doanh thu năm nay tăng 20% [#12]"
      - Chỉ sử dụng số index đã có trong context (Trích đoạn #...).
    `;

    const FINAL_USER_PROMPT = `
      CONTEXT TÀI LIỆU:
      ${context}

      ---
      CÂU HỎI CỦA TÔI: 
      ${message}
    `;

    // ---------------------------------------------------------
    // 4. HISTORY & LLM CALL (Logic giữ nguyên, chỉ thay đổi input)
    // ---------------------------------------------------------

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT.trim() },
      ...contentHistory,
      { role: 'user', content: FINAL_USER_PROMPT.trim() },
    ];

    return messages;
  }

  // -- CREATE CONTEXT --
  private createContextFromFileGroups(fileGroups: Map<string, FileGroup>) {
    // Sắp xếp các FILE theo độ quan trọng giảm dần
    const sortedFiles = Array.from(fileGroups.values()).sort(
      (a, b) => b.maxScore - a.maxScore,
    );

    // Tạo chuỗi Context mạch lạc
    const contextParts: string[] = [];

    sortedFiles.forEach((group) => {
      // Trong 1 file, sắp xếp chunk theo thứ tự xuất hiện (index) để đọc như văn bản thường
      group.chunks.sort((a, b) => a.index - b.index);

      // Header rõ ràng cho LLM nhận biết nguồn
      let fileContext = `--- NGUỒN TÀI LIỆU: "${group.fileName}" (Độ phù hợp: ${(group.maxScore * 100).toFixed(0)}%) ---\n`;

      fileContext += group.chunks
        .map((c) => `(Trích đoạn #${c.index}): ${c.content}`) // Format: (Trích đoạn #1): Nội dung
        .join('\n\n');

      contextParts.push(fileContext);
    });

    const context = contextParts.join('\n\n');

    return context;
  }

  // -- CREATE FILE GROUPS --
  private createFileGroups(
    scoredDocs: ScoredDocument[],
  ): Map<string, FileGroup> {
    // ---------------------------------------------------------
    // 2. CONTEXT CONSTRUCTION (Learn Logic from "NotebookLM")
    // ---------------------------------------------------------
    // Gom nhóm chunk theo File để LLM hiểu ngữ cảnh của từng tài liệu
    const fileGroups = new Map<string, FileGroup>();

    // Lưu ý: scoredDocs bây giờ là mảng object, không phải [doc, score] nữa
    scoredDocs.forEach((doc) => {
      // Lọc nhiễu cơ bản
      if (doc.pageContent.length < 30) return;

      const fileId = doc.metadata.fileId as string;
      const fileName =
        doc.metadata['originalFileName'] ||
        `File_${fileId?.substring(0, 5) ?? 'Unknown'}`;
      const chunkIndex = doc.metadata.chunkIndex as number;
      const score = doc.finalScore || 0;

      if (!fileGroups.has(fileId)) {
        fileGroups.set(fileId, {
          fileId,
          // remove extension from file name
          fileName: path.parse(fileName).name,
          maxScore: 0,
          chunks: [],
        });
      }

      const group = fileGroups.get(fileId)!;
      // Cập nhật maxScore để biết file nào quan trọng nhất
      // TODO: Nên lấy trung bình score của tất cả chunk trong file thay vì maxScore?
      if (score > group.maxScore) group.maxScore = score;

      group.chunks.push({
        content: doc.pageContent,
        index: chunkIndex,
        score: score,
      });
    });

    return fileGroups;
  }

  // -- CREATE SCORED DOCS --
  private async callRetrieveAndRerank(
    finalQuestion: string,
    userId: string,
    projectId?: string,
  ) {
    const scoredDocs: ScoredDocument[] =
      await this.retrievalService.retrieveAndRerank(
        finalQuestion,
        userId,
        projectId,
      );

    return scoredDocs;
  }

  // -- HELPER: Ensure chat exists or create it --
  private async ensureChatExists(chatId: string | undefined, chatDto: ChatDto) {
    let chatIdLocal = chatId;
    if (!chatId) {
      const created = await this.prisma.chat.create({
        data: {
          userId: chatDto.userId as string,
          projectId: chatDto.projectId as string,
          title:
            chatDto.message.length > 50
              ? chatDto.message.slice(0, 50) + '...'
              : chatDto.message,
        },
      });
      chatIdLocal = created.id;
    }
    return chatIdLocal;
  }

  // -- HELPER: Rephrase question to standalone --
  private async createStandaloneQuestion(
    chatHistory: MessageType[],
    question: string,
  ) {
    if (!chatHistory || chatHistory.length === 0) return question;

    const historyContext = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const rephrasePrompt = `
    Dựa trên lịch sử trò chuyện và câu hỏi mới nhất của người dùng, hãy viết lại câu hỏi mới sao cho nó trở thành một câu hỏi ĐỘC LẬP, đầy đủ ngữ nghĩa mà không cần đọc lịch sử vẫn hiểu được.
    KHÔNG trả lời câu hỏi, chỉ viết lại hoặc giữ nguyên nếu đã rõ ràng.
    Ví dụ: 
    - History: "Ai là hiệu trưởng?" -> Current: "Ông ấy bao nhiêu tuổi?" -> Output: "Hiệu trưởng trường hiện tại bao nhiêu tuổi?"
    `;

    // Call llm
    const messages = [
      { role: 'system', content: rephrasePrompt.trim() },
      {
        role: 'user',
        content: `HISTORY:\n${historyContext}\n\nCURRENT QUESTION:\n${question}`,
      },
    ];

    const rewrittenQuestion = await this.openaiService
      .getRewriteModel()
      .invoke(messages)
      .then((res) => res.content as string);

    return rewrittenQuestion;
  }

  // -- Get all user chats --
  // async getAllUserChat(userId: string) {
  //   return await this.prisma.chat.findMany({
  //     orderBy: { updatedAt: 'desc' },
  //     where: { userId },
  //     omit: { messages: true, userId: true },
  //   });
  // }

  // -- Get global user chats --
  async getGlobalUserChat(userId: string) {
    return await this.prisma.chat.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
      omit: { userId: true },
    });
  }

  // -- Get Chat by ID --
  async getChatById(userId: string, chatId: string) {
    return await this.prisma.chat.findUnique({
      where: { id: chatId, userId },
    });
  }

  // -- Update chat (title, or move in project) --
  async update(userId: string, id: string, updateChatDto: UpdateChatDto) {
    return await this.prisma.chat.update({
      where: { id, userId },
      data: updateChatDto,
      omit: { userId: true },
    });
  }

  // -- Delete chat --
  async remove(userId: string, id: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id },
    });
    if (!chat) throw new BadRequestException('Chat not found');
    if (chat.userId !== userId)
      throw new ForbiddenException('User Unauthorized!');

    return await this.prisma.chat.delete({
      where: { id },
      omit: { userId: true },
    });
  }
}
