import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'SignUp info no valid!' })
  @IsNotEmpty({ message: 'SignUp info no empty!' })
  @ApiProperty()
  email: string;

  @IsString({ message: 'SignUp info no valid!' })
  @IsNotEmpty({ message: 'SignUp info no empty!' })
  @MinLength(6, { message: 'SignUp info no valid!' })
  @ApiProperty()
  password: string;
}
