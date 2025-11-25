import { Injectable } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import path from 'path';

@Injectable()
export class DocumentService {
  constructor(
    private readonly ingestService: IngestService,
    private vectorService: VectorService,
  ) {}

  //-- UPLOAD --
  async uploadFiles(files: Express.Multer.File[]): Promise<void> {
    for (const file of files) {
      await this.ingestService.ingestDocument(
        file.path,
        file.filename,
        undefined,
      );
    }
  }
  // -- REMOVE --
  async removeDocument(fileId: string) {
    await this.vectorService.removeVectorByFileId(fileId);
    deleteFile(path.join('uploads/documents', fileId));
    return fileId;
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
