import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { DocumentAccessService } from './document-access.service';

export interface DocumentFile {
  stream: Readable;
  mimeType: string;
  filename: string;
  size: number;
}

@Injectable()
export class DocumentFileService {
  private readonly uploadRoot = path.resolve(
    process.cwd(),
    'uploads',
    'documents',
  );

  constructor(private readonly documentAccess: DocumentAccessService) {}

  async getFile(userId: string, documentId: string): Promise<DocumentFile> {
    const document = await this.documentAccess.assertCanReadDocument(
      userId,
      documentId,
    );
    const filePath = path.resolve(process.cwd(), document.filePath);

    if (!this.isWithinUploadRoot(filePath)) {
      throw new NotFoundException('Document file not found');
    }

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new NotFoundException('Document file not found');
      }

      return {
        stream: createReadStream(filePath),
        mimeType: document.mimeType || 'application/octet-stream',
        filename: document.originalName,
        size: stat.size,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Document file not found');
    }
  }

  private isWithinUploadRoot(filePath: string): boolean {
    const relativePath = path.relative(this.uploadRoot, filePath);
    return (
      relativePath !== '' &&
      !relativePath.startsWith('..' + path.sep) &&
      relativePath !== '..' &&
      !path.isAbsolute(relativePath)
    );
  }
}

