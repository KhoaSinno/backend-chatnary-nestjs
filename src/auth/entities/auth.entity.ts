import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

// User type returned in auth responses (password excluded, bigint converted to number)
export interface SafeUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: Role;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  storageUsed: number;
  storageLimit: number;
  isDeleted: boolean;
}

export class AuthEntity {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: SafeUser;
}

