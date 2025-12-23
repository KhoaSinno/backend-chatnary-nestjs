import { ConsoleLogger, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { documents } from '@prisma/client';
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
      let document: documents | null = null;
      try {
        // Pre create document record with 'processing' status
        document = await this.createDocument({
          projectId: projectId as string,
          originalName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: 'processing',
          userId: userId,
          accessLevel: AccessLevelDoc.PRIVATE,
          viewCount: 0,
          pageCount: 0,
          authors: [],
          description: '',
          // publishedYear: null,
          subjects: [],
          tags: [],
          title: file.originalname,
          documentType: 'unknown',
        });

        const chunksCount = await this.ingestService.ingestDocument(
          file.path,
          document.id,
          userId,
          projectId,
          file.originalname,
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

  // -- Unlink ALL DOCUMENTS IN PROJECT --
  async unlinkAllDocumentsInProject(projectId: string) {
    return await this.prisma.project_resources.deleteMany({
      where: {
        projectId: projectId,
      },
    });
  }

  // -- GET DOCUMENT IN PROJECT --
  async getDocumentsInProject(projectId: string) {
    // Check exist project

    return await this.prisma.project_resources.findMany({
      where: { projectId: projectId },
      include: {
        document: true,
      },
      orderBy: {
        addedAt: 'desc',
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
  async updateDocumentStatus(id: string, status: string) {
    // Validate status
    if (!['processing', 'done', 'error'].includes(status)) {
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
