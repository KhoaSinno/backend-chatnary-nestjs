import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ChatDto } from '../chat/dto/chat.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';
import { DocumentService } from '../document/document.service';
import { AddDocumentToProjectDto } from '../document/dto/add-doc2pj.dto';
import { InviteMemberDto } from './dto/inviteMem-project.dto';
import { ProjectRole } from '@prisma/client';

@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly documentService: DocumentService,
  ) { }

  // -- CREATE --
  @Post()
  createNewProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() createProjectDto: CreateProjectDto,
  ) {
    createProjectDto.userId = req.user.userId;
    return this.projectService.createNewProject(createProjectDto);
  }

  // -- ADD DOCUMENTS TO PROJECT --
  @Post('/:projectId/documents')
  async addDocumentsToProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Body() dto: AddDocumentToProjectDto,
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, projectId, ProjectRole.EDITOR);
    return await this.documentService.addDocumentsToProject(
      req.user.userId,
      projectId,
      dto.documentIds,
    );
  }

  // -- REMOVE DOUCMENTS TO PROJECT -- 
  @Delete('/:projectId/documents/unlink')
  async removeDocumentsOutProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Body() dto: AddDocumentToProjectDto,
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, projectId, ProjectRole.EDITOR);
    return await this.documentService.removeDocumentsOutProject(
      // req.user.userId,
      projectId,
      dto.documentIds,
    );
  }

  // -- INVITE MEMBER --
  @Post('/:projectId/members')
  async inviteMember(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Body() dto: InviteMemberDto,
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, projectId, ProjectRole.EDITOR);
    return await this.projectService.inviteMember(
      req.user.userId,
      projectId,
      dto
    );
  }

  // -- TOOGLE DOCS SELECTED -- 
  @Patch(':projectId/documents/:docId/toggle')
  async toggleDocumentSelection(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Param('docId') docId: string,
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, projectId, ProjectRole.EDITOR);

    // Check exist project and doc

    return await this.documentService.toggleDocumentSelection(
      req.user.userId,
      projectId,
      docId,
    );
  }

  // -- READ BY USERID --
  @Get('')
  findByUserId(@Req() req: { user: JwtPayloadWithRt }) {
    return this.projectService.findByUserId(req.user.userId);
  }

  // -- GET CHATS IN PROJECT --
  @Get('/:projectId/chats')
  async getChatsInProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, projectId, ProjectRole.VIEWER);


    // RETURN LIST OF CHATS IN A PROJECT
    return await this.projectService.getChatsInProject(
      req.user.userId,
      projectId,
    );
  }

  // -- GET DOCUMENTS IN PROJECT --
  @Get('/:projectId/documents')
  async getDocumentsProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, projectId, ProjectRole.VIEWER);

    return await this.projectService.getDocumentsInProject(
      req.user.userId,
      projectId,
    );
  }

  // -- GET CHAT IN PROJECTS --
  // @Get('/:projectId/chats/:chatId/messages')
  // async getChatDetailInProject(
  //   @Req() req: { user: JwtPayloadWithRt },
  //   @Param('projectId') projectId: string,
  //   @Param('chatId') chatId: string,
  // ) {
  //   // CHECK EXISTED
  //   //...

  //   // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
  //   return await this.projectService.getChatDetailInProject(
  //     req.user.userId,
  //     projectId,
  //     chatId,
  //   );
  // }

  // -- POST CHAT IN PROJECTS --
  @Post('/:projectId/chats/messages')
  async chatMessageInProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Query('chatId') chatId: string | undefined,
    @Body() body: ChatDto, // message
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, projectId, ProjectRole.VIEWER);

    body.chatId = chatId;
    body.userId = req.user.userId;
    body.projectId = projectId;

    // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
    return await this.projectService.chatMessageInProject(body);
  }

  // -- UPDATE PROJECT --
  @Patch(':id')
  async updateProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    await this.projectService.validateProjectAccess(req.user.userId, id, ProjectRole.EDITOR);
    return await this.projectService.updateProject(id, updateProjectDto);
  }

  // -- DELETE PROJECT CASCADE --
  @Delete(':id')
  async removeProject(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    await this.projectService.validateProjectAccess(req.user.userId, id, ProjectRole.OWNER);
    return await this.projectService.removeProject(id);
  }

}
