import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'email not valid!' })
  email: string;

  @IsString({ message: 'username must be a string' })
  username: string;

  @IsString({ message: 'name must be a string' })
  name?: string;

  @IsString({ message: 'password must be a string' })
  password: string;
}
