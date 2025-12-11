import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './entities/auth.entity';
import { Public } from './decorators/public.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtPayloadWithRt } from './strategies/refresh.strategy';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refreshToken(@Req() req: { user: JwtPayloadWithRt }) {
    console.log(req);
    return this.authService.refreshToken(
      req.user.sub, // userId
      req.user.refreshToken, // refreshToken FE gửi lên
    );
  }

  @Post('logout')
  logout(@Headers('x-client-id') userId: string) {
    return this.authService.logout(userId);
  }
}
