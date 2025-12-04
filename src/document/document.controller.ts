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
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './oss';
import path from 'path';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // -- UPLOAD FILES --
  @Post('upload/files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      dest: 'uploads/documents',
      storage: storage,
      limits: { fileSize: 20 * 1024 * 1024 },
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
    @Headers('x-client-id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('projectId') projectId?: string,
  ) {
    Logger.log('Uploaded files:', files);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    await this.documentService.uploadFiles(userId, files, projectId);
    return files.map((file) => ({
      url: `/uploads/documents/${file.filename}`,
    }));
  }

  // -- REMOVE --
  @Delete(':fileId')
  removeDocument(
    @Headers('x-client-id') userId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.documentService.removeDocument(fileId, userId);
  }

  // -- GET ALL DOCUMENTS --
  @Get()
  getAllDocuments(@Headers('x-client-id') userId: string) {
    return this.documentService.getAllDocuments(userId);
  }

  @Get(':id')
  getDocumentDetail(
    @Headers('x-client-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.documentService.getDocumentDetail(userId, id);
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
