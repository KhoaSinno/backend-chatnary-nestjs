import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthEntity } from './entities/auth.entity';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // -- REGISTER --
  async register(email: string, password: string) {
    // Check user exist
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) throw new ForbiddenException('User already exists');
    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Create user
    const newUser = await this.prisma.users.create({
      data: { email, password: passwordHash, username: email },
    });

    // Sign JWT
    const token = this.jwtService.sign({
      userId: newUser.id,
      email: newUser.email,
    });
    return { accessToken: token };
  }

  // -- LOGIN --
  async login(email: string, password: string): Promise<AuthEntity> {
    // Check user exist
    const user = await this.prisma.users.findUnique({
      where: { email },
    });
    if (!user) throw new Error('Invalid credentials');

    // Compare passwords
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) throw new ForbiddenException('Invalid credentials');
    // User no password in response
    const { password: _, ...userSafe } = user;

    // Sign JWT
    const token = this.jwtService.sign({ userId: user.id, email: user.email });
    return { accessToken: token, user: userSafe };
  }
}
