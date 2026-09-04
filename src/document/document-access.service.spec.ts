import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessLevelDoc, ProjectRole } from '@prisma/client';
import { DocumentAccessService } from './document-access.service';

describe('DocumentAccessService', () => {
  const prisma = {
    project: {
      findUnique: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
    },
  };

  let service: DocumentAccessService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new DocumentAccessService(prisma as never);
  });

  it('allows the project owner to upload', async () => {
    prisma.project.findUnique.mockResolvedValue({
      userId: 'owner-id',
      projectMembers: [],
    });

    await expect(
      service.assertCanEditProject('owner-id', 'project-id'),
    ).resolves.toBeUndefined();
  });

  it('allows an editor but rejects a viewer from upload', async () => {
    prisma.project.findUnique.mockResolvedValueOnce({
      userId: 'owner-id',
      projectMembers: [{ roleProject: ProjectRole.EDITOR }],
    });

    await expect(
      service.assertCanEditProject('editor-id', 'project-id'),
    ).resolves.toBeUndefined();

    prisma.project.findUnique.mockResolvedValueOnce({
      userId: 'owner-id',
      projectMembers: [{ roleProject: ProjectRole.VIEWER }],
    });

    await expect(
      service.assertCanEditProject('viewer-id', 'project-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a project outsider from reading', async () => {
    prisma.project.findUnique.mockResolvedValue({
      userId: 'owner-id',
      projectMembers: [],
    });

    await expect(
      service.assertCanReadProject('outsider-id', 'project-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permits a document owner and hides an unmanaged document', async () => {
    const ownedDocument = { id: 'document-id', userId: 'owner-id' };
    prisma.document.findFirst.mockResolvedValueOnce(ownedDocument);
    prisma.document.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.assertCanManageDocument('owner-id', 'document-id'),
    ).resolves.toEqual(ownedDocument);

    await expect(
      service.assertCanManageDocument('outsider-id', 'document-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('permits public documents and documents linked to a readable project', async () => {
    const publicDocument = { id: 'public-document', accessLevel: AccessLevelDoc.PUBLIC };
    const linkedDocument = { id: 'linked-document', accessLevel: AccessLevelDoc.PRIVATE };

    prisma.document.findFirst
      .mockResolvedValueOnce(publicDocument)
      .mockResolvedValueOnce(linkedDocument);

    await expect(
      service.assertCanReadDocument('reader-id', 'public-document'),
    ).resolves.toEqual(publicDocument);

    await expect(
      service.assertCanReadDocument('viewer-id', 'linked-document'),
    ).resolves.toEqual(linkedDocument);
  });
});

