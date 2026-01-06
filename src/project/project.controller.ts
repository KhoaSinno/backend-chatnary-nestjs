import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
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

@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly documentService: DocumentService,
  ) {}

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
    return await this.documentService.addDocumentsToProject(
      req.user.userId,
      projectId,
      dto.documentIds,
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
    body.chatId = chatId;
    body.userId = req.user.userId;
    body.projectId = projectId;
    // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
    return await this.projectService.chatMessageInProject(body);
  }

  // -- UPDATE PROJECT --
  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(id, updateProjectDto);
  }

  // -- DELETE PROJECT CASCADE --
  @Delete(':id')
  removeProject(@Param('id') id: string) {
    return this.projectService.removeProject(id);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(+id);
  }
}
