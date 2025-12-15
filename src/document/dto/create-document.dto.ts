import {
  IsDate,
  IsEnum,
  IsInt,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccessLevelDoc } from '../../constant/index.constant';

export class CreateDocumentDto {
  @IsString({ message: 'projectId must be a string' })
  projectId: string;

  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsString({ message: 'filePath must be a string' })
  filePath: string;

  @IsString({ message: 'originalFileName must be a string' })
  mimeType?: string;

  @IsInt({ message: 'size must be an integer' })
  size?: number;

  @IsString({ message: 'status must be a string' })
  status: string;

  @IsString({ message: 'userId must be a string' })
  userId: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 255 characters' })
  title?: string;

  @IsString({ message: 'description must be a string' })
  @Length(1, 500, {
    message: 'description must be between 1 and 500 characters',
  })
  description?: string;

  @IsString({ each: true, message: 'each author must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each author must be at most 50 characters',
  })
  authors?: string[];

  @IsString({ each: true, message: 'each subject must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each subject must be at most 50 characters',
  })
  subjects?: string[];

  @IsString({ each: true, message: 'each tag must be a string' })
  @MaxLength(30, {
    each: true,
    message: 'each tag must be at most 30 characters',
  })
  tags?: string[];

  @IsString({ message: 'documentType must be a string' })
  documentType?: string;

  @IsInt({ message: 'publishedYear must be an integer' })
  publishedYear?: number;

  @IsEnum(AccessLevelDoc, { message: 'accessLevel must be a valid enum value' })
  accessLevel: AccessLevelDoc;

  metadata?: any;

  @IsDate({ message: 'indexedAt must be a valid date' })
  indexedAt?: Date;

  @IsInt({ message: 'viewCount must be an integer' })
  viewCount: number;
}
