import { IsNotEmpty } from 'class-validator';
export class ChatDto {
  userId?: string;
  chatId?: string;
  projectId?: string;

  @IsNotEmpty()
  message: string;

  title?: string;
}
