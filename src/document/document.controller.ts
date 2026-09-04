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
  Headers,
  Req,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './oss';
import path from 'path';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';
import { ParseJsonPipe } from '../common/pipes/parse-json.pipe';
import { UploadMetadataDto } from './dto/upload-document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) { }

  // -- UPLOAD FILES --
  @Post('upload/files')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
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
    // @Body('projectId') projectId?: string,
    @Body('data', ParseJsonPipe) metadata: UploadMetadataDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    return this.documentService.uploadFiles(
      req.user.userId,
      files,
      metadata.projectId,
      metadata,
    );
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
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.updateDocument(
      req.user.userId,
      id,
      updateDocumentDto,
    );
  }
}
