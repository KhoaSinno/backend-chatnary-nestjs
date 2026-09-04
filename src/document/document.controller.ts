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
  StreamableFile,
  UploadedFiles,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentService } from './document.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './oss';
import path from 'path';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';
import { ParseJsonPipe } from '../common/pipes/parse-json.pipe';
import { UploadMetadataDto } from './dto/upload-document.dto';
import { DocumentFileService } from './document-file.service';

@Controller('document')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly documentFileService: DocumentFileService,
  ) { }

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

  @Get(':id/file')
  async getDocumentFile(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
    @Query('disposition') disposition: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const resolvedDisposition = disposition ?? 'inline';
    if (!['inline', 'attachment'].includes(resolvedDisposition)) {
      throw new BadRequestException('Invalid file disposition');
    }

    const file = await this.documentFileService.getFile(req.user.userId, id);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader(
      'Content-Disposition',
      this.createContentDisposition(resolvedDisposition, file.filename),
    );

    return new StreamableFile(file.stream);
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

  private createContentDisposition(
    disposition: string,
    filename: string,
  ): string {
    const fallback = filename.replace(/[\\"\r\n]/g, '_').replace(/[^\x20-\x7E]/g, '_');
    const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
  }
}
