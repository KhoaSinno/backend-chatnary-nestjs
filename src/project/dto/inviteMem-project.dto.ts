import { ProjectRole } from '@prisma/client';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class InviteMemberDto {
  @IsString({ message: 'email must be a string' })
  email: string;

  @IsOptional()
  @IsEnum(ProjectRole, { message: 'roleProject must be a valid ProjectRole' })
  @Transform(({ value }) => value ?? ProjectRole.VIEWER)
  roleProject: ProjectRole = ProjectRole.VIEWER;
}
