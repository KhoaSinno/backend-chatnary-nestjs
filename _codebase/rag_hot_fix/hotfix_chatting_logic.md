# Project Export

## Project Statistics

- Total files: 31

## Folder Structure

```
src
  chat
    chat.controller.ts
    chat.module.ts
    chat.service.ts
    dto
      chat.dto.ts
      update-chat.dto.ts
    entities
      chat.entity.ts
  document
    document.controller.ts
    document.module.ts
    document.service.ts
    dto
      create-document.dto.ts
      update-document.dto.ts
    entities
      document.entity.ts
    oss.ts
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
  project
    dto
      create-project.dto.ts
      update-project.dto.ts
    entities
      project.entity.ts
    project.controller.ts
    project.module.ts
    project.service.ts
  retrieval
    retrieval.module.ts
    retrieval.service.ts
  pipeline
    pipeline.module.ts
    pipeline.service.ts
logs__chat_bug.md

```

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
import { IngestModule } from '../ingest/ingest.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [IngestModule, RetrievalModule],
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

    // const topK = 5;
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

    // Debug: Log retrieved documents metadata
    console.log('📋 Retrieved Documents:', relateDocs.length);
    relateDocs.slice(0, 5).forEach(([doc, score], idx) => {
      console.log(
        `  ${idx + 1}. [${score.toFixed(3)}] Chunk ${doc.metadata.chunkIndex} from fileId: ${doc.metadata.fileId?.substring(0, 8)}...`,
      );
    });

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
      { role: 'system' as const, content: SYSTEM_PROMPT.trim() },
      ...contentHistory, // Last up to 6 messages
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

  // async chatGlobal(chatDto: ChatDto): Promise<BaseMessage> {
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

### src\chat\entities\chat.entity.ts

```ts
export class Chat {}

```

### src\document\document.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Logger,
  Headers,
  Req,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './oss';
import path from 'path';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // -- UPLOAD FILES --
  @Post('upload/files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      dest: 'uploads/documents',
      storage: storage,
      limits: { fileSize: 2000 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const extName = path.extname(file.originalname).toLowerCase();
        const allowedExts = [
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          '.txt',
        ];
        if (!allowedExts.includes(extName)) {
          return cb(
            new BadRequestException('Only document files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFiles(
    @Req() req: { user: JwtPayloadWithRt },
    @UploadedFiles() files: Express.Multer.File[],
    @Body('projectId') projectId?: string,
  ) {
    Logger.log('Uploaded files:', files);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    await this.documentService.uploadFiles(req.user.userId, files, projectId);
    return files.map((file) => ({
      url: `/uploads/documents/${file.filename}`,
    }));
  }

  // -- REMOVE --
  @Delete(':fileId')
  removeDocument(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('fileId') fileId: string,
  ) {
    return this.documentService.removeDocument(fileId, req.user.userId);
  }

  // -- GET ALL DOCUMENTS --
  @Get()
  getAllDocuments(@Req() req: { user: JwtPayloadWithRt }) {
    return this.documentService.getAllDocuments(req.user.userId);
  }

  // -- GET DOCUMENT DETAIL BY USER --
  @Get(':id')
  getDocumentDetail(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
  ) {
    return this.documentService.getDocumentDetail(req.user.userId, id);
  }

  //  -- UPDATE DOCUMENT --
  @Patch(':id')
  updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.updateDocument(id, updateDocumentDto);
  }
}

```

### src\document\document.module.ts

```ts
import { ConsoleLogger, Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { IngestModule } from '../ingest/ingest.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [IngestModule],
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService, ConsoleLogger],
  exports: [DocumentService],
})
export class DocumentModule {}

```

### src\document\document.service.ts

```ts
import { ConsoleLogger, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { project_documents } from '@prisma/client';
import { AccessLevelDoc } from '../constant/index.constant';

@Injectable()
export class DocumentService {
  constructor(
    private readonly ingestService: IngestService,
    private vectorService: VectorService,
    private prisma: PrismaService,
    private readonly logger: ConsoleLogger,
  ) {}

  //-- UPLOAD --
  async uploadFiles(
    userId: string,
    files: Express.Multer.File[],
    projectId?: string,
  ): Promise<void> {
    for (const file of files) {
      let document: project_documents | null = null;
      try {
        // Pre create document record with 'processing' status
        document = await this.createDocument({
          projectId: projectId as string,
          name: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing',
          userId: userId,
          accessLevel: AccessLevelDoc.PRIVATE,
          viewCount: 0,
        });

        const chunksCount = await this.ingestService.ingestDocument(
          file.path,
          document.id,
          userId,
          projectId,
        );

        this.logger.log(
          `✅ Ingested ${chunksCount} chunks for: ${file.originalname}`,
        );

        // If ingestion successful (has chunks), save document record in DB
        if (chunksCount > 0) {
          // update 'done' status
          await this.updateDocumentStatus(document.id, 'done');

          this.logger.log(
            `📝 Document record created for: ${file.originalname}`,
          );
        } else {
          this.logger.warn(`⚠️ No chunks created for: ${file.originalname}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to ingest ${file.originalname}:`, error);
        // Optionally update 'error' status
        if (document) {
          await this.updateDocumentStatus(document.id, 'error');
        }
      }
    }
  }
  // -- REMOVE --
  async removeDocument(fileId: string, userId: string) {
    // Check doc exists
    const document = await this.prisma.project_documents.findUnique({
      where: { id: fileId },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (document.userId !== userId)
      throw new NotFoundException('Document not found');

    // Remove vectors
    await this.vectorService.removeVectorByFileId(fileId);

    // Delete physical file
    try {
      deleteFile(path.join(process.cwd(), document.filePath));
    } catch (error) {
      console.error('⚠️ File delete error:', error);
      throw new NotFoundException('Delete file uploads error');
    }

    // project_documents
    return await this.prisma.project_documents.delete({
      where: { id: fileId },
    });
  }

  // Remove all documents in a project
  async removeDocumentInProject(projectId: string, userId: string) {
    // Get all documents in project
    const documents = await this.prisma.project_documents.findMany({
      where: { projectId: projectId, userId: userId },
    });

    if (documents.length === 0) {
      return {
        count: 0,
        isDeleted: true,
      };
    }

    // Remove each document's vector and physical file
    for (const document of documents) {
      // Remove vectors
      try {
        await this.vectorService.removeVectorByFileId(document.id);
        this.logger.log(`🗑️ Deleted vectors for document: ${document.name}`);
      } catch (error) {
        this.logger.error(
          `⚠️ Vector delete error for ${document.name}:`,
          error,
        );
      }

      // Delete physical file
      try {
        deleteFile(path.join(process.cwd(), document.filePath));
        this.logger.log(`🗑️ Deleted file: ${document.filePath}`);
      } catch (error) {
        this.logger.error(
          `⚠️ File delete error for ${document.filePath}:`,
          error,
        );
      }
    }

    // Delete all document records from DB
    const deleteResult = await this.prisma.project_documents.deleteMany({
      where: { projectId: projectId, userId: userId },
    });

    this.logger.log(
      `✅ Deleted ${deleteResult.count} document records from database`,
    );

    return {
      count: deleteResult.count,
      isDeleted: true,
    };
  }

  // -- CREATE DOCUMENT MAPPING --
  async createDocument(documentDto: CreateDocumentDto) {
    return await this.prisma.project_documents.create({
      data: {
        projectId: documentDto.projectId,
        name: documentDto.name,
        filePath: documentDto.filePath,
        mimeType: documentDto.mimeType,
        size: documentDto.size,
        status: documentDto.status,
        userId: documentDto.userId,
      },
    });
  }

  // -- GET DOCUMENT IN PROJECT --
  async getDocumentsInProject(projectId: string) {
    // Check exist project

    return await this.prisma.project_documents.findMany({
      where: { projectId: projectId },
      omit: {
        projectId: true,
        userId: true,
      },
    });
  }

  // -- GET ALL DOCUMENTS --
  async getAllDocuments(userId: string) {
    return await this.prisma.project_documents.findMany({
      where: {
        userId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            isArchived: true,
          },
        },
      },
    });
  }

  // -- GET DOCUMENT DETAIL --
  async getDocumentDetail(userId: string, id: string) {
    return await this.prisma.project_documents.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            isArchived: true,
          },
        },
      },
    });
  }

  // -- UPDATE DOCUMENT --
  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto) {
    return await this.prisma.project_documents.update({
      where: { id: id },
      data: {
        name: updateDocumentDto.name,
      },
    });
  }
  // -- UPDATE DOCUMENT STATUS --
  async updateDocumentStatus(id: string, status: string) {
    // Validate status
    if (!['processing', 'done', 'error'].includes(status)) {
      throw new Error('Invalid status value');
    }

    return await this.prisma.project_documents.update({
      where: { id: id },
      data: {
        status: status,
      },
    });
  }
}

```

### src\document\dto\create-document.dto.ts

```ts
import {
  IsDate,
  IsEnum,
  IsInt,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccessLevelDoc } from '../../constant/index.constant';

export class CreateDocumentDto {
  @IsString({ message: 'projectId must be a string' })
  projectId: string;

  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsString({ message: 'filePath must be a string' })
  filePath: string;

  @IsString({ message: 'originalFileName must be a string' })
  mimeType?: string;

  @IsInt({ message: 'size must be an integer' })
  size?: number;

  @IsString({ message: 'status must be a string' })
  status: string;

  @IsString({ message: 'userId must be a string' })
  userId: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 255 characters' })
  title?: string;

  @IsString({ message: 'description must be a string' })
  @Length(1, 500, {
    message: 'description must be between 1 and 500 characters',
  })
  description?: string;

  @IsString({ each: true, message: 'each author must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each author must be at most 50 characters',
  })
  authors?: string[];

  @IsString({ each: true, message: 'each subject must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each subject must be at most 50 characters',
  })
  subjects?: string[];

  @IsString({ each: true, message: 'each tag must be a string' })
  @MaxLength(30, {
    each: true,
    message: 'each tag must be at most 30 characters',
  })
  tags?: string[];

  @IsString({ message: 'documentType must be a string' })
  documentType?: string;

  @IsInt({ message: 'publishedYear must be an integer' })
  publishedYear?: number;

  @IsEnum(AccessLevelDoc, { message: 'accessLevel must be a valid enum value' })
  accessLevel: AccessLevelDoc;

  metadata?: any;

  @IsDate({ message: 'indexedAt must be a valid date' })
  indexedAt?: Date;

  @IsInt({ message: 'viewCount must be an integer' })
  viewCount: number;
}

```

### src\document\dto\update-document.dto.ts

```ts
export class UpdateDocumentDto {
  name?: string;
}

```

### src\document\entities\document.entity.ts

```ts
export class Document {}

```

### src\document\oss.ts

```ts
// Object storage server (OSS) configuration

import * as fs from 'fs';
import * as multer from 'multer';
import path from 'path';

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      fs.mkdirSync('uploads/documents', { recursive: true });
    } catch (error) {}
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Latin1 to utf-8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    cb(null, uniqueSuffix + ext);
  },
});

// Delete file function
export const deleteFile = (filePath: string) => {
  const normalizedPath = path.normalize(filePath);
  fs.unlink(normalizedPath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
    } else {
      console.log('File deleted successfully');
    }
  });
};

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
          // if (r.prepPath && fs.existsSync(r.prepPath)) {
          //   fs.unlinkSync(r.prepPath);
          // }
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
    let normalized = text
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
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
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
  // splitter = new RecursiveCharacterTextSplitter({
  //   chunkSize: 1000,
  //   chunkOverlap: 200,
  // });

  // async splitText(text: string) {
  //   return this.splitter.splitText(text);
  // }

  splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    let globalOffset = 0;
    let chunkIndex = 0;

    for (const p of pages) {
      const pageText = p.text.trim();
      if (!pageText) {
        continue;
      }

      let localStart = 0;

      while (localStart < pageText.length) {
        const end = Math.min(localStart + CHUNK_SIZE, pageText.length);
        const chunkText = pageText.slice(localStart, end);

        const chunk: ChunkResult = {
          text: chunkText,
          page: p.page,
          chunkIndex: chunkIndex,
          startOffset: globalOffset + localStart,
          endOffset: globalOffset + end,
        };

        chunks.push(chunk);
        chunkIndex++;

        // next chunk start
        localStart += CHUNK_SIZE - CHUNK_OVERLAP;
      }

      globalOffset += pageText.length;
    }

    return chunks;
  }

  // If user sends plain text instead of PDF
  splitText(text: string): ChunkResult[] {
    const pages = [{ page: 1, text }];
    return this.splitPdfPages(pages);
  }
}

```

### src\ingest\vector\pgvector.client.ts

```ts
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { pgConfig, getPgConfigNeon } from '../../config/pg.config';

@Injectable()
export class PgvectorService {
  private vectorStore: PGVectorStore | null = null;

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: ConsoleLogger,
  ) {}
  async initVectorStore() {
    // Check singleton
    if (this.vectorStore) {
      return this.vectorStore;
    }

    // Use NeonDB if DATABASE_URL_NEON is set, otherwise use local
    const useNeon = !!process.env.DATABASE_URL_NEON;
    const config = useNeon ? getPgConfigNeon() : pgConfig;

    this.logger.log('🔧 PGVector Config:', {
      useNeon,
      connectionString: useNeon
        ? process.env.DATABASE_URL_NEON?.substring(0, 30) + '...'
        : `${process.env.POSTGRES_HOST || 'db'}:${process.env.POSTGRES_PORT || '5432'}`,
    });

    // Init ONCE
    this.vectorStore = await PGVectorStore.initialize(
      this.openaiService.getEmbeddings(),
      config,
    );

    this.logger.log('✅ Connected to PGVector successfully!');
    return this.vectorStore;
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

    // Retrieve more results to account for manual filtering
    const retrieveK = k * 3;
    const results = await vectorStore.similaritySearch(query, retrieveK);

    // Manual filter by metadata
    const filteredResults = results.filter((doc) => {
      const matchesUser = doc.metadata.userId === userId;
      const matchesProject = projectId
        ? doc.metadata.projectId === projectId
        : true;
      return matchesUser && matchesProject;
    });

    return filteredResults.slice(0, k);
  }

  // -- RETRIEVE SIMILAR WITH SCORE --
  async getRetrievalsWithScore(
    query: string,
    k = 20,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    console.log('🔍 Vector Search Filter:', JSON.stringify(filter));

    // IMPORTANT: Retrieve more results initially to account for filtering
    const retrieveK = k * 3; // Get 3x more to ensure we have enough after filtering

    const results = await vectorStore.similaritySearchWithScore(
      query,
      retrieveK,
      // Note: PGVector filter might not work correctly, so we'll filter manually
    );

    // Manual filter by metadata
    const filteredResults = results.filter(([doc]) => {
      const matchesUser = doc.metadata.userId === userId;
      const matchesProject = projectId
        ? doc.metadata.projectId === projectId
        : true;
      return matchesUser && matchesProject;
    });

    // Debug: Log metadata của kết quả để kiểm tra
    console.log('📊 Search Results (Before Filter):', results.length);
    console.log('📊 Search Results (After Filter):', filteredResults.length);
    console.log('📊 Top 5 Results Metadata:');
    filteredResults.slice(0, 5).forEach(([doc, score], idx) => {
      console.log(
        `  ${idx + 1}. [Score: ${score.toFixed(3)}] fileId: ${doc.metadata.fileId?.substring(0, 8)}..., projectId: ${doc.metadata.projectId?.substring(0, 8)}..., userId: ${doc.metadata.userId?.substring(0, 8)}...`,
      );
    });

    // Return only the top k results after filtering
    return filteredResults.slice(0, k);
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}

```

### src\project\dto\create-project.dto.ts

```ts
import { IsBoolean, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsString({ message: 'color must be a string' })
  color?: string;

  @IsBoolean({ message: 'isArchived must be a boolean' })
  isArchived?: boolean;

  @IsString({ message: 'userId must be a string' })
  userId: string;
}

```

### src\project\dto\update-project.dto.ts

```ts
import { IsBoolean, IsString, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsString({ message: 'color must be a string' })
  color?: string;

  @IsBoolean({ message: 'isArchived must be a boolean' })
  isArchived?: boolean;
}

```

### src\project\entities\project.entity.ts

```ts
export class Project {}

```

### src\project\project.controller.ts

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
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ChatDto } from '../chat/dto/chat.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // -- CREATE --
  @Post()
  createNewProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() createProjectDto: CreateProjectDto,
  ) {
    createProjectDto.userId = req.user.userId;
    return this.projectService.createNewProject(createProjectDto);
  }

  // -- READ BY USERID --
  @Get('')
  findByUserId(@Req() req: { user: JwtPayloadWithRt }) {
    return this.projectService.findByUserId(req.user.userId);
  }

  // -- GET CHATS IN PROJECT --
  @Get('/:projectId/chats')
  async getChatsInProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
  ) {
    // RETURN LIST OF CHATS IN A PROJECT
    return await this.projectService.getChatsInProject(
      req.user.userId,
      projectId,
    );
  }

  // -- GET DOCUMENTS IN PROJECT --
  @Get('/:projectId/documents')
  async getDocumentsProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
  ) {
    return await this.projectService.getDocumentsInProject(
      req.user.userId,
      projectId,
    );
  }

  // -- GET CHAT IN PROJECTS --
  @Get('/:projectId/chats/:chatId/messages')
  async getChatDetailInProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Param('chatId') chatId: string,
  ) {
    // CHECK EXISTED
    //...

    // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
    return await this.projectService.getChatDetailInProject(
      req.user.userId,
      projectId,
      chatId,
    );
  }

  // -- POST CHAT IN PROJECTS --
  @Post('/:projectId/chats/messages')
  async chatMessageInProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Query('chatId') chatId: string | undefined,
    @Body() body: ChatDto, // message
  ) {
    body.chatId = chatId;
    body.userId = req.user.userId;
    body.projectId = projectId;
    // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
    return await this.projectService.chatMessageInProject(body);
  }

  // -- UPDATE PROJECT --
  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(id, updateProjectDto);
  }

  // -- DELETE PROJECT CASCADE --
  @Delete(':id')
  removeProject(@Param('id') id: string) {
    return this.projectService.removeProject(id);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(+id);
  }
}

```

### src\project\project.module.ts

```ts
import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../llm/openai/openai.service';
import { IngestModule } from '../ingest/ingest.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [IngestModule, RetrievalModule, DocumentModule],
  controllers: [ProjectController],
  providers: [ProjectService, ChatService, PrismaService, OpenaiService],
})
export class ProjectModule {}

```

### src\project\project.service.ts

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from '../chat/dto/chat.dto';
import { ChatService } from '../chat/chat.service';
import { DocumentService } from '../document/document.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly documentService: DocumentService,
  ) {}

  // -- CREATE NEW PROJECT --
  async createNewProject(createProjectDto: CreateProjectDto) {
    return await this.prisma.projects.create({
      data: createProjectDto,
    });
  }

  // -- FIND PROJECTS BY USER ID --
  async findByUserId(userId: string) {
    return await this.prisma.projects.findMany({
      where: { userId: userId },
    });
  }

  // -- GET CHATS IN PROJECT --
  async getChatsInProject(userId: string, projectId: string) {
    // Check existed
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, userId: userId },
    });
    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to user',
      );
    }

    return await this.prisma.chats.findMany({
      where: { projectId: projectId },
    });
  }

  // -- GET CHAT DETAIL IN PROJECT --
  async getChatDetailInProject(
    userId: string,
    projectId: string,
    chatId: string,
  ) {
    // TODO: CHECK EXISTED
    return await this.prisma.chats.findUnique({
      where: { id: chatId },
    });
  }

  // -- GET DOCUMENTS IN PROJECT --
  async getDocumentsInProject(userId: string, projectId: string) {
    // Check existed
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, userId: userId },
    });
    if (!project)
      throw new NotFoundException(
        'Project not found or does not belong to user',
      );

    return await this.documentService.getDocumentsInProject(projectId);
  }

  // -- POST CHAT IN PROJECTS --
  async chatMessageInProject(chatDto: ChatDto) {
    return await this.chatService.chatHistory(chatDto);
  }

  // -- UPDATE PROJECT --
  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    return await this.prisma.projects.update({
      where: { id: id },
      data: updateProjectDto,
    });
  }

  // -- DELETE PROJECT CASCADE --
  async removeProject(id: string) {
    // Get project info first (before delete)
    const project = await this.prisma.projects.findUnique({
      where: { id: id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Delete: Vector + Disk files FIRST (before cascade delete)
    await this.documentService.removeDocumentInProject(id, project.userId);

    // Then delete project (cascade will delete DB records)
    const projectDel = await this.prisma.projects.delete({
      where: { id: id },
    });

    return projectDel;
  }

  findAll() {
    return `This action returns all project`;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }
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

@Injectable()
export class RetrievalService {
  private readonly INITIAL_K = 30;
  private readonly BASE_SCORE_THRESHOLD = 0.3;
  private readonly MIN_DOCS = 5;
  private readonly MAX_DOCS = 10;
  private readonly ADAPTIVE_THRESHOLD_RATIO = 0.7; // 70% of top score

  constructor(
    private vectorService: VectorService,
    private logger: Logger,
  ) {}
  // TODO: Hybrid search
  // -- RETRIEVE DOCUMENTS WITH SCORE  --
  async retrieveScore(query: string, userId: string, projectId?: string) {
    // Get results with score
    const docsScore = await this.vectorService.getRetrievalsWithScore(
      query,
      this.INITIAL_K,
      userId,
      projectId,
    );

    // edge case: no results
    if (!docsScore.length) return [];

    // 1. SORT by score first (highest score = most relevant)
    const sortedDocs = docsScore.sort((a, b) => b[1] - a[1]);

    // 2. Calculate adaptive threshold based on top score
    const topScore = sortedDocs[0][1];
    const adaptiveThreshold = Math.max(
      this.BASE_SCORE_THRESHOLD,
      topScore * this.ADAPTIVE_THRESHOLD_RATIO,
    );

    this.logger.debug({
      topScore: topScore.toFixed(3),
      adaptiveThreshold: adaptiveThreshold.toFixed(3),
      baseThreshold: this.BASE_SCORE_THRESHOLD,
    });

    // 3. Filter by adaptive threshold from SORTED docs
    let filteredDocsScore = sortedDocs.filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, score]) => score >= adaptiveThreshold,
    );

    // 4. Group by fileId and find the file with highest top score
    const fileScores = new Map<string, { maxScore: number; count: number }>();
    filteredDocsScore.forEach(([doc, score]) => {
      const fileId = doc.metadata.fileId as string;
      if (!fileScores.has(fileId)) {
        fileScores.set(fileId, { maxScore: 0, count: 0 });
      }
      const fileStats = fileScores.get(fileId)!;
      fileStats.maxScore = Math.max(fileStats.maxScore, score);
      fileStats.count += 1;
    });

    // Find the most relevant file (highest top score, not average)
    let topFileId = '';
    let maxTopScore = 0;
    fileScores.forEach((stats, fileId) => {
      if (stats.maxScore > maxTopScore) {
        maxTopScore = stats.maxScore;
        topFileId = fileId;
      }
    });

    this.logger.debug({
      filesFound: fileScores.size,
      topFileId: topFileId ? topFileId.substring(0, 8) : 'N/A',
      topFileMaxScore: maxTopScore.toFixed(3),
    });

    // 5. Prioritize chunks from the top file
    if (topFileId && fileScores.size > 1) {
      // Get chunks from top file
      const topFileChunks = filteredDocsScore.filter(
        ([doc]) => doc.metadata.fileId === topFileId,
      );

      // If we have enough from top file, use only those
      if (topFileChunks.length >= this.MIN_DOCS) {
        filteredDocsScore = topFileChunks;
        this.logger.debug({
          message: 'Using chunks from top file only',
          chunkCount: topFileChunks.length,
        });
      }
    }

    // 6. If not enough docs after filtering, take top MIN_DOCS from sorted
    if (filteredDocsScore.length < this.MIN_DOCS) {
      filteredDocsScore = sortedDocs.slice(0, this.MIN_DOCS);
    }

    this.logger.debug({
      query,
      topScores: sortedDocs.slice(0, 5).map((d) => d[1]),
      selectedCount: filteredDocsScore.length,
      scoreRange:
        filteredDocsScore.length > 0
          ? `${filteredDocsScore[filteredDocsScore.length - 1][1].toFixed(3)} - ${filteredDocsScore[0][1].toFixed(3)}`
          : 'N/A',
    });

    // 7. Return top MAX_DOCS (already sorted by relevance)
    return filteredDocsScore.slice(0, this.MAX_DOCS);
  }
}

```

### logs__chat_bug.md

```md
[Nest] 18548  - 14:10:57 18/12/2025     LOG [RouterExplorer] Mapped {/api/v1/user/:userId, DELETE} route +0ms
🔧 Initializing OCR worker pool...
✅ Initialized 8 OCR workers
[Nest] 18548  - 14:10:57 18/12/2025     LOG [NestApplication] Nest application successfully started +275ms
ChatDto {"message":"Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì","chatId":"","userId":"bbe027d0-74ea-4630-a846-5040a9772d19","projectId":"45ac97e2-0ed1-431c-9337-0e570f6875b4"}
[Nest] 18548  - 14:11:26 18/12/2025     LOG 🔧 PGVector Config:
[Nest] 18548  - 14:11:26 18/12/2025     LOG Object(2) {
  useNeon: true,
  connectionString: 'postgresql://neondb_owner:npg_...'
}
[Nest] 18548  - 14:11:27 18/12/2025     LOG ✅ Connected to PGVector successfully!
🔍 Vector Search Filter: {"userId":"bbe027d0-74ea-4630-a846-5040a9772d19","projectId":"45ac97e2-0ed1-431c-9337-0e570f6875b4"}
📊 Search Results (Before Filter): 25
📊 Search Results (After Filter): 25
📊 Top 5 Results Metadata:
  1. [Score: 0.533] fileId: b93b3eb6..., projectId: 45ac97e2..., userId: bbe027d0...
  2. [Score: 0.541] fileId: b93b3eb6..., projectId: 45ac97e2..., userId: bbe027d0...
  3. [Score: 0.551] fileId: b93b3eb6..., projectId: 45ac97e2..., userId: bbe027d0...
  4. [Score: 0.558] fileId: b93b3eb6..., projectId: 45ac97e2..., userId: bbe027d0...
  5. [Score: 0.573] fileId: b93b3eb6..., projectId: 45ac97e2..., userId: bbe027d0...
[Nest] 18548  - 14:11:29 18/12/2025   DEBUG Object(3) {
  topScore: '0.864',
  adaptiveThreshold: '0.605',
  baseThreshold: 0.3
}
[Nest] 18548  - 14:11:29 18/12/2025   DEBUG Object(4) {
  query: 'Tài liệu nghiên cứu những llm nào và nó có điểm mạnh gì',
  topScores: [
    0.8643520704297976,
    0.8100424075101368,
    0.7858448603245696,
    0.7818111349231647,
    0.7590605611168999
  ],
  selectedCount: 19,
  scoreRange: '0.605 - 0.864'
}
📋 Retrieved Documents: 10
  1. [0.864] Chunk 14 from fileId: b93b3eb6...
  2. [0.810] Chunk 0 from fileId: f9f7f179...
  3. [0.786] Chunk 9 from fileId: f9f7f179...
  4. [0.782] Chunk 13 from fileId: b93b3eb6...
  5. [0.759] Chunk 8 from fileId: f9f7f179...
Context:  ### Chunk 14
1 2 3 4 5 6 7 8 9 14 15 16 17 10 11 12 13 3

### Chunk 0
UBND THÀNH PHÓ CÂN THƠ CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TRƯỜNG ĐẠI HỌC. Độc Iập - Tự do - Hạnh phúc
KỸ THUẬT-CÔNG NGHỆ CÀN THƠ

Số: A64 /TB-ĐPHKTCN Cần Thơ, ngày Aó tháng 9 năm 2025

THÔNG BÁO
Về các chế độ chính sách miễn, giảm học phí cho sinh viên chính quy
học kỳ I năm học 2025 - 2026

Căn cứ Nghị định số 238/2025/NĐ- CP ngày 03 tháng 9 năm 2025 của
Chính phủ quy định về chính sách học phí, miễn, giảm, hỗ trợ học phí, hỗ trợ chỉ
phí học tập và giá dịch vụ trong Iĩnh vực giáo dục, đào tạo, Trường Đại học Kỹ
thuật - Công nghệ Cần Thơ thông báo đến Iãnh đạo các khoa, cổ vấn học tập và
toàn thể sinh viên chính quy các nội dung sau:

IL Đối tượng được. miễn, giảm: Sinh viên thuộc đối tượng, được miễn,
giảm học phí phải đủ 02 điều kiện sau:

1. Thường trú tại thành phố Cần Thơ (sau sáp nhậ

### Chunk 9
ịnh tại Nghị định 238/2025/NĐ-CP)

Căn cứ vào Nghị định số 238/2025/NĐ-CP của Chính phủ, tôi Iàm đơn này đề
nghị được Nhà trường xem xét để được miễn, giảm học phí theo quy định và chế độ
hiện hành

ngày ... tháng .... năm

Người Iàm đơn
Xácnh VH
GÀ su (Ký tên và ghi rõ họ tên)

### Chunk 13
[2503.04783] Comparative Analysis Based on DeepSeek, ChatGPT, and Google Gemini: Features, Techniques, Performance, Future Prospects https://ar5iv.org/html/2503.04783v1 Three in 10 Teachers Use AI Weekly, Saving Six Weeks a Year  https://news.gallup.com/poll/691967/three-teachers-weekly-saving-six-weeks-year.aspx What is Google Gemini? | IBM https://www.ibm.com/think/topics/google-gemini [2005.14165] Language Models are Few-Shot Learners https://arxiv.org/abs/2005.14165 How Large Language Models Will Transform Science, Society, and AI | Stanford HAI https://hai.stanford.edu/news/how-large-language-models-will-transform-science-society-and-ai 1 2 3 4 5 6 7 8 9 14 15 16 17 10 11 12 13 3

### Chunk 8

sách các thôn đặc biệt khó khăn vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021
2025;

6. Quyết định số 497/QĐ-UBDT ngày 30 tháng 7 năm 2024 phê duyệt điều
chỉnh và hiệu chỉnh tên huyện, xã, thôn đặc biệt khó khăn; thôn thuộc vùng dân tộc
thiêu sô và miên núi giai đoạn 2021 - 2025
JMau Ì
(Theo phụ Iục JJ kèm theo Nghị
định số 23/2025/NĐ-CP)

Kính gửi:- Ban Giám hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ;
Phòng Công tác Chính trị - Quản Iý sinh viên - Khởi nghiệp;
Cố vấn học tập
Họ và tên sinh viên CC/CCCD
Ngày, tháng, năm sinh

Nơi sinh

Địa chỉ thường trú cũ
Địa chỉ thường trú mới
Thuộc đối tượng
(Ghi rõ đói tượng được quy định tại Nghị định 238/2025/NĐ-CP)

Căn cứ vào Nghị định số 238/2025/NĐ-CP của Chính phủ, tôi Iàm đơn này đề
nghị được Nhà trường xem xét để được miễn,

### Chunk 5
miên, giảm học phí
(theo mêu);

Bản sao công chứng của Quyêt
định hưởng trợ cấp hàng tháng của
cha hoặc mẹ bị tai nạn lao động hoặc
mắc bệnh nghề nghiệp do tổ chức
Bảo hiểm xã hội cấp

Lưu ý:

(1) S nh viên thuộc diện miễn, giảm học phí cùng Iúc hướng nhiều chính
sách hỗ trợ khác nhau thì chỉ được hưởng một chế độ ưu đãi cao nhất.
3

(2) Danh mục vùng, địa bàn có điều kiện kinh tê - xã hội đặc biệt khó
khăn áp dụng đôi với đôi tượng 5 và đôi tượng 6 theo phụ Iục đính
kèm thông báo này. Sinh viên căn cứ theo địa chỉ thường trú trước sáp
nhập đề xét

II. Thời gian và địa điểm nộp hồ sơ

Sinh viên nộp trực tiếp tại Phòng Công tác Chính trị - Quản Iý sinh viên
Khởi nghiệp đến hết ngày 03/10/2025. Để biết thêm thông tin vui Iòng liên hệ
Phòng Công tác Chính trị - Quản Iý sinh viên - Khởi nghiệp

### Chunk 6
n Iý sinh viên
Khởi nghiệp đến hết ngày 03/10/2025. Để biết thêm thông tin vui Iòng liên hệ
Phòng Công tác Chính trị - Quản Iý sinh viên - Khởi nghiệp (Cô Đinh Viết
Tuyết Hiền, ĐT: 0919.232.577).

ở T. HIỆU TRƯỞNG

c đơn vị;

website Phòng QLSV. HIỆU TRƯỚNG
Lưu: VT, QLSV.

(Hien)

9

gúyễn Thị Yên Chỉ
DANH MỤC Ià

ì/

(Kèm theo Tì hôn ĐHKTt CN ngày6 tháng 9 năm 2025 của

1. Quyết định số 353/QĐ-TTg ngày 15 tháng 3 năm 2022 của Thủ tướng
Chính phủ Phê duyệt danh sách huyện nghèo, xã đặc biệt khó khăn vùng bãi ngang
ven biển và hải đảo giai đoạn 2021 - 2025;

2. Quyết định số 576/QĐ-TTg ngày 22 tháng 6 năm 2024 của Thủ tướng
Chính phủ: Công nhận 09 xã đặc biệt khó khăn vùng bãi ngang, ven biển và hải đảo
giai đoạn 2021 - 2025 thoát khỏi tình trạng đặc biệt khó khăn;

3. Quyết định số 861/QĐ-

### Chunk 3
NĐ-CP.

Đơn đề nghị miễn, giảm học phí
(theo mẫu);

Bản sao có công chứng Quyết định
về việc trợ cấp xã hội.

Đối tượng 4: (Khoản 7 - Điều 15)
Sinh viên Ià dân tộc thiêu số có cha
hoặc mẹ hoặc cả cha và mẹ hoặc ông
bà (trong trường hợp ở với ông bà)
thuộc hộ nghèo và hộ cận nghèo theo
quy định của Thủ tướng Chính phủ

Đơn đề nghị miễn, giảm học phí
(theo mẫu);

Giấy chứng nhận hộ nghèo, hộ cận
nghèo

Đối tượng 5: (Khoản 10 - Điều 15)
Sinh viên Ià dân tộc thiêu số rất ít
người ở vùng có điêu kiện kinh tê - xã
hội khó khăn và đặc biệt khó khăn

Đơn đê nghị miên, giảm học phí
(theo mẫu)

Bản sao công chứng của Giấy khai
sinh

2. Đối tượng giảm 70 học phí

A .
Hồ sơ cần thực hiện

Đối tượng 6: (Khoản 1 - Điều 16)

Sinh viên Ià người dân tộc thiểu số
(ngoài đối tượng dân tộc thiểu số rất ít
ng

### Chunk 7
n 09 xã đặc biệt khó khăn vùng bãi ngang, ven biển và hải đảo
giai đoạn 2021 - 2025 thoát khỏi tình trạng đặc biệt khó khăn;

3. Quyết định số 861/QĐ-TTg ngày 04 tháng 6 năm 2021 của Thủ tướng
Chính phủ: Phê duyệt danh sách các xã khu vực III, khu vực II, khu vực I thuộc vùng
đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2025;

4. Quyết định số 698/QĐ- TTg ngày 19 tháng 7 năm 2024 của Thủ tướng
Chính phủ: Phê duyệt điều chỉnh, bố sung và hiệu chỉnh danh sách xã khu vực III, khu
vực II, khu vực I thuộc vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021
2025;

5. Quyết định số 612/QĐ -UBDT ngày 16 tháng 9 năm 2021 phê duyệt danh
sách các thôn đặc biệt khó khăn vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021
2025;

6. Quyết định số 497/QĐ-UBDT ngày 30 tháng 7 năm 202

### Chunk 1
tượng được. miễn, giảm: Sinh viên thuộc đối tượng, được miễn,
giảm học phí phải đủ 02 điều kiện sau:

1. Thường trú tại thành phố Cần Thơ (sau sáp nhập)

2. Thuộc đối tượng được miễn, giảm theo Nghị định số 238/2025/NĐ-CP
(được nêu cụ thể tại phân Thủ tục thực hiện )

H. Thủ tục thực hiện

Sinh viên thuộc đối tượng được miễn, giảm học phí cần nộp hồ sơ để
được xét miễn, giảm học phí, cụ thê như sau
1. Đối tượng miễn học phí Hồ sơ cần thực hiện

Đối tượng 1: (Khoản 2 - Điều 15) Đơn đê nghị miền, giảm học phí
(theo mẫu)

Con của người hoạt động cách mạng
trước tháng 08/1945; Con của Anh - Bản sao có công chứng Giấy xác
hùng Lực Iượng vũ trang nhân dân, nhận đôi tượng do cơ quan quản Iý
Anh hùng Lao động trong thời kỳ đối với người có công

kháng chiên; Con của liệt sĩ, thương
binh, bệnh binh
ChatDto {"message":"Đối tượng nào được miễn giảm học phí","chatId":"","userId":"bbe027d0-74ea-4630-a846-5040a9772d19","projectId":"45ac97e2-0ed1-431c-9337-0e570f6875b4"}
🔍 Vector Search Filter: {"userId":"bbe027d0-74ea-4630-a846-5040a9772d19","projectId":"45ac97e2-0ed1-431c-9337-0e570f6875b4"}
📊 Search Results (Before Filter): 25
📊 Search Results (After Filter): 25
📊 Top 5 Results Metadata:
  1. [Score: 0.360] fileId: f9f7f179..., projectId: 45ac97e2..., userId: bbe027d0...
  2. [Score: 0.360] fileId: f9f7f179..., projectId: 45ac97e2..., userId: bbe027d0...
  3. [Score: 0.369] fileId: f9f7f179..., projectId: 45ac97e2..., userId: bbe027d0...
  4. [Score: 0.410] fileId: f9f7f179..., projectId: 45ac97e2..., userId: bbe027d0...
  5. [Score: 0.421] fileId: f9f7f179..., projectId: 45ac97e2..., userId: bbe027d0...
[Nest] 18548  - 14:11:47 18/12/2025   DEBUG Object(3) {
  topScore: '0.950',
  adaptiveThreshold: '0.665',
  baseThreshold: 0.3
}
[Nest] 18548  - 14:11:47 18/12/2025   DEBUG Object(4) {
  query: 'Đối tượng nào được miễn giảm học phí',
  topScores: [
    0.9499650269725934,
    0.8902808827664045,
    0.779582123123001,
    0.7681684334177675,
    0.7562076594705746
  ],
  selectedCount: 13,
  scoreRange: '0.683 - 0.950'
}
📋 Retrieved Documents: 10
  1. [0.950] Chunk 14 from fileId: b93b3eb6...
  2. [0.890] Chunk 13 from fileId: b93b3eb6...
  3. [0.780] Chunk 10 from fileId: b93b3eb6...
  4. [0.768] Chunk 4 from fileId: b93b3eb6...
  5. [0.756] Chunk 6 from fileId: b93b3eb6...
Context:  ### Chunk 14
1 2 3 4 5 6 7 8 9 14 15 16 17 10 11 12 13 3

### Chunk 13
[2503.04783] Comparative Analysis Based on DeepSeek, ChatGPT, and Google Gemini: Features, Techniques, Performance, Future Prospects https://ar5iv.org/html/2503.04783v1 Three in 10 Teachers Use AI Weekly, Saving Six Weeks a Year  https://news.gallup.com/poll/691967/three-teachers-weekly-saving-six-weeks-year.aspx What is Google Gemini? | IBM https://www.ibm.com/think/topics/google-gemini [2005.14165] Language Models are Few-Shot Learners https://arxiv.org/abs/2005.14165 How Large Language Models Will Transform Science, Society, and AI | Stanford HAI https://hai.stanford.edu/news/how-large-language-models-will-transform-science-society-and-ai 1 2 3 4 5 6 7 8 9 14 15 16 17 10 11 12 13 3

### Chunk 10
hatGPT) và Llama 2  trong các bài kiểm tra  GSM8K (đánh giá khả năng toán học) ,  HumanEval (đánh giá sinh mã lập trình)  và    MMLU (đánh giá hiểu biết ngôn ngữ đa lĩnh vực) . Đáng chú ý,      Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đ

### Chunk 4
i gian  và  nâng cao hiệu suất  trong môi trường làm việc thực tế. Về mặt kiến trúc và hiệu năng ,   các mô hình LLM thế hệ mới đều dựa trên kiến trúc Transformer  do Google giới thiệu năm 2017 . Kiến trúc này cho phép mô hình học được mối quan hệ ngữ cảnh giữa các từ trong chuỗi dữ liệu hiệu quả hơn so với các mô hình trước đó, đặt nền móng cho sự ra đời của  các mô hình ngôn ngữ cực lớn . Việc     gia tăng quy mô mô hình  (số lượng tham số) đi cùng  khối lượng dữ liệu huấn luyện khổng lồ  đã dẫn đến  những bước nhảy vọt về năng lực  của LLM.  GPT-3    của OpenAI (ra mắt 2020) là một ví dụ tiêu biểu: với  175 tỷ tham số , GPT-3 được huấn luyện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng c

### Chunk 6
các mô hình được huấn luyện chuyên biệt  cho tác vụ tương ứng,  cho thấy hiệu quả của việc mở rộng quy mô và học từ ngữ cảnh . Một công trình nghiên cứu tiêu biểu đã tổng kết  các đặc điểm chính của mô hình GPT-3  và dòng LLM hiện đại như sau : Kiến trúc và dữ liệu huấn luyện:  GPT-3 và các thế hệ kế nhiệm  được xây dựng trên kiến trúc Transformer ,  huấn luyện trên tập dữ liệu văn bản khổng lồ  (hàng trăm tỷ từ) bao gồm nhiều nguồn khác nhau . Quy mô tham số cực lớn (GPT-3 có 175 tỷ tham số) cho phép mô hình  học được biểu diễn ngôn ngữ rất đa dạng , làm nền tảng cho hiệu suất cao trên nhiều nhiệm vụ. Khả năng học từ ít ví dụ:  GPT-3 có khả năng  thực hiện nhiều nhiệm vụ chỉ dựa trên một vài ví dụ hoặc thậm chí không cần ví dụ minh họa  (few-shot learning). Mô hình  hiểu yêu cầu từ ngữ cả

### Chunk 5
ện trên  khối lượng dữ liệu văn bản ~570 GB  và có thể  thực hiện đa dạng nhiệm vụ NLP  chỉ thông qua  gợi ý ngữ cảnh ,   không cần tinh chỉnh riêng cho từng tác vụ . Mô hình này cho thấy  năng lực tổng quát hóa vượt trội  – GPT-3 có thể dịch thuật giữa các ngôn ngữ  hoặc      trả lời câu hỏi  về những lĩnh vực khác nhau  dù không được huấn luyện chuyên biệt cho nhiệm vụ đó , điều mà phiên bản tiền nhiệm GPT-2 (chỉ 1,5 tỷ tham số) hầu như chưa làm được . Thậm chí, trong một số bài toán,  GPT-3 đạt độ chính xác tiệm cận hoặc vượt qua 1 2 3 4 4 5 5 6 7 8 9 10 11 11 1

### Chunk 0
Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini Các nghiên cứu quốc tế gần đây tập trung làm rõ vai trò và  ứng dụng thực tế của các mô hình ngôn ngữ lớn (LLM)  trong nhiều lĩnh vực. Nhìn chung, LLM hiện đại đã  tạo nên bước đột phá trong xử lý ngôn ngữ tự nhiên (NLP) , cho phép máy tính không chỉ hiểu và sinh ngôn ngữ mà còn  suy luận dựa trên ngôn ngữ . Những mô hình như  ChatGPT của OpenAI  và    Gemini của Google  đã mở rộng đáng kể khả năng của AI nhờ áp dụng các kỹ thuật tiên tiến – ví dụ như  học tăng cường từ phản hồi của con người (RLHF)  để nâng cao tính mạch lạc trong hội thoại, hay  kiến trúc đa phương thức  để xử lý đồng thời văn bản, hình ảnh, âm thanh – qua đó  mở rộng phạm vi ứng dụng của LLM  trong thực tiễn . Ngày nay, các công nghệ này  đa

### Chunk 11
g như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay. Những kết quả đạt được cho thấy  sự vượt trội của mô hình ngôn ngữ lớn  trong việc  xử lý ngôn ngữ tự nhiên và tư duy đa dạng , đồng thời nhấn mạnh  tiềm năng ứng dụng rộng rãi  của chúng vào thực tiễn (từ giáo dục, y tế đến tự động hóa nghiệp vụ). Song song, giới nghiên cứu cũng lưu ý về  những thách thức còn tồn tại  – từ việc cải thiện hiểu biết ngữ nghĩa, giảm thiểu sai lệch/hallucination  cho đến  tối ưu hóa chi phí tính toán  – nhằm tiếp tục hoàn thiện và  phát huy tối đa lợi ích của các mô hình LLM  trong

### Chunk 7
năng  thực hiện nhiều nhiệm vụ chỉ dựa trên một vài ví dụ hoặc thậm chí không cần ví dụ minh họa  (few-shot learning). Mô hình  hiểu yêu cầu từ ngữ cảnh  và tự suy luận để giải quyết nhiệm vụ, một năng lực tổng quát hóa mới chỉ xuất hiện khi mô hình đạt quy mô rất lớn (GPT-2 trở về trước chưa thể hiện rõ khả năng này) .  Hiệu năng trên các tác vụ NLP:  Không cần tinh chỉnh tham số cho từng bài toán cụ thể,  GPT-3 đã đạt kết quả xuất sắc trên nhiều nhiệm vụ NLP phổ biến  (như dịch máy, trả lời câu hỏi, điền từ vào chỗ trống). Thậm chí, mô hình  còn vượt qua các mô hình chuyên biệt  trong một số trường hợp, ví dụ  GPT-3 có thể dịch một câu từ tiếng Anh sang tiếng Pháp chỉ dựa trên ngữ cảnh mà vẫn chính xác tương đương mô hình dịch thuật được huấn luyện bài bản . Hạn chế:  Mặc dù rất mạnh mẽ,

### Chunk 9
iến trúc MoE) đang được triển khai nhằm  cải thiện hiệu quả tính toán , giúp mô hình  chạy nhanh hơn với chi phí thấp hơn . Nhìn sang  thế hệ mô hình mới hơn ,   ChatGPT  (dựa trên GPT-3.5/GPT-4, có áp dụng RLHF) và  Google Gemini  (mô hình đa phương thức tiên tiến) là hai đại diện nổi bật cho  nền tảng LLM thương mại vào năm 2025 . Cả hai đều thể hiện hiệu suất ấn tượng trên nhiều nhiệm vụ, nhưng  mỗi mô hình có thế mạnh riêng . Theo báo cáo của Google,  Gemini Ultra (phiên bản mạnh nhất của Gemini)  đã    vượt trội hơn các mô hình tương đương  trên nhiều thước đo tiêu chuẩn: ví dụ, Gemini Ultra  đạt kết quả cao hơn so với Claude 2, GPT-4 (ChatGPT) và Llama 2  trong các bài kiểm tra  GSM8K (đánh giá khả năng toán học) ,  HumanEval (đánh giá sinh mã lập trình)  và    MMLU (đánh giá hiểu bi
```

### src\pipeline\pipeline.module.ts

```ts
import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Module({
  providers: [PipelineService],
})
export class PipelineModule {}

```

### src\pipeline\pipeline.service.ts

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PipelineService {}

```
