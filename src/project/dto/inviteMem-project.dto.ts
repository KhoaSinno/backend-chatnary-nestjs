import { ProjectRole } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsString({ message: 'email must be a string' })
  email: string;

  @IsEnum(ProjectRole, { message: 'roleProject must be a string' })
  roleProject: ProjectRole;
}
