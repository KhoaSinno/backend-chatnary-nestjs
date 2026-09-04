jest.mock('../ingest/ingest.service', () => ({
  IngestService: class IngestService {},
}));

import { DocumentStatus } from '@prisma/client';
import { IngestProcessor } from './ingest.processor';

describe('IngestProcessor', () => {
  it('marks a document as ERROR when parsing produces no chunks', async () => {
    const ingestService = { ingestDocument: jest.fn().mockResolvedValue([]) };
    const prisma = { document: { update: jest.fn().mockResolvedValue({}) } };
    const eventEmitter = { emit: jest.fn() };
    const processor = new IngestProcessor(
      ingestService as never,
      prisma as never,
      eventEmitter as never,
    );

    await expect(
      processor.process({
        id: 'job-id',
        data: { fileId: 'document-id', filePath: 'uploads/file.pdf', userId: 'user-id' },
      } as never),
    ).rejects.toThrow('No text chunks were extracted');

    expect(prisma.document.update).toHaveBeenLastCalledWith({
      where: { id: 'document-id' },
      data: expect.objectContaining({ status: DocumentStatus.ERROR }),
    });
  });
});
