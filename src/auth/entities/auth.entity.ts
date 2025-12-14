import { ApiProperty } from '@nestjs/swagger';
import { users } from '@prisma/client';
export class AuthEntity {
  @ApiProperty()
  accessToken: string;

  user: Omit<users, 'password'>;
}
