jest.mock('../ingest/ingest.service', () => ({
  IngestService: class IngestService {},
}));

import { DocumentStatus } from '@prisma/client';
import { IngestProcessor } from './ingest.processor';

describe('IngestProcessor', () => {
  it('marks a document as ERROR when parsing produces no chunks', async () => {
    const ingestService = {
      ingestDocument: jest.fn().mockResolvedValue({ chunks: [], pageCount: 0 }),
    };
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

  it('persists parser page count instead of the number of chunks', async () => {
    const ingestService = {
      ingestDocument: jest.fn().mockResolvedValue({
        chunks: Array.from({ length: 5 }, (_, chunkIndex) => ({
          content: `chunk ${chunkIndex}`,
          chunkIndex,
          metadata: {},
        })),
        pageCount: 2,
      }),
    };
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
    ).resolves.toBe(5);

    expect(prisma.document.update).toHaveBeenLastCalledWith({
      where: { id: 'document-id' },
      data: { status: DocumentStatus.DONE, pageCount: 2 },
    });
  });
});
