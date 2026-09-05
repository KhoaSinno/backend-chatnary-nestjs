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
  Sse,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatDto } from './dto/chat.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // -- CHAT STREAM --
  // Note: SSE uses GET, so we use Query params instead of Body
  @Sse('/stream')
  chatStream(
    @Req() req: { user: JwtPayloadWithRt },
    @Query('message') message: string,
    @Query('projectId') projectId?: string,
    @Query('chatId') chatId?: string,
  ) {
    // Debug: Log user info
    console.log('SSE Stream - req.user:', req.user);

    if (!req.user || !req.user.userId) {
      throw new Error('User not authenticated');
    }

    const chatDto: ChatDto = {
      message,
      projectId,
      chatId,
      userId: req.user.userId,
    };
    return this.chatService.chatStream(chatDto);
  }

  // -- CHAT LITE --
  @Post('/global')
  chatGlobal(
    @Req() req: { user: JwtPayloadWithRt },
    @Query('chatId') chatId: string | undefined,
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    chatDto.chatId = chatId;
    return this.chatService.chatGlobal(chatDto);
  }

  // -- CHAT HISTORY --
  @Post('/')
  chatHistory(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    return this.chatService.chatHistory(chatDto);
  }

  // -- GET CHAT DETAIL BY ID --
  @Get(':chatId/messages')
  getChatById(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.getChatById(req.user.userId, chatId);
  }

  // -- GET ALL USER CHATS --
  // @Get('/user/global')
  // getAllUserChat(@Req() req: { user: JwtPayloadWithRt }) {
  //   return this.chatService.getAllUserChat(req.user.userId);
  // }

  // -- GET GLOBAL USER CHATS --
  @Get('/user/global')
  getGlobalUserChat(@Req() req: { user: JwtPayloadWithRt }) {
    return this.chatService.getGlobalUserChat(req.user.userId);
  }

  // -- UPDATE CHAT: TITLE OR MOVE IN PROJECT --
  @Patch('/user/:id')
  update(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatService.update(req.user.userId, id, updateChatDto);
  }

  // -- DELETE CHAT --
  @Delete('/user/:id')
  remove(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    return this.chatService.remove(req.user.userId, id);
  }
}
