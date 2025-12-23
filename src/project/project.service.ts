import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from '../chat/dto/chat.dto';
import { ChatService } from '../chat/chat.service';
import { DocumentService } from '../document/document.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly documentService: DocumentService,
  ) {}

  // -- CREATE NEW PROJECT --
  async createNewProject(createProjectDto: CreateProjectDto) {
    return await this.prisma.projects.create({
      data: createProjectDto,
    });
  }

  // -- FIND PROJECTS BY USER ID --
  async findByUserId(userId: string) {
    return await this.prisma.projects.findMany({
      where: { userId: userId },
    });
  }

  // -- GET CHATS IN PROJECT --
  async getChatsInProject(userId: string, projectId: string) {
    // Check existed
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, userId: userId },
    });
    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to user',
      );
    }

    return await this.prisma.chats.findMany({
      where: { projectId: projectId },
    });
  }

  // -- GET CHAT DETAIL IN PROJECT --
  async getChatDetailInProject(
    userId: string,
    projectId: string,
    chatId: string,
  ) {
    // TODO: CHECK EXISTED
    return await this.prisma.chats.findUnique({
      where: { id: chatId },
    });
  }

  // -- GET DOCUMENTS IN PROJECT --
  async getDocumentsInProject(userId: string, projectId: string) {
    // Check existed
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, userId: userId },
    });
    if (!project)
      throw new NotFoundException(
        'Project not found or does not belong to user',
      );

    return await this.documentService.getDocumentsInProject(projectId);
  }

  // -- POST CHAT IN PROJECTS --
  async chatMessageInProject(chatDto: ChatDto) {
    return await this.chatService.chatHistory(chatDto);
  }

  // -- UPDATE PROJECT --
  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    return await this.prisma.projects.update({
      where: { id: id },
      data: updateProjectDto,
    });
  }

  // -- DELETE PROJECT CASCADE --
  async removeProject(id: string) {
    // Get project info first (before delete)
    const project = await this.prisma.projects.findUnique({
      where: { id: id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Unlink all documents in project
    await this.documentService.unlinkAllDocumentsInProject(id);

    // Then delete project (cascade will delete DB records)
    const projectDel = await this.prisma.projects.delete({
      where: { id: id },
    });

    return projectDel;
  }

  findAll() {
    return `This action returns all project`;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }
}
