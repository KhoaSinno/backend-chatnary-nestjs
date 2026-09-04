jest.mock('./splitters/text-splitter', () => ({
  TextSplitterService: class TextSplitterService {},
}));
jest.mock('./loaders/cloud.loader', () => ({
  CloudService: class CloudService {},
}));
jest.mock('./vector/vector.service', () => ({
  VectorService: class VectorService {},
}));

import { IngestService } from './ingest.service';

describe('IngestService', () => {
  it('returns non-empty parser pages separately from generated chunks', async () => {
    const cloudService = {
      load: jest.fn().mockResolvedValue([
        {
          pages: [
            { md: 'Page one', page: 1 },
            { md: '', page: 2 },
            { text: 'Page three', page: 3 },
          ],
        },
      ]),
    };
    const textSplitterService = {
      splitToMarkdown: jest.fn().mockResolvedValue([
        { content: 'Page one', chunkIndex: 0, metadata: { page: 1 } },
        { content: 'Page three', chunkIndex: 1, metadata: { page: 3 } },
        { content: 'Page three continued', chunkIndex: 2, metadata: { page: 3 } },
      ]),
    };
    const vectorService = { addDocuments: jest.fn().mockResolvedValue(undefined) };
    const service = new IngestService(
      cloudService as never,
      textSplitterService as never,
      vectorService as never,
    );

    await expect(
      service.ingestDocument('uploads/file.pdf', 'document-id', 'user-id', 'project-id', 'file.pdf'),
    ).resolves.toEqual({
      chunks: expect.any(Array),
      pageCount: 2,
    });

    expect(textSplitterService.splitToMarkdown).toHaveBeenCalledWith([
      { content: 'Page one', page: 1 },
      { content: 'Page three', page: 3 },
    ]);
  });
});
