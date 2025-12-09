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
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ChatDto } from '../chat/dto/chat.dto';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // -- CREATE --
  @Post()
  createNewProject(
    @Headers('x-client-id') userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    createProjectDto.userId = userId;
    return this.projectService.createNewProject(createProjectDto);
  }

  // -- READ BY USERID --
  @Get('')
  findByUserId(@Headers('x-client-id') userId: string) {
    return this.projectService.findByUserId(userId);
  }

  // -- GET CHATS IN PROJECT --
  @Get('/:projectId/chats')
  async getChatsInProject(
    @Headers('x-client-id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    // RETURN LIST OF CHATS IN A PROJECT
    return await this.projectService.getChatsInProject(userId, projectId);
  }

  // -- GET DOCUMENTS IN PROJECT --
  @Get('/:projectId/documents')
  async getDocumentsProject(
    @Headers('x-client-id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return await this.projectService.getDocumentsInProject(userId, projectId);
  }

  // -- GET CHAT IN PROJECTS --
  @Get('/:projectId/chats/:chatId/messages')
  async getChatDetailInProject(
    @Headers('x-client-id') userId: string,
    @Param('projectId') projectId: string,
    @Param('chatId') chatId: string,
  ) {
    // CHECK EXISTED
    //...

    // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
    return await this.projectService.getChatDetailInProject(
      userId,
      projectId,
      chatId,
    );
  }

  // -- POST CHAT IN PROJECTS --
  @Post('/:projectId/chats/messages')
  async chatMessageInProject(
    @Headers('x-client-id') userId: string,
    @Param('projectId') projectId: string,
    @Query('chatId') chatId: string | undefined,
    @Body() body: ChatDto, // message
  ) {
    body.chatId = chatId;
    body.userId = userId;
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
