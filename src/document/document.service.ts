import { ConsoleLogger, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { documents, DocumentStatus } from '@prisma/client';
import { AccessLevelDoc } from '../constant/index.constant';
import { UploadMetadataDto } from './dto/upload-document.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IngestJobData } from '../queue/ingest.processor';

@Injectable()
export class DocumentService {
  constructor(
    @InjectQueue('ingest-queue') private ingestQueue: Queue<IngestJobData>,
    private vectorService: VectorService,
    private prisma: PrismaService,
    private readonly logger: ConsoleLogger,
  ) { }

  //-- UPLOAD (Non-blocking with Queue) --
  async uploadFiles(
    userId: string,
    files: Express.Multer.File[],
    projectId?: string,
    metadata?: UploadMetadataDto,
  ): Promise<{ documents: documents[]; jobIds: string[] }> {
    const createdDocuments: documents[] = [];
    const jobIds: string[] = [];

    for (const file of files) {
      // 1. Create document record with PENDING status (immediate response)
      const document = await this.createDocument({
        projectId: projectId,
        originalName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        status: DocumentStatus.PENDING,
        userId: userId,
        accessLevel: metadata?.accessLevel || AccessLevelDoc.PRIVATE,
        viewCount: 0,
        pageCount: 0,
        authors: metadata?.authors || [],
        description: metadata?.description || '',
        publishedYear: metadata?.publishedYear || undefined,
        subjects: metadata?.subjects || [],
        tags: metadata?.tags || [],
        title: metadata?.title || path.parse(file.originalname).name,
        documentType: 'unknown',
      });

      createdDocuments.push(document);

      // 2. Add job to queue (non-blocking, processed by worker)
      const job = await this.ingestQueue.add(
        'process-document',
        {
          fileId: document.id,
          filePath: file.path,
          userId,
          projectId,
          originalFileName: file.originalname,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );

      jobIds.push(job.id || document.id);
      this.logger.log(`📤 Queued job ${job.id} for: ${file.originalname}`);
    }

    return { documents: createdDocuments, jobIds };
  }

  // -- REMOVE --
  async removeDocument(fileId: string, userId: string) {
    //  1. Check doc exists & Ownership
    const document = await this.prisma.documents.findUnique({
      where: { id: fileId },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (document.userId !== userId)
      throw new NotFoundException('Document not found');

    // 2. Remove vectors
    await this.vectorService.removeVectorByFileId(fileId);

    // 3. Delete physical file
    try {
      const absolutePath = path.resolve(process.cwd(), document.filePath);
      deleteFile(absolutePath);
    } catch (error) {
      console.error('⚠️ File delete error:', error);
      throw new NotFoundException('Delete file uploads error');
    }

    // 4. Delete Record => Cascade delete `project_resources`
    return await this.prisma.documents.delete({
      where: { id: fileId },
    });
  }

  // -- UNLINK DOCUMENT FROM PROJECT --
  async unlinkDocumentFromProject(docId: string, projId: string) {
    return await this.prisma.project_resources.deleteMany({
      where: {
        projectId: projId,
        documentId: docId,
      },
    });
  }

  // -- CREATE DOCUMENT MAPPING --
  async createDocument(documentDto: CreateDocumentDto) {
    // Validate project exists if projectId provided

    const document = await this.prisma.documents.create({
      data: {
        userId: documentDto.userId,
        title: documentDto.title,
        description: documentDto.description,
        authors: documentDto.authors,
        subjects: documentDto.subjects,
        tags: documentDto.tags,
        documentType: documentDto.documentType,
        publishedYear: documentDto.publishedYear,
        accessLevel: documentDto.accessLevel,

        originalName: documentDto.originalName,
        filePath: documentDto.filePath,
        mimeType: documentDto.mimeType,
        size: documentDto.size as number,
        pageCount: documentDto.pageCount,

        status: documentDto.status,
        viewCount: documentDto.viewCount,
      },
    });

    if (documentDto.projectId) {
      await this.prisma.project_resources.create({
        data: {
          projectId: documentDto.projectId,
          documentId: document.id,
          isSelected: true,
        },
      });
    }
    return document;
  }

  /**
    1. Check Project exists AND belongs to User
    2. Validate Documents (Security Check)
    3. Prepare data for bulk insert
    4. Create links
   */
  async addDocumentsToProject(
    userId: string,
    projectId: string,
    documentIds: string[],
  ) {
    // 1. Check Project exists AND belongs to User
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have permission to access it',
      );
    }

    // 2. Validate Documents (Security Check)
    const validDocuments = await this.prisma.documents.findMany({
      where: {
        id: { in: documentIds },
        OR: [
          { userId: userId }, // Của mình
          { accessLevel: AccessLevelDoc.PUBLIC }, // Hoặc thư viện công cộng
        ],
      },
      select: { id: true }, // Chỉ select ID cho nhẹ query
    });

    const validDocIds = validDocuments.map((doc) => doc.id);

    if (validDocIds.length === 0) {
      throw new NotFoundException(
        'No valid documents found to add (Check ownership or ID)',
      );
    }

    // 3. Prepare data for bulk insert
    const dataToInput = validDocIds.map((docId) => ({
      projectId: projectId,
      documentId: docId,
      isSelected: true,
    }));

    // 4. Update vector store and create DB links in parallel (Performance Optimization)
    const [_, result] = await Promise.all([
      this.vectorService.link2Project(validDocIds, projectId),
      this.prisma.project_resources.createMany({
        data: dataToInput,
        skipDuplicates: true,
      }),
    ]);

    return result;
  }

  async removeDocumentsOutProject(projectId: string, documentIds: string[]) {
    // Delete from vector store and database in parallel
    const [_, res] = await Promise.all([
      this.vectorService.removeOutProject(documentIds, projectId),
      this.prisma.project_resources.deleteMany({
        where: {
          projectId: projectId,
          documentId: { in: documentIds },
        },
      }),
    ]);
    return res;
  }

  // -- Unlink ALL DOCUMENTS IN PROJECT --
  async unlinkAllDocumentsInProject(projectId: string) {
    return await this.prisma.project_resources.deleteMany({
      where: {
        projectId: projectId,
      },
    });
  }

  // -- GET DOCUMENT IN PROJECT --
  async getDocumentsInProject(userId: string, projectId: string) {
    // Check exist project

    const docsRaw = await this.prisma.project_resources.findMany({
      where: { projectId: projectId, document: { userId: userId } },
      include: {
        document: {
          omit: { userId: true, indexedAt: true },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });


    // return docsRaw;
    return docsRaw.map((item) => {
      return {
        // 1. Các trường từ bảng trung gian (project_resources)
        addedAt: item.addedAt,
        isSelected: item.isSelected,
        linkId: item.id, //  sau này dùng chức năng "Unlink"

        // 2. Spread trực tiếp các trường của document ra ngoài
        ...item.document,
      };
    });
  }

  // -- GET DOCUMENT NOT IN PROJECT --
  async getDocumentsNotInProject(userId: string, projectId: string) {
    return await this.prisma.documents.findMany({
      where: {
        OR: [{ userId: userId }, { accessLevel: AccessLevelDoc.PUBLIC }],
        NOT: {
          linkedProjects: {
            some: { projectId: projectId },
          },
        },
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        createdAt: true,
        mimeType: true,
      },
      orderBy: {
        createdAt: 'desc', // Mới nhất lên đầu
      },
    });
  }

  // -- GET ALL DOCUMENTS --
  async getAllDocuments(userId: string) {
    return await this.prisma.documents.findMany({
      where: {
        userId: userId,
      },
      include: {
        linkedProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  // -- GET DOCUMENT DETAIL --
  async getDocumentDetail(userId: string, id: string) {
    return await this.prisma.documents.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        linkedProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  // -- UPDATE DOCUMENT --
  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto) {
    return await this.prisma.documents.update({
      where: { id: id },
      data: {
        title: updateDocumentDto.title,
      },
    });
  }
  // -- UPDATE DOCUMENT STATUS --
  async updateDocumentStatus(id: string, status: DocumentStatus) {
    // Validate status
    if (!Object.values(DocumentStatus).includes(status)) {
      throw new Error('Invalid status value');
    }

    return await this.prisma.documents.update({
      where: { id: id },
      data: {
        status: status,
      },
    });
  }
}
