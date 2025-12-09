import { ConsoleLogger, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { project_documents } from '@prisma/client';

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
