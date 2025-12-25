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
import { JsonValue } from '@prisma/client/runtime/library';
import {
  RetrievalService,
  ScoredDocument,
} from '../retrieval/retrieval.service';

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
    private readonly vectorService: VectorService,
    private prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
  ) {}

  // -- PRIVATE CHAT FUNC --

  private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
    // -- VALIDATIONS -- TODO: update with joi
    console.log('ChatDto', JSON.stringify(chatDto));

    const historyNum = 6;

    // ---------------------------------------------------------
    // 1. RETRIEVAL & RERANK
    // ---------------------------------------------------------
    // Gọi hàm mới retrieveAndRerank
    const scoredDocs: ScoredDocument[] =
      await this.retrievalService.retrieveAndRerank(
        chatDto.message,
        chatDto.userId as string,
        chatDto.projectId,
      );

    // Xử lý trường hợp không có tài liệu nào
    if (!scoredDocs || scoredDocs.length === 0) {
      // Return with not save
      return {
        answer:
          'Tôi không tìm thấy thông tin nào phù hợp trong tài liệu của bạn để trả lời câu hỏi này.',
      };
    }

    // Debug: Log kết quả sau khi Rerank
    console.log(`📋 Top ${scoredDocs.length} Documents after Rerank:`);
    scoredDocs.slice(0, 3).forEach((doc, idx) => {
      console.log(
        `  ${idx + 1}. [Score=${doc.finalScore?.toFixed(3)}] ${doc.pageContent.substring(0, 50)}...`,
      );
    });

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
      // TODO: Fallback fileName:
      const fileName =
        doc.metadata['originalFileName'] ||
        `File_${fileId?.substring(0, 5) ?? 'Unknown'}`;
      const chunkIndex = doc.metadata.chunkIndex as number;
      const score = doc.finalScore || 0;

      if (!fileGroups.has(fileId)) {
        fileGroups.set(fileId, {
          fileId,
          fileName,
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

    // console.log('Final Context passed to LLM:\n', context);

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

      QUY TẮC: BẮT BUỘC TRÍCH DẪN (CITATION) :
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
      ${chatDto.message}
    `;

    // ---------------------------------------------------------
    // 4. HISTORY & LLM CALL (Logic giữ nguyên, chỉ thay đổi input)
    // ---------------------------------------------------------

    // Ensure chat exists or create it
    let chatId = chatDto.chatId;
    if (!chatId) {
      // ... Logic tạo chat mới ...
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

    const contentHistory: MessageType[] = (
      (historyMessages?.messages ?? []) as MessageType[]
    )
      .slice(-historyNum)
      .filter((m) => m.role && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT.trim() },
      ...contentHistory,
      { role: 'user', content: FINAL_USER_PROMPT.trim() },
    ];

    // Call LLM
    const response = await this.openaiService.getChatModel().invoke(messages);
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
    // 6. SAVE & RETURN
    // ---------------------------------------------------------
    const updatedMessages = [
      ...((historyMessages?.messages as MessageType[]) || []),
      { role: 'user', content: chatDto.message },
      {
        role: 'assistant',
        content: aiAnswer,
        citation: citations,
      },
    ];

    const chat = await this.prisma.chats.update({
      where: { id: chatId },
      data: { messages: updatedMessages },
    });

    return {
      answer: aiAnswer,
      citations,
      chat,
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
