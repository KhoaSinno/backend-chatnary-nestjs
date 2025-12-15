import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Login info no valid!' })
  @IsNotEmpty({ message: 'Login info no empty!' })
  @ApiProperty()
  email: string;

  @IsString({ message: 'Login info no valid!' })
  @IsNotEmpty({ message: 'Login info no empty!' })
  @MinLength(6, { message: 'Login info no valid!' })
  @ApiProperty()
  password: string;
}
