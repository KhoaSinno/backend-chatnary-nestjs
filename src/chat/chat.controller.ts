import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  // -- CHAT LITE --
  @Post('/lite')
  chatLite(@Headers('x-client-id') userId: string, @Body() ChatDto: ChatDto) {
    ChatDto.userId = userId;
    return this.chatService.chatLite(ChatDto);
  }
  // -- CHAT HISTORY --
  @Post('/')
  chatHistory(
    @Headers('x-client-id') userId: string,
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = userId;
    return this.chatService.chatHistory(chatDto);
  }
  // -- GET CHAT DETAIL BY ID --
  @Get(':id')
  getChatById(@Param('id') id: string) {
    return this.chatService.getChatById(id);
  }
  // -- GET ALL USER CHATS --
  @Get('/user/all')
  getAllUserChat(@Headers('x-client-id') userId: string) {
    return this.chatService.getAllUserChat(userId);
  }
  // -- UPDATE CHAT: TITLE --
  @Patch('/user/:id')
  update(
    @Headers('x-client-id') userId: string,
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatService.update(userId, id, updateChatDto);
  }

  // -- DELETE CHAT --
  @Delete('/user/:id')
  remove(@Headers('x-client-id') userId: string, @Param('id') id: string) {
    return this.chatService.remove(userId, id);
  }
}
