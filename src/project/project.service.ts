import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from '../chat/dto/chat.dto';
import { ChatService } from '../chat/chat.service';
import { DocumentService } from '../document/document.service';
import { InviteMemberDto } from './dto/inviteMem-project.dto';
import { Role, ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly documentService: DocumentService,
  ) { }

  // -- CREATE NEW PROJECT --
  async createNewProject(createProjectDto: CreateProjectDto, userId: string) {
    return await this.prisma.project.create({
      data: { ...createProjectDto, userId },
      omit: { userId: true },
    });
  }

  // -- FIND PROJECTS BY USER ID --
  async findByUserId(userId: string) {
    return await this.prisma.project.findMany({
      where: {
        OR: [
          { userId: userId },
          {
            projectMembers: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        projectMembers: {
          include: {
            user: {
              select: { email: true, name: true }
            }
          }
        },
        _count: { select: { projectResources: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // -- INVITE MEMBER -- 
  async inviteMember(userId: string, projectId: string, inviteMemberDto: InviteMemberDto) {
    // == Check user's role can invite yet

    // == Check guest exist
    const guest = await this.prisma.user.findFirst({
      where: { email: inviteMemberDto.email },
    });
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    // == Add to project
    return await this.prisma.projectMembers.create({
      data: {
        projectId: projectId,
        userId: guest.id,
        roleProject: inviteMemberDto.roleProject,
      },
    });
  }

  // -- GET CHATS IN PROJECT --
  async getChatsInProject(userId: string, projectId: string) {
    return await this.prisma.chat.findMany({
      where: { projectId: projectId },
      omit: { userId: true, projectId: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -- GET CHAT DETAIL IN PROJECT --
  // async getChatDetailInProject(
  //   userId: string,
  //   projectId: string,
  //   chatId: string,
  // ) {
  //   // TODO: CHECK EXISTED
  //   return await this.prisma.chat.findUnique({
  //     where: { id: chatId, userId: userId, projectId: projectId },
  //     omit: { userId: true, projectId: true },
  //   });
  // }

  // -- GET DOCUMENTS IN PROJECT --
  async getDocumentsInProject(userId: string, projectId: string) {

    return await this.documentService.getDocumentsInProject(userId, projectId);
  }

  // -- POST CHAT IN PROJECTS --
  async chatMessageInProject(chatDto: ChatDto) {
    return await this.chatService.chatHistory(chatDto);
  }

  // -- UPDATE PROJECT --
  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    return await this.prisma.project.update({
      where: { id: id },
      data: updateProjectDto,
    });
  }

  // -- DELETE PROJECT CASCADE --
  async removeProject(id: string) {
    // Get project info first (before delete)
    const project = await this.prisma.project.findUnique({
      where: { id: id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Unlink all documents in project
    await this.documentService.unlinkAllDocumentsInProject(id);

    // Then delete project (cascade will delete DB records)
    const projectDel = await this.prisma.project.delete({
      where: { id: id },
    });

    return projectDel;
  }


  // ================= HELPER =================

  // Helper: Check quyền user trong project
  async validateProjectAccess(userId: string, projectId: string, requiredRole: ProjectRole) {
    // 1. Lấy thông tin member
    const member = await this.prisma.projectMembers.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: { project: true } // Lấy luôn info project để check owner gốc
    });

    // 2. Nếu không tìm thấy -> User không thuộc project này
    // Tuy nhiên, phải check trường hợp User là Owner gốc (trong bảng Projects)
    if (!member) {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (project && project.userId === userId) {
        return true; // Chủ project luôn có quyền
      }
      throw new ForbiddenException('Bạn không có quyền truy cập Project này');
    }

    // 3. Phân cấp quyền
    // Nếu yêu cầu VIEWER -> Ai cũng qua
    if (requiredRole === ProjectRole.VIEWER) return true;

    // Nếu yêu cầu EDITOR -> Phải là EDITOR hoặc OWNER
    if (requiredRole === ProjectRole.EDITOR) {
      if (member.roleProject === ProjectRole.VIEWER) throw new ForbiddenException('Quyền hạn không đủ (Cần Editor)');
      return true;
    }

    // Nếu yêu cầu OWNER
    if (requiredRole === ProjectRole.OWNER) {
      if (member.roleProject !== ProjectRole.OWNER) throw new ForbiddenException('Chỉ chủ sở hữu mới được thực hiện');
      return true;
    }
  }
}
