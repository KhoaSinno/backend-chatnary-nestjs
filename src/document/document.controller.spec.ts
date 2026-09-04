import { DocumentController } from './document.controller';

describe('DocumentController', () => {
  it('returns created documents and ingest job IDs from upload', async () => {
    const uploadResult = { documents: [{ id: 'document-id' }], jobIds: ['job-id'] };
    const documentService = { uploadFiles: jest.fn().mockResolvedValue(uploadResult) };
    const controller = new DocumentController(documentService as never);

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
});
