import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';

@Injectable()
export class DocumentService {
  constructor(private readonly ingestService: IngestService) {}

  async uploadFiles(files: Express.Multer.File[]): Promise<void> {
    for (const file of files) {
      await this.ingestService.ingestDocument(
        file.path,
        file.filename,
        undefined,
      );
    }
  }
  create(createDocumentDto: CreateDocumentDto) {
    return 'This action adds a new document';
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

  remove(id: number) {
    return `This action removes a #${id} document`;
  }
}
