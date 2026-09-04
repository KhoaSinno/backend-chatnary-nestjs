import { DocumentController } from './document.controller';
import { StreamableFile } from '@nestjs/common';
import { PassThrough } from 'node:stream';

describe('DocumentController', () => {
  it('returns created documents and ingest job IDs from upload', async () => {
    const uploadResult = { documents: [{ id: 'document-id' }], jobIds: ['job-id'] };
    const documentService = { uploadFiles: jest.fn().mockResolvedValue(uploadResult) };
    const controller = new DocumentController(documentService as never, {} as never);

    await expect(
      controller.uploadFiles(
        { user: { userId: 'user-id' } },
        [{ originalname: 'notes.pdf' }] as Express.Multer.File[],
        { projectId: 'project-id' },
      ),
    ).resolves.toEqual(uploadResult);

    expect(documentService.uploadFiles).toHaveBeenCalledWith(
      'user-id',
      expect.any(Array),
      'project-id',
      { projectId: 'project-id' },
    );
  });

  it('streams an authorized document with safe binary headers', async () => {
    const stream = new PassThrough();
    const documentFileService = {
      getFile: jest.fn().mockResolvedValue({
        stream,
        mimeType: 'application/pdf',
        filename: 'report.pdf',
        size: 42,
      }),
    };
    const response = { setHeader: jest.fn() };
    const controller = new DocumentController({} as never, documentFileService as never);

    const result = await controller.getDocumentFile(
      { user: { userId: 'user-id' } },
      'document-id',
      'attachment',
      response as never,
    );

    expect(result).toBeInstanceOf(StreamableFile);
    expect(documentFileService.getFile).toHaveBeenCalledWith('user-id', 'document-id');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('attachment; filename="report.pdf"'),
    );
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
  });
});
