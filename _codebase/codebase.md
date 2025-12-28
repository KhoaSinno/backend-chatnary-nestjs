# Project Export

## Project Statistics

- Total files: 15

## Folder Structure

```
prisma
  schema.prisma
src
  chat
    chat.controller.ts
    chat.module.ts
    chat.service.ts
    dto
      chat.dto.ts
      update-chat.dto.ts
  retrieval
    retrieval.module.ts
    retrieval.service.ts
  ingest
    ingest.module.ts
    ingest.service.ts
    loaders
      ocr.loader.ts
      pdf.loader.ts
    splitters
      text-splitter.ts
    vector
      pgvector.client.ts
      vector.service.ts

```

### prisma\schema.prisma

*(Unsupported file type)*

### src\chat\chat.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatDto } from './dto/chat.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // -- CHAT LITE --
  @Post('/global')
  chatGlobal(
    @Req() req: { user: JwtPayloadWithRt },
    @Query('chatId') chatId: string | undefined,
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    chatDto.chatId = chatId;
    return this.chatService.chatGlobal(chatDto);
  }

  // -- CHAT HISTORY --
  @Post('/')
  chatHistory(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    return this.chatService.chatHistory(chatDto);
  }

  // -- GET CHAT DETAIL BY ID --
  @Get(':id')
  getChatById(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    return this.chatService.getChatById(req.user.userId, id);
  }

  // -- GET ALL USER CHATS --
  @Get('/user/all')
  getAllUserChat(@Req() req: { user: JwtPayloadWithRt }) {
    return this.chatService.getAllUserChat(req.user.userId);
  }

  // -- GET GLOBAL USER CHATS --
  @Get('/user/global')
  getGlobalUserChat(@Req() req: { user: JwtPayloadWithRt }) {
    return this.chatService.getGlobalUserChat(req.user.userId);
  }

  // -- UPDATE CHAT: TITLE OR MOVE IN PROJECT --
  @Patch('/user/:id')
  update(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatService.update(req.user.userId, id, updateChatDto);
  }

  // -- DELETE CHAT --
  @Delete('/user/:id')
  remove(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    return this.chatService.remove(req.user.userId, id);
  }
}

```

### src\chat\chat.module.ts

```ts
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

```

### src\chat\chat.service.ts

```ts
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
      omit: { messages: true, userId: true },
    });
  }

  // -- Get global user chats --
  async getGlobalUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
      omit: { messages: true, userId: true },
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

```

### src\chat\dto\chat.dto.ts

```ts
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';
export class ChatDto {
  @IsString({ message: 'userId must be a string' })
  userId?: string;
  @IsString({ message: 'chatId must be a string' })
  chatId?: string;
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  @IsNotEmpty({ message: 'message should not be empty' })
  @IsString({ message: 'message must be a string' })
  @MaxLength(1000, { message: 'message must not exceed 1000 characters' })
  message: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 100 characters' })
  title?: string;
}

```

### src\chat\dto\update-chat.dto.ts

```ts
import { IsString } from 'class-validator';

export class UpdateChatDto {
  @IsString({ message: 'title must be a string' })
  title?: string;

  @IsString({ message: 'projectId must be a string' })
  projectId?: string | null;
}

```

### src\retrieval\retrieval.module.ts

```ts
import { Logger, Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { IngestModule } from '../ingest/ingest.module';

@Module({
  imports: [IngestModule],
  providers: [RetrievalService, Logger],
  exports: [RetrievalService],
})
export class RetrievalModule {}

```

### src\retrieval\retrieval.service.ts

```ts
import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';

type MetadataDoc = {
  fileId?: string;
  projectId?: string;
  userId?: string;
  fileUrl?: string;

  endOffset?: number;
  startOffset?: number;
  chunkIndex?: number;
  page?: number;
  title?: string;
  originalFileName?: string;
};

export interface ScoredDocument {
  pageContent: string;
  metadata: MetadataDoc;
  vectorScore: number;
  keywordScore?: number;
  finalScore?: number;
}

@Injectable()
export class RetrievalService {
  // Lấy nhiều hơn để lọc kỹ hơn (Wide Net)
  private readonly RETRIEVE_K = 100;
  // Chỉ lấy top kết quả chất lượng nhất gửi cho LLM
  private readonly FINAL_K = 8;

  // Trọng số cho Hybrid search (Fire tune base on real data)
  private readonly WEIGHT_VECTOR = 0.3;
  private readonly WEIGHT_KEYWORD = 0.7;

  constructor(
    private vectorService: VectorService,
    private logger: Logger,
  ) {}

  /**
   * Pipeline tìm kiếm chuyên nghiệp:
   * 1. Retrieve (Vector Search)
   * 2. Rerank (Keyword Boosting / Cross-Encoder)
   * 3. Cutoff (Cut Top K)
   */
  async retrieveAndRerank(query: string, userId: string, projectId?: string) {
    // BƯỚC 1: RETRIEVAL - Lấy tập ứng viên rộng
    const rawDocs = await this.vectorService.getRetrievalsWithScore(
      query,
      this.RETRIEVE_K,
      userId,
      projectId,
    );

    if (!rawDocs.length) return [];

    // Chuẩn hóa documents sang format dễ xử lý
    let candidates: ScoredDocument[] = rawDocs.map(([doc, score]) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      vectorScore: score, // Giả sử score càng cao càng tốt (Cosine Similarity)
    }));

    // BƯỚC 2: RERANKING - Tính điểm từ khóa (Keyword Boosting)
    // Đây là Core quality để tìm chính xác thông tin hỗn tạp
    candidates = this.performKeywordReranking(query, candidates);

    // BƯỚC 3: SORTING & SELECTION
    // Sắp xếp theo điểm số cuối cùng (Final Score)
    candidates.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    // Log để debug chất lượng tìm kiếm
    this.logSearchQuality(query, candidates);

    // Trả về top kết quả tốt nhất
    return candidates.slice(0, this.FINAL_K);
  }

  /**
   * THUẬT TOÁN RERANK MỚI CHO TIẾNG VIỆT
   * Ưu tiên: Cụm từ chính xác (Bigram/Phrase) > Từ đơn (Unigram)
   */
  private performKeywordReranking(
    query: string,
    docs: ScoredDocument[],
  ): ScoredDocument[] {
    const queryLower = query.toLowerCase().trim();

    // 1. Tách từ đơn (Unigrams) - KHÔNG lọc độ dài nữa
    const unigrams = queryLower.split(/\s+/);

    // 2. Tạo cụm từ (Bigrams) để bắt ngữ cảnh.
    // Ví dụ: "miễn giảm học phí" -> ["miễn giảm", "giảm học", "học phí"]
    const bigrams: string[] = [];
    for (let i = 0; i < unigrams.length - 1; i++) {
      bigrams.push(`${unigrams[i]} ${unigrams[i + 1]}`);
    }

    return docs.map((doc) => {
      const contentLower = doc.pageContent.toLowerCase();
      let score = 0;

      // -- A. Điểm cho cụm từ (Quan trọng nhất - Trọng số cao) --
      // Nếu tìm thấy "miễn giảm" hoặc "học phí", cộng điểm rất lớn
      bigrams.forEach((gram) => {
        if (contentLower.includes(gram)) {
          score += 0.5; // Mỗi bigram khớp cộng 0.5 điểm
        }
      });

      // -- B. Điểm cho từ đơn (Bổ trợ) --
      unigrams.forEach((term) => {
        if (contentLower.includes(term)) {
          score += 0.1; // Mỗi từ đơn khớp cộng 0.1 điểm
        }
      });

      // -- C. Boost đặc biệt nếu khớp nguyên câu query (Hiếm nhưng chất) --
      if (contentLower.includes(queryLower)) {
        score += 2.0;
      }

      // Normalization: Kéo điểm về khoảng [0, 1] để không lấn át Vector quá đà
      // (Dùng hàm sigmoid hoặc min/max đơn giản)
      const normalizedKeywordScore = Math.min(score, 2.0) / 2.0; // Max là 1.0

      doc.keywordScore = normalizedKeywordScore;

      // Công thức tính Final Score
      doc.finalScore =
        doc.vectorScore * this.WEIGHT_VECTOR +
        normalizedKeywordScore * this.WEIGHT_KEYWORD;

      return doc;
    });
  }

  /**
   * Thuật toán tính điểm Keyword đơn giản nhưng hiệu quả (BM25 Simplified)
   * Tăng điểm cho các document chứa chính xác từ khóa trong query
   */
  // private performKeywordReranking(
  //   query: string,
  //   docs: ScoredDocument[],
  // ): ScoredDocument[] {
  //   // Tách query thành các token (từ đơn), loại bỏ từ quá ngắn
  //   const queryTerms = query
  //     .toLowerCase()
  //     .split(/\s+/)
  //     .filter((w) => w.length > 2); // TODO: User chat: "IT là gì, AI là gì?, IC là gì? " -> loại bỏ luôn key thì toang

  //   if (queryTerms.length === 0) return docs;

  //   return docs.map((doc) => {
  //     const contentLower = doc.pageContent.toLowerCase();
  //     let keywordMatches = 0;

  //     // Đếm số lượng từ khóa xuất hiện trong đoạn văn
  //     queryTerms.forEach((term) => {
  //       // Sử dụng regex để tìm từ chính xác (word boundary) tránh match nhầm
  //       // Ví dụ: tìm "tài" không nên match "tài liệu"
  //       const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'g');
  //       const matches = contentLower.match(regex);
  //       if (matches) {
  //         keywordMatches += matches.length;
  //       }
  //       // Fallback: nếu không tìm thấy chính xác, tìm chuỗi con (cho tiếng Việt)
  //       else if (contentLower.includes(term)) {
  //         keywordMatches += 0.5;
  //       }
  //     });

  //     // Tính điểm keyword (Normalization đơn giản)
  //     // Giới hạn điểm keyword boost tối đa là 1.0 để không lấn át hoàn toàn Vector
  //     const keywordScore = Math.min(keywordMatches * 0.1, 1.0);

  //     // CÔNG THỨC HYBRID SCORE
  //     // Kết hợp sức mạnh của Vector (hiểu ngữ nghĩa) và Keyword (độ chính xác)
  //     doc.keywordScore = keywordScore;
  //     doc.finalScore =
  //       doc.vectorScore * this.WEIGHT_VECTOR +
  //       keywordScore * this.WEIGHT_KEYWORD;

  //     return doc;
  //   });
  // }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private logSearchQuality(query: string, sortedDocs: ScoredDocument[]) {
    const topDoc = sortedDocs[0];
    this.logger.debug({
      msg: 'Rerank Results',
      query,
      topResult: {
        preview: topDoc?.pageContent.substring(0, 50),
        vScore: topDoc?.vectorScore.toFixed(3),
        kScore: topDoc?.keywordScore?.toFixed(3),
        final: topDoc?.finalScore?.toFixed(3),
      },
    });
  }
}

```

### src\ingest\ingest.module.ts

```ts
import { ConsoleLogger, Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { PdfService } from './loaders/pdf.loader';
import { OcrService } from './loaders/ocr.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { VectorService } from './vector/vector.service';
import { PgvectorService } from './vector/pgvector.client';
import { OpenaiService } from '../llm/openai/openai.service';

@Module({
  providers: [
    IngestService,
    PdfService,
    OcrService,
    TextSplitterService,
    VectorService,
    PgvectorService,
    OpenaiService,
    ConsoleLogger,
  ],
  exports: [IngestService, VectorService],
})
export class IngestModule {}

```

### src\ingest\ingest.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { VectorService } from './vector/vector.service';
import { PdfService } from './loaders/pdf.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { OcrService } from './loaders/ocr.loader';
// import * as fs from 'fs';

@Injectable()
export class IngestService {
  constructor(
    private pdfService: PdfService,
    private ocrService: OcrService,
    private textSplitterService: TextSplitterService,
    private vectorService: VectorService,
  ) {}
  /* 
    1. Load document (Text/PDF/Image)
    2. Split text into chunks
    3. Create embeddings => Store embeddings in vector database
    */
  async ingestDocument(
    filePath: string,
    fileId: string,
    userId: string,
    projectId?: string,
    originalFileName?: string,
  ) {
    const pdfPages = await this.pdfService.load(filePath);

    // OCR handle
    let pagesToSplit = pdfPages;
    if (
      !pdfPages ||
      pdfPages.length === 0 ||
      pdfPages.every((p) => p.text.trim().length < 5)
    ) {
      console.log('📄 PDF scanned → OCR');
      const ocrResult = await this.ocrService.load(filePath);
      pagesToSplit = [{ page: 1, text: ocrResult.text }];
    }

    // 2. Split text into chunks
    const chunks = this.textSplitterService.splitPdfPages(pagesToSplit);

    const metadata = {
      fileId,
      projectId,
      userId,
      fileUrl: filePath,
      originalFileName,
    };

    console.log(
      '💾 Saving to vector store with metadata:',
      JSON.stringify(metadata),
    );
    console.log('📦 Total chunks:', chunks.length);

    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata,
    });

    // Return number of chunks processed
    return chunks.length;
  }
}

```

### src\ingest\loaders\ocr.loader.ts

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import sharp from 'sharp';

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private workers: Tesseract.Worker[] = [];
  private readonly WORKER_COUNT = 8; // Số workers song song

  async onModuleInit() {
    console.log('🔧 Initializing OCR worker pool...');
    // Tạo worker pool để OCR song song
    const workerPromises = Array.from(
      { length: this.WORKER_COUNT },
      async () => {
        const worker = await Tesseract.createWorker('vie', 1, {
          logger: () => {}, // Tắt log verbose
        });

        // Cấu hình tối ưu cho tiếng Việt
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Tự động detect layout
          tessedit_char_whitelist: '', // Cho phép tất cả ký tự
          preserve_interword_spaces: '1',
          // Cải thiện nhận diện dấu tiếng Việt
          textord_heavy_nr: '1',
          // Giảm noise
          edges_use_new_outline_complexity: '1',
        });

        return worker;
      },
    );

    this.workers = await Promise.all(workerPromises);
    console.log(`✅ Initialized ${this.workers.length} OCR workers`);
  }

  private getWorker(index: number): Tesseract.Worker {
    return this.workers[index % this.workers.length];
  }

  // Handle
  async load(filePath: string) {
    try {
      const ext = filePath.toLowerCase();
      const isPdf = ext.endsWith('.pdf');

      // Supported image formats for OCR
      const isImage = /\.(jpg|jpeg|png|bmp|tiff|webp)$/i.test(ext);

      // --- CASE 1: Image files only ---
      if (isImage) {
        const result = await this.workers[0].recognize(filePath);
        return { text: result.data.text, confidence: result.data.confidence };
      }

      // --- CASE 2: Non-PDF and non-image files (e.g., .txt) ---
      if (!isPdf) {
        throw new Error(
          `Unsupported file type for OCR. Only PDF and images are supported. Got: ${path.extname(filePath)}`,
        );
      }

      // --- CASE 3: PDF files ---
      // -- Get pageNumber --
      const pdfBuffet = fs.readFileSync(filePath);
      const pdfInfo = await pdf(pdfBuffet);

      if (pdfInfo.text && pdfInfo.text.trim().length > 20) {
        // Return if PDF has embedded text
        console.log('📄 PDF has embedded text, skipping OCR.');
        return { text: pdfInfo.text };
      }

      const pageCount = pdfInfo.numpages;

      if (!pageCount || pageCount === 0) return { text: '' };

      // Create: "uploads/temp" if not exists
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // List pages: convert(1) => page 1
      console.log('📄 PDF scanned → OCR');
      const convert = fromPath(filePath, {
        density: 200, // Tăng DPI để OCR chính xác hơn (từ 200 lên 300)
        saveFilename: `ocr-${Date.now()}`, // Temporary filename
        savePath: tempDir,
        format: 'png',
        width: 1700, // Tăng kích thước để giữ chi tiết (từ 1200 lên 2400)
        height: 2400,
      });

      const convertPromises: Promise<any>[] = [];
      for (let page = 1; page <= pageCount; page++) {
        convertPromises.push(convert(page, { responseType: 'image' }));
      }
      const pageImages = await Promise.all(convertPromises);
      console.log('✅ PDF converted to images');

      // 5️⃣ OCR tất cả trang song song với worker pool
      console.log(`🔍 Running OCR on ${pageCount} pages...`);

      const ocrPromises = pageImages.map(async (img: any, index: number) => {
        const worker = this.getWorker(index);

        const prep = await this.preprocessImage(img.path);

        const res = await worker.recognize(prep);

        return {
          text: res.data.text,
          path: img.path,
          prepPath: prep, // Lưu đường dẫn file preprocessed
          page: index + 1,
        };
      });

      const results = await Promise.all(ocrPromises);
      console.log('✅ OCR completed');

      // 6️⃣ Ghép text theo thứ tự trang
      const allText = results
        .sort((a, b) => a.page - b.page)
        .map((r) => this.normalizeText(r.text))
        .join('\n');

      // 7️⃣ Xoá file ảnh tạm (cả gốc và preprocessed)
      results.forEach((r) => {
        try {
          // Xóa file gốc
          if (fs.existsSync(r.path)) {
            fs.unlinkSync(r.path);
          }
          // Xóa file preprocessed
          if (r.prepPath && fs.existsSync(r.prepPath)) {
            fs.unlinkSync(r.prepPath);
          }
        } catch (error) {
          console.warn(`⚠️ Cannot delete temp file: ${r.path}`, error.message);
        }
      });

      return { text: allText };
    } catch (error) {
      console.log('OCR Error: ', error);
      throw error;
    }
  }

  // Normalize text: nối từ ngắt dòng, gộp khoảng trắng, sửa lỗi OCR phổ biến tiếng Việt
  private normalizeText(text: string): string {
    const normalized = text
      // Nối từ bị ngắt dòng
      .replace(/-\s*\n\s*/g, '')
      // Giữ nguyên xuống dòng đơn, chỉ gộp xuống dòng nhiều
      .replace(/\n{3,}/g, '\n\n')
      // Chuẩn hóa space (không gộp xuống dòng)
      .replace(/[ \t]+/g, ' ')
      // Remove brand watermarks
      .replace(/Scanned with[\s\S]*$/gi, '')
      // Sửa lỗi OCR phổ biến tiếng Việt
      .replace(/\bl\b/g, 'I') // l đơn -> I
      .replace(/ĐẠl/g, 'ĐẠI')
      .replace(/HỘl/g, 'HỘI')
      .replace(/TRUẬT/g, 'THUẬT')
      .replace(/lẼN/g, 'MIỄN')
      // Loại bỏ ký tự lỗi OCR phổ biến
      .replace(/[¬]/g, '-')
      .replace(/[‹›«»]/g, '"')
      // Loại bỏ các ký tự lạ không phải chữ cái, số, dấu câu thông thường
      .replace(
        /[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ.,;:!?()\-"/\n]/g,
        ' ',
      )
      // Gộp space thừa sau khi xử lý
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Đếm diacritics để debug
    const diacriticCount = (
      normalized.match(
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi,
      ) || []
    ).length;
    if (diacriticCount > 0) {
      console.log(`Detected ${diacriticCount} diacritics`);
    }

    return normalized;
  }

  private async preprocessImage(imgPath: string): Promise<string> {
    const outPath = imgPath.replace('.png', '-prep.png');

    const img = sharp(imgPath);
    const meta = await img.metadata();

    const topCut = Math.floor(meta.height! * 0.03); // 1000px => cut 30px
    const bottomCut = Math.floor(meta.height! * 0.03);

    // Chỉ cắt trái/phải nếu ảnh quá rộng (scan lệch)
    // aspect ratio: width / height
    // < 1 là ảnh dọc, 0.75 là tỉ lệ phổ biến của trang A4
    const sideCut =
      meta.width! / meta.height! > 0.75 ? Math.floor(meta.width! * 0.012) : 0;

    await img
      .extract({
        left: sideCut,
        top: topCut,
        width: meta.width! - sideCut * 2, // cut left/right
        height: meta.height! - topCut - bottomCut, // cut top/bottom
      })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 0.5 })
      // .threshold(115)
      .median(1)
      .toFile(outPath);

    return outPath;
  }

  async onModuleDestroy() {
    console.log('🛑 Terminating OCR workers...');
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}

```

### src\ingest\loaders\pdf.loader.ts

```ts
import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

// Type definitions for pdf.js objects
interface TextItem {
  str: string;
  transform: number[];
}

interface TextContent {
  items: TextItem[];
}

interface PageData {
  pageNumber: number;
  getTextContent(options?: {
    normalizeWhitespace?: boolean;
    disableCombineTextItems?: boolean;
  }): Promise<TextContent>;
}

@Injectable()
export class PdfService {
  private pageTexts: Map<number, string> = new Map();

  async load(filePath: string): Promise<{ page: number; text: string }[]> {
    // Reset page texts for new document
    this.pageTexts.clear();

    // Read PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF with pdf-parse
    await pdfParse(dataBuffer, {
      pagerender: (pageData: PageData) => this.renderPage(pageData),
    });

    // Convert Map to array sorted by page number
    const result = Array.from(this.pageTexts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNum, text]) => ({
        page: pageNum,
        text: text,
      }));

    return result;
  }

  private async renderPage(pageData: PageData): Promise<string> {
    const render_options = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };

    const textContent = await pageData.getTextContent(render_options);
    const strings = textContent.items.map((item) => item.str);
    const pageText = strings.join(' ') + '\n';

    // Store text by page number
    this.pageTexts.set(pageData.pageNumber, pageText);

    return pageText;
  }
}

```

### src\ingest\splitters\text-splitter.ts

```ts
import { Injectable } from '@nestjs/common';
import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constant/index.constant.js';

export type ChunkResult = {
  text: string;
  page: number;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
};

@Injectable()
export class TextSplitterService {
  // Thứ tự ưu tiên: Ngắt đoạn đôi -> Đoạn đơn -> Câu -> Mệnh đề -> Từ
  private readonly SEPARATORS = [
    '\n\n',
    '\n',
    '. ',
    '? ',
    '! ',
    '; ',
    ': ', // Thêm dấu hai chấm
    ', ',
    ' ',
    '', // Fallback cuối cùng: cắt từng ký tự nếu không tìm thấy gì
  ];

  splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    let globalOffset = 0;
    let chunkIndex = 0;

    for (const p of pages) {
      const pageText = p.text;

      // Xử lý trang rỗng
      if (!pageText || pageText.length === 0) {
        continue; // Offset không đổi vì độ dài = 0
      }

      let localStart = 0;

      while (localStart < pageText.length) {
        // 1. Xác định điểm cắt lý tưởng (Hard Limit)
        let localEnd = Math.min(localStart + CHUNK_SIZE, pageText.length);

        // 2. Tìm điểm cắt ngữ nghĩa (Semantic Boundary)
        // Chỉ tìm nếu chưa hết văn bản
        if (localEnd < pageText.length) {
          const semanticEnd = this.findNearestSeparator(
            pageText,
            localStart,
            localEnd,
          );
          if (semanticEnd !== -1) {
            localEnd = semanticEnd;
          }
        }

        // 3. Lấy raw text
        const rawChunkText = pageText.slice(localStart, localEnd);

        // 4. XỬ LÝ TRIM VÀ OFFSET CHÍNH XÁC (QUAN TRỌNG)
        // Ta cần tìm vị trí thực của chữ cái đầu tiên và cuối cùng trong rawChunkText
        // để offset trả về KHÔNG bao gồm khoảng trắng thừa ở đầu/cuối.
        if (rawChunkText.trim().length > 0) {
          // Tính toán offset nội bộ để trim
          const startTrimDelta =
            rawChunkText.length - rawChunkText.trimStart().length;
          const endTrimDelta =
            rawChunkText.length - rawChunkText.trimEnd().length;

          const realStartOffset = globalOffset + localStart + startTrimDelta;
          const realEndOffset = globalOffset + localEnd - endTrimDelta;

          chunks.push({
            text: rawChunkText.trim(),
            page: p.page,
            chunkIndex: chunkIndex,
            startOffset: realStartOffset,
            endOffset: realEndOffset,
          });
          chunkIndex++;
        }

        // 5. Chuẩn bị cho vòng lặp sau (Overlap)
        if (localEnd >= pageText.length) {
          break;
        }

        // Tính overlap
        const idealNextStart = Math.max(localStart, localEnd - CHUNK_OVERLAP);

        // Tìm điểm bắt đầu "đẹp" cho chunk sau (tránh cắt giữa từ)
        localStart = this.findSmartNextStart(
          pageText,
          idealNextStart,
          localEnd,
        );
      }

      globalOffset += pageText.length;
    }

    return chunks;
  }

  /**
   * TỐI ƯU HIỆU NĂNG:
   * Không dùng slice() để tạo chuỗi con mới. Dùng lastIndexOf với tham số position.
   */
  private findNearestSeparator(
    text: string,
    start: number,
    limit: number,
  ): number {
    // Chỉ tìm ngược lại trong khoảng 40% cuối của chunk
    // Để đảm bảo chunk không bị quá ngắn (ví dụ chunk 1000 mà cắt ở ký tự thứ 10)
    const minSearchIndex = Math.max(
      start,
      limit - Math.floor(CHUNK_SIZE * 0.4),
    );

    for (const sep of this.SEPARATORS) {
      if (sep === '') return limit; // Fallback hard cut

      // Tìm separator cuối cùng xuất hiện TRƯỚC limit
      const lastIndex = text.lastIndexOf(sep, limit);

      // Quan trọng: lastIndex phải >= minSearchIndex để đảm bảo chunk đủ dài
      if (lastIndex !== -1 && lastIndex >= minSearchIndex) {
        // Cắt SAU separator (ví dụ sau dấu chấm)
        return lastIndex + sep.length;
      }
    }

    return -1; // Fallback
  }

  private findSmartNextStart(
    text: string,
    idealStart: number,
    previousEnd: number,
  ): number {
    if (idealStart <= 0) return 0;
    if (idealStart >= text.length) return text.length;

    // Nếu ngay tại idealStart đã là ký tự bắt đầu từ mới (trước đó là space) -> Tốt
    if (text[idealStart - 1] === ' ' || text[idealStart - 1] === '\n') {
      return idealStart;
    }

    // Nếu không, lùi lại tìm khoảng trắng gần nhất
    // Giới hạn lùi tối đa 50 ký tự để tránh chunk sau bị overlap quá nhiều (thừa thãi)
    const searchLimit = Math.max(0, idealStart - 50);

    // Tìm space hoặc newline gần nhất phía trước
    const lastSpace = text.lastIndexOf(' ', idealStart);
    const lastNewline = text.lastIndexOf('\n', idealStart);

    const bestStart = Math.max(lastSpace, lastNewline);

    if (bestStart !== -1 && bestStart >= searchLimit) {
      return bestStart + 1; // Bắt đầu sau dấu cách
    }

    // Nếu từ quá dài (dài hơn 50 ký tự không có dấu cách), đành cắt giữa từ
    return idealStart;
  }

  splitText(text: string): ChunkResult[] {
    const pages = [{ page: 1, text }];
    return this.splitPdfPages(pages);
  }
}

```

### src\ingest\vector\pgvector.client.ts

```ts
import { ConsoleLogger, Injectable, OnModuleInit } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { getPgConfig } from '../../config/pg.config';

@Injectable()
export class PgvectorService implements OnModuleInit {
  private vectorStore: PGVectorStore | null = null;

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: ConsoleLogger,
  ) {}

  // Tự động chạy khi module khởi tạo
  async onModuleInit() {
    await this.initVectorStore();
    // Khuyến nghị: Chỉ chạy dòng này 1 lần khi deploy hoặc migration,
    // nhưng để ở đây cũng được nếu bảng chưa có index nó sẽ tạo.
    // Nếu index đã tồn tại, nó có thể báo lỗi, ta nên dùng try/catch
    await this.ensureHnswIndex();
  }

  async initVectorStore() {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    // Use universal pgConfig - works with any PostgreSQL provider
    // IMPORTANT: Call getPgConfig() at runtime to ensure env vars are loaded
    const config = getPgConfig();

    this.vectorStore = await PGVectorStore.initialize(
      this.openaiService.getEmbeddings(),
      config,
    );

    this.logger.log('✅ Connected to PGVector successfully!');
    return this.vectorStore;
  }

  // ---  INDEX HNSW ---
  async ensureHnswIndex() {
    if (!this.vectorStore) await this.initVectorStore();

    this.logger.log('🏗️ Checking/Creating HNSW Index...');

    try {
      // Các thông số này tối ưu cho OpenAI (1536 dimensions)
      await this.vectorStore?.createHnswIndex({
        dimensions: 1536,
        m: 16, // Số kết nối mỗi node (Default: 16)
        efConstruction: 64, // Độ sâu tìm kiếm khi xây dựng index (Default: 64)
      });
      this.logger.log('✅ HNSW Index created successfully');
    } catch (error) {
      // PGVector thường throw lỗi nếu Index đã tồn tại.
      // Ta catch lỗi này để không làm crash app.
      if (error.message && error.message.includes('already exists')) {
        this.logger.log('ℹ️ HNSW Index already exists. Skipping creation.');
      } else {
        this.logger.error('❌ Error creating HNSW index:', error);
      }
    }
  }
}

```

### src\ingest\vector\vector.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { PgvectorService } from './pgvector.client';
import { ChunkResult } from '../splitters/text-splitter';

type Metadata = {
  fileId: string;
  projectId?: string;
  userId: string;
  fileUrl: string;
};
@Injectable()
export class VectorService {
  constructor(private readonly pgvectorService: PgvectorService) {}

  // -- ADD DOCUMENTS TO VECTOR STORE --
  async addDocuments({
    chunks,
    metadata,
  }: {
    chunks: ChunkResult[];
    metadata: Metadata;
  }) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    return vectorStore.addDocuments(
      chunks.map((chunk) => ({
        pageContent: chunk.text,
        metadata: {
          ...metadata,
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
        },
      })),
    );
  }

  // -- RETRIEVE SIMILAR DOCUMENTS --
  async getRetrievalsWithK(
    query: string,
    k: number,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearch(query, k, filter);
    return results;
  }

  // -- RETRIEVE SIMILAR WITH SCORE --
  async getRetrievalsWithScore(
    query: string,
    k = 30,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearchWithScore(
      query,
      k,
      filter,
    );

    //  for (const [doc, score] of similaritySearchWithScoreResults) {
    //   console.log(`* [SIM=${score.toFixed(3)}] ${doc.pageContent} [${JSON.stringify(doc.metadata)}]`);
    // }

    return results;
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}

```
