jest.mock('node:fs', () => {
  const actual = jest.requireActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    createReadStream: jest.fn(),
    promises: {
      ...actual.promises,
      stat: jest.fn(),
    },
  };
});

import { NotFoundException } from '@nestjs/common';
import { createReadStream, promises as fs } from 'node:fs';
import { PassThrough } from 'node:stream';
import { DocumentFileService } from './document-file.service';

describe('DocumentFileService', () => {
  const documentAccess = {
    assertCanReadDocument: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('authorizes before streaming a file from the upload root', async () => {
    const stream = new PassThrough();
    documentAccess.assertCanReadDocument.mockResolvedValue({
      id: 'document-id',
      filePath: 'uploads/documents/stored.pdf',
      mimeType: 'application/pdf',
      originalName: 'report.pdf',
    });
    (fs.stat as jest.Mock).mockResolvedValue({
      isFile: () => true,
      size: 42,
    });
    (createReadStream as jest.Mock).mockReturnValue(stream);

    const service = new DocumentFileService(documentAccess as never);
    const result = await service.getFile('user-id', 'document-id');

    expect(documentAccess.assertCanReadDocument).toHaveBeenCalledWith(
      'user-id',
      'document-id',
    );
    expect(result).toEqual({
      stream,
      mimeType: 'application/pdf',
      filename: 'report.pdf',
      size: 42,
    });
  });

  it('does not read a path outside the upload root', async () => {
    documentAccess.assertCanReadDocument.mockResolvedValue({
      id: 'document-id',
      filePath: '../secret.txt',
      mimeType: 'text/plain',
      originalName: 'secret.txt',
    });

    const service = new DocumentFileService(documentAccess as never);

    await expect(
      service.getFile('user-id', 'document-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(fs.stat).not.toHaveBeenCalled();
    expect(createReadStream).not.toHaveBeenCalled();
  });

  it('returns a safe not found error when the physical file is missing', async () => {
    documentAccess.assertCanReadDocument.mockResolvedValue({
      id: 'document-id',
      filePath: 'uploads/documents/missing.pdf',
      mimeType: 'application/pdf',
      originalName: 'missing.pdf',
    });
    (fs.stat as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

    const service = new DocumentFileService(documentAccess as never);

    await expect(
      service.getFile('user-id', 'document-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
