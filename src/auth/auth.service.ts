import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthEntity } from './entities/auth.entity';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../constant/index.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // -- REGISTER --
  async register(registerDto: RegisterDto) {
    // Check user exist
    const existingUser = await this.prisma.users.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) throw new ForbiddenException('User already exists');
    // Hash password
    const passwordHash = bcrypt.hashSync(registerDto.password, 10);
    // random username
    const randomUsername = `user_${Math.random().toString(36).substring(2, 8)}`;
    // Create user
    await this.prisma.users.create({
      data: {
        email: registerDto.email,
        password: passwordHash,
        username: randomUsername,
        role: Role.USER,
      },
    });

    // Sign JWT
    // const token = this.jwtService.sign({
    //   userId: newUser.id,
    //   email: newUser.email,
    // });

    return { message: 'User registered successfully' };
  }

  // -- LOGIN --
  async login(loginDto: LoginDto): Promise<AuthEntity> {
    // Check user exist
    const user = await this.prisma.users.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) throw new Error('Invalid credentials');

    // Compare passwords
    const isPasswordValid = bcrypt.compareSync(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) throw new ForbiddenException('Invalid credentials');

    // User no password in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = user;

    // Sign JWT
    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role as string,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user: userSafe };
  }

  // -- LOGOUT --
  async logout(userId: string): Promise<{ message: string }> {
    // Clean RT, add RT to blacklist
    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // TODO: add old RT to blacklist: KeyToken table
    return { message: 'User logged out successfully' };
  }

  // -- REFRESH TOKEN --
  async refreshToken(userId: string, rt: string) {
    // Check user exist
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }
    // Compare RT
    const isRtValid = bcrypt.compareSync(rt, user.refreshToken);
    if (!isRtValid) throw new ForbiddenException('Access Denied');

    // Get new AT - RT
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // -- UPDATE REFRESH TOKEN --
  async updateRefreshToken(userId: string, rt: string) {
    const hashedRt = bcrypt.hashSync(rt, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshToken: hashedRt },
    });
  }

  // -- HELPERS --
  async getTokens(userId: string, email: string, role: string = 'USER') {
    const payload = { userId, email, role };

    const jwtSecret = this.configService.get<string>('jwt.secret');
    const jwtRefreshSecret =
      this.configService.get<string>('jwtRefresh.secret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
