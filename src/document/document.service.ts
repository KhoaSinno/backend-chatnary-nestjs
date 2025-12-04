import { ConsoleLogger, Injectable } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

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
    files: Express.Multer.File[],
    projectId?: string,
  ): Promise<void> {
    for (const file of files) {
      try {
        const chunksCount = await this.ingestService.ingestDocument(
          file.path,
          file.filename,
          projectId,
        );

        this.logger.log(
          `✅ Ingested ${chunksCount} chunks for: ${file.originalname}`,
        );

        // If ingestion successful (has chunks), save document record in DB
        if (chunksCount > 0) {
          await this.createDocument({
            projectId: projectId as string,
            name: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
            size: file.size,
            status: 'done',
          });
          this.logger.log(
            `📝 Document record created for: ${file.originalname}`,
          );
        } else {
          this.logger.warn(`⚠️ No chunks created for: ${file.originalname}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to ingest ${file.originalname}:`, error);
        // Optionally save with error status
        await this.createDocument({
          projectId: projectId as string,
          name: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: 'error',
        });
      }
    }
  }
  // -- REMOVE --
  async removeDocument(fileId: string) {
    await this.vectorService.removeVectorByFileId(fileId);
    deleteFile(path.join('uploads/documents', fileId));
    return fileId;
  }

  // -- CREATE DOCUMENT MAPPING --
  async createDocument(documentDto: CreateDocumentDto) {
    await this.prisma.project_documents.create({
      data: {
        projectId: documentDto.projectId,
        name: documentDto.name,
        filePath: documentDto.filePath,
        mimeType: documentDto.mimeType,
        size: documentDto.size,
        status: documentDto.status,
      },
    });
  }

  // -- GET DOCUMENT IN PROJECT --
  async getDocumentsInProject(projectId: string) {
    // Check exist project

    return await this.prisma.project_documents.findMany({
      where: { projectId: projectId },
    });
  }

  findAll() {
    return `This action returns all document`;
  }

  findOne(id: number) {
    return `This action returns a #${id} document`;
  }

  update(id: number, updateDocumentDto: UpdateDocumentDto) {
    return `This action updates a #${id} document`;
  }
}
