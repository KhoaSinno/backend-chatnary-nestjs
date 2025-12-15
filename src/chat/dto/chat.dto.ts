import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';
export class ChatDto {
  @IsString({ message: 'userId must be a string' })
  userId?: string;
  @IsString({ message: 'chatId must be a string' })
  chatId?: string;
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  @IsNotEmpty({ message: 'message should not be empty' })
  @IsString({ message: 'message must be a string' })
  @MaxLength(1000, { message: 'message must not exceed 1000 characters' })
  message: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 100 characters' })
  title?: string;
}
