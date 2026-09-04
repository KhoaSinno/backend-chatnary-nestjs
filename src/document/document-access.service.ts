import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccessLevelDoc,
  Document,
  ProjectRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanReadProject(userId: string, projectId: string): Promise<void> {
    await this.getProjectRole(userId, projectId);
  }

  async assertCanEditProject(userId: string, projectId: string): Promise<void> {
    const role = await this.getProjectRole(userId, projectId);

    if (role === ProjectRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to edit this project');
    }
  }

  async assertCanReadDocument(
    userId: string,
    documentId: string,
  ): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId },
          { accessLevel: AccessLevelDoc.PUBLIC },
          {
            linkedProjects: {
              some: {
                project: {
                  OR: [
                    { userId },
                    {
                      projectMembers: {
                        some: { userId },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async assertCanManageDocument(
    userId: string,
    documentId: string,
  ): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  private async getProjectRole(
    userId: string,
    projectId: string,
  ): Promise<ProjectRole | 'OWNER'> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        userId: true,
        projectMembers: {
          where: { userId },
          select: { roleProject: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId === userId) {
      return 'OWNER';
    }

    const membership = project.projectMembers[0];
    if (!membership) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return membership.roleProject;
  }
}

