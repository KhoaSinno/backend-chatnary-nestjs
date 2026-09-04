import { ForbiddenException } from '@nestjs/common';
import { DocumentService } from './document.service';

describe('DocumentService upload authorization', () => {
  it('does not create a document or queue a job when project edit access is denied', async () => {
    const queue = { add: jest.fn() };
    const vectorService = {};
    const prisma = {
      document: { create: jest.fn() },
      projectResources: { create: jest.fn() },
    };
    const logger = { log: jest.fn() };
    const access = {
      assertCanEditProject: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('forbidden')),
    };

    const service = new DocumentService(
      queue as never,
      vectorService as never,
      prisma as never,
      logger as never,
      access as never,
    );

    await expect(
      service.uploadFiles(
        'outsider-id',
        [{ originalname: 'file.pdf' }] as Express.Multer.File[],
        'project-id',
        { projectId: 'project-id' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.document.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });
});

