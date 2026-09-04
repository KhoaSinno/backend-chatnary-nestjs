import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'color must be a string' })
  color?: string;

  @IsOptional()
  @IsBoolean({ message: 'isArchived must be a boolean' })
  isArchived?: boolean;

}
