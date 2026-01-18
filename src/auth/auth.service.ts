import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthEntity, SafeUser } from './entities/auth.entity';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private config: ConfigService,
  ) { }

  // -- REGISTER --
  async register(registerDto: RegisterDto) {
    // Check user exist
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) throw new ForbiddenException('User already exists');
    // Hash password
    const passwordHash = bcrypt.hashSync(registerDto.password, 10);
    // random username
    const randomUsername = `user_${Math.random().toString(36).substring(2, 8)}`;
    // Create user
    await this.prisma.user.create({
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
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) throw new Error('Invalid credentials');

    // Compare passwords
    const isPasswordValid = bcrypt.compareSync(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) throw new ForbiddenException('Invalid credentials');

    // Sign JWT
    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role as string,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Build safe user object (exclude password, convert bigint to number)
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      refreshToken: user.refreshToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      storageUsed: Number(user.storageUsed),
      storageLimit: Number(user.storageLimit),
      isDeleted: user.isDeleted,
    };

    return {
      ...tokens,
      user: safeUser,
    };
  }

  // -- LOGOUT --
  async logout(userId: string): Promise<{ message: string }> {
    // Clean RT, add RT to blacklist
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // TODO: add old RT to blacklist: KeyToken table
    return { message: 'User logged out successfully' };
  }

  // -- REFRESH TOKEN --
  async refreshToken(userId: string, rt: string) {
    // Check user exist
    const user = await this.prisma.user.findUnique({
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

    await this.prisma.user.update({
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
        expiresIn: this.config.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtRefreshSecret,
        expiresIn: this.config.get('jwtRefresh.expiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
