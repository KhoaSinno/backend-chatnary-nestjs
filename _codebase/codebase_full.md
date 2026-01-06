# Project Export

## Project Statistics

- Total files: 70

## Folder Structure

```
src
  app.controller.spec.ts
  app.controller.ts
  app.module.ts
  app.service.ts
  auth
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    decorators
      public.decorator.ts
      roles.decorator.ts
    dto
      login.dto.ts
      register.dto.ts
    entities
      auth.entity.ts
    guards
      jwt-auth.guard.ts
      jwt-refresh.guard.ts
      owner.guard.ts
      roles.guard.ts
    strategies
      jwt.strategy.ts
      refresh.strategy.ts
  chat
    chat.controller.ts
    chat.module.ts
    chat.service.ts
    dto
      chat.dto.ts
      update-chat.dto.ts
  common
    pipes
      parse-json.pipe.ts
  config
    env.config.ts
    pg.config.ts
  constant
    index.constant.ts
  document
    document.controller.ts
    document.module.ts
    document.service.ts
    dto
      add-doc2pj.dto.ts
      create-document.dto.ts
      update-document.dto.ts
      upload-document.dto.ts
    entities
      document.entity.ts
    oss.ts
  http-exception.filter.ts
  ingest
    ingest.module.ts
    ingest.service.ts
    loaders
      cloud.loader.ts
      ocr.loader.ts
      pdf.loader.ts
    splitters
      text-splitter.ts
    vector
      pgvector.client.ts
      vector.service.ts
  llm
    openai
      openai.module.ts
      openai.service.ts
  main.ts
  pipeline
    pipeline.module.ts
    pipeline.service.ts
  prisma
    prisma.module.ts
    prisma.service.ts
  project
    dto
      create-project.dto.ts
      update-project.dto.ts
    entities
      project.entity.ts
    project.controller.ts
    project.module.ts
    project.service.ts
  response.interceptor.ts
  retrieval
    retrieval.module.ts
    retrieval.service.ts
  user
    dto
      create-user.dto.ts
      update-user.dto.ts
    entities
      user.entity.ts
    user.controller.ts
    user.module.ts
    user.service.ts
prisma
  schema.prisma
package.json
API_ENDPOINTS.md

```

### src\app.controller.spec.ts

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});

```

### src\app.controller.ts

```ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }
}

```

### src\app.module.ts

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngestModule } from './ingest/ingest.module';
import { DocumentModule } from './document/document.module';
import { ChatModule } from './chat/chat.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { OpenaiModule } from './llm/openai/openai.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectModule } from './project/project.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { envConfig } from './config/env.config';
import { UserModule } from './user/user.module';
import * as Joi from 'joi';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { RetrievalModule } from './retrieval/retrieval.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file'; // Import if using rotation

@Module({
  imports: [
    // Serve static files from the "uploads" directory
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // PROJECT_ROOT/uploads
      serveRoot: '/uploads',
    }),
    // Environment configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: Joi.object({
        // API Keys
        OPENAI_API_KEY: Joi.string().required(),
        GOOGLE_API_KEY: Joi.string().optional(),

        // Database - Universal configuration (works with any PostgreSQL provider)
        DATABASE_URL: Joi.string().required(),
        DATABASE_DIRECT_URL: Joi.string().optional(), // For migrations (Neon, Supabase)

        // Database - Legacy individual parameters (optional, for backward compatibility)
        POSTGRES_HOST: Joi.string().optional(),
        POSTGRES_PORT: Joi.number().optional(),
        POSTGRES_DB: Joi.string().optional(),
        POSTGRES_USER: Joi.string().optional(),
        POSTGRES_PASSWORD: Joi.string().optional(),

        // Database - Connection pool settings (optional)
        DB_POOL_MAX: Joi.number().optional(),
        DB_POOL_MIN: Joi.number().optional(),
        DB_POOL_IDLE_TIMEOUT: Joi.number().optional(),
        DB_POOL_CONNECTION_TIMEOUT: Joi.number().optional(),
        DB_KEEPALIVE: Joi.boolean().optional(),
        DB_KEEPALIVE_DELAY: Joi.number().optional(),
        DB_SSL: Joi.boolean().optional(),
        DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().optional(),

        // PGVector settings (optional)
        PGVECTOR_TABLE: Joi.string().optional(),
        PGVECTOR_DISTANCE_STRATEGY: Joi.string()
          .valid('cosine', 'innerProduct', 'euclidean')
          .optional(),

        // JWT Authentication
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().optional().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().optional(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().optional().default('7d'),

        // Server configuration
        PORT: Joi.number().optional().default(8000),
        NODE_ENV: Joi.string()
          .valid('dev', 'prod', 'test')
          .optional()
          .default('dev'),

        // Model configuration
        GEMINI_MODEL: Joi.string().optional(),
        EMBEDDING_MODEL: Joi.string().optional(),

        // Performance settings
        API_TIMEOUT: Joi.number().optional(),
        RETRIEVER_K: Joi.number().optional(),
        MAX_HISTORY_MESSAGES: Joi.number().optional(),

        // Logging
        LOG_LEVEL: Joi.string()
          .valid('ERROR', 'WARN', 'INFO', 'DEBUG')
          .optional()
          .default('INFO'),
      }),
    }),
    WinstonModule.forRoot({
      transports: [
        // 1. Log to Console (so you can still see them while developing)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(), // Add colors for console
            winston.format.printf(
              ({ timestamp, level, message, context, ms }: any) => {
                return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${ms}`;
              },
            ),
          ),
        }),

        // 2. Save Errors to a separate file
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(), // JSON format is better for parsing later
          ),
        }),

        // 2.1 Save log dev to a separate file
        new winston.transports.File({
          filename: 'logs/dev.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(), // JSON format is better for parsing later
          ),
        }),

        // 3. Save ALL logs (info, debug, error) to a daily rotating file
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true, // Zip old logs to save space
          maxSize: '20m',
          maxFiles: '14d', // Keep logs for 14 days
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    // Application modules
    IngestModule,
    DocumentModule,
    ChatModule,
    PipelineModule,
    OpenaiModule,
    PrismaModule,
    ProjectModule,
    AuthModule,
    UserModule,
    RetrievalModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    // JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Role-based access control guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

```

### src\app.service.ts

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return { message: 'Hello from Chatnary', data: 'Hi' };
    // throw new Error('Not implemented');
  }
}

```

### src\auth\auth.controller.ts

```ts
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
import { JwtPayload, JwtPayloadWithRt } from './strategies/refresh.strategy';

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
      req.user.userId,
      req.user.refreshToken,
    );
  }

  @Post('logout')
  logout(@Req() req: { user: JwtPayload }) {
    return this.authService.logout(req.user.userId);
  }
}

```

### src\auth\auth.module.ts

```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.getOrThrow<string>('jwt.secret'),
          signOptions: {
            expiresIn: config.getOrThrow('jwt.expiresIn'),
          },
        };
      },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy],
})
export class AuthModule {}

```

### src\auth\auth.service.ts

```ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthEntity } from './entities/auth.entity';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../constant/index.constant';
import { $Enums } from '@prisma/client';

type UserType = {
  id: string;
  name: string | null;
  role: $Enums.Role;
  email: string;
  username: string;
  password: string;
  refreshToken: string | null;
  storageUsed: bigint;
  storageLimit: bigint;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private config: ConfigService,
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
    const { password: _, storageUsed, storageLimit, ...userSafe } = user;

    // Sign JWT
    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role as string,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        ...userSafe,
        storageUsed: Number(storageUsed),
        storageLimit: Number(storageLimit),
      } as unknown as UserType,
    };
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

```

### src\auth\decorators\public.decorator.ts

```ts
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('isPublic', true);

```

### src\auth\decorators\roles.decorator.ts

```ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../constant/index.constant';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

```

### src\auth\dto\login.dto.ts

```ts
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

```

### src\auth\dto\register.dto.ts

```ts
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

```

### src\auth\entities\auth.entity.ts

```ts
import { ApiProperty } from '@nestjs/swagger';
import { users } from '@prisma/client';
export class AuthEntity {
  @ApiProperty()
  accessToken: string;

  user: Omit<users, 'password'>;
}

```

### src\auth\guards\jwt-auth.guard.ts

```ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // const request = context.switchToHttp().getRequest();
    // const url = request.url;

    // // Except route: docs/ static
    // // ⭐ 1. Cho phép Swagger public
    // if (url.startsWith('/api/v1/docs') || url.startsWith('/api/v1/docs')) {
    //   return true;
    // }

    // ⭐ 2. Cho phép các route được đánh dấu @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

```

### src\auth\guards\jwt-refresh.guard.ts

```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  // canActivate(context: ExecutionContext) {
  //   return super.canActivate(context);
  // }
  // handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
  //   return super.handleRequest(err, user, info, context);
  // }
}

```

### src\auth\guards\owner.guard.ts

```ts
// Prevent out side admin role access
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly getOwnerIdFn: (req) => Promise<string>) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.userId;
    const ownerId = await this.getOwnerIdFn(req);

    if (ownerId !== userId && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Not allowed: not owner');
    }

    return true;
  }
}

// Usage example: restrict to use global
// @UseGuards(new OwnerGuard(async (req) => {
//   const doc = await this.documentService.findOne(req.params.id);
//   return doc.ownerId;
// }))

```

### src\auth\guards\roles.guard.ts

```ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../constant/index.constant';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required, allow access
    }

    // Check user role
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('User not found in request');

    if (!requiredRoles.includes(Role[user.role])) {
      throw new ForbiddenException('Access Denied: Insufficient role');
    }
    return true;
  }
}

```

### src\auth\strategies\jwt.strategy.ts

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './refresh.strategy';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    const secret = configService.getOrThrow<string>('jwt.secret');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return payload; // Attach to req.user
  }
}

```

### src\auth\strategies\refresh.strategy.ts

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}
// Return value
export interface JwtPayloadWithRt extends JwtPayload {
  refreshToken: string;
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    const secret =
      configService.get<string>('jwtRefresh.secret') ||
      process.env.JWT_REFRESH_SECRET;

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured!');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithRt {
    const authHeader = req.headers['authorization'] as string;
    const refreshToken = authHeader?.replace('Bearer ', '').trim();

    // return {
    //   sub: payload.sub || payload.userId,
    //   userId: payload.userId || payload.sub,
    //   email: payload.email,
    //   refreshToken,
    // };
    return { ...payload, refreshToken };
  }
}

```

### src\chat\chat.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatDto } from './dto/chat.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // -- CHAT LITE --
  @Post('/global')
  chatGlobal(
    @Req() req: { user: JwtPayloadWithRt },
    @Query('chatId') chatId: string | undefined,
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    chatDto.chatId = chatId;
    return this.chatService.chatGlobal(chatDto);
  }

  // -- CHAT HISTORY --
  @Post('/')
  chatHistory(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() chatDto: ChatDto,
  ) {
    chatDto.userId = req.user.userId;
    return this.chatService.chatHistory(chatDto);
  }

  // -- GET CHAT DETAIL BY ID --
  @Get(':chatId/messages')
  getChatById(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.getChatById(req.user.userId, chatId);
  }

  // -- GET ALL USER CHATS --
  // @Get('/user/global')
  // getAllUserChat(@Req() req: { user: JwtPayloadWithRt }) {
  //   return this.chatService.getAllUserChat(req.user.userId);
  // }

  // -- GET GLOBAL USER CHATS --
  @Get('/user/global')
  getGlobalUserChat(@Req() req: { user: JwtPayloadWithRt }) {
    return this.chatService.getGlobalUserChat(req.user.userId);
  }

  // -- UPDATE CHAT: TITLE OR MOVE IN PROJECT --
  @Patch('/user/:id')
  update(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatService.update(req.user.userId, id, updateChatDto);
  }

  // -- DELETE CHAT --
  @Delete('/user/:id')
  remove(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    return this.chatService.remove(req.user.userId, id);
  }
}

```

### src\chat\chat.module.ts

```ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { OpenaiService } from '../llm/openai/openai.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [RetrievalModule],
  controllers: [ChatController],
  providers: [ChatService, OpenaiService, PrismaService],
})
export class ChatModule {}

```

### src\chat\chat.service.ts

```ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OpenaiService } from '../llm/openai/openai.service';
import { ChatDto } from './dto/chat.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ContentBlock } from '@langchain/core/messages';
import {
  RetrievalService,
  ScoredDocument,
} from '../retrieval/retrieval.service';
import path from 'node:path';

type MessageType = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CitationType = {
  index: number;
  snippet: string;
  text: string;
  fileId: string;
  fileUrl: string;
  page: number;
  startOffset: number;
  endOffset: number;
  score?: number;
  projectId: string;
};

type BaseMessage =
  | {
      answer: string;
      citations?: undefined;
      chat?: undefined;
    }
  | {
      answer: string | (ContentBlock | ContentBlock.Text)[];
      citations: CitationType[];
      // chat: {
      //   id: string;
      //   userId: string;
      //   title: string;
      //   messages: JsonValue[];
      //   createdAt: Date;
      //   updatedAt: Date;
      //   projectId: string | null;
      // };
      chatId: string;
    };

// 1. Grouping: Gom các chunk về theo từng File
// Mục đích: Không để chunk của file A nằm xen kẽ file B, gây lú ngữ cảnh.
type FileGroup = {
  fileId: string;
  fileName: string; // Để hiển thị cho LLM hiểu
  maxScore: number; // Điểm cao nhất mà file này đạt được (để đánh giá độ quan trọng của cả file)
  chunks: { content: string; index: number; score: number }[];
};
@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
  ) {}

  // -- CORE CHAT FUNCTIONALITY --
  private async chatUtil(chatDto: ChatDto): Promise<BaseMessage> {
    // -- VALIDATIONS -- TODO: update with joi

    const historyNum = 6;

    // Ensure chat exists
    const chatId = await this.ensureChatExists(chatDto.chatId, chatDto);

    // Rewrite question to standalone if chatId provided
    let finalQuestion = chatDto.message;

    const historyMessages = await this.prisma.chats.findUnique({
      where: { id: chatId },
      select: { messages: true },
    });

    const contentHistory: MessageType[] = (
      (historyMessages?.messages ?? []) as MessageType[]
    )
      .slice(-historyNum)
      .filter((m) => m.role && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    if (contentHistory.length > 0) {
      finalQuestion = await this.createStandaloneQuestion(
        contentHistory,
        chatDto.message,
      );
    }

    // -- HELPER: Call Retrieve and Rerank, sorted doc's score--
    const scoredDocs = await this.callRetrieveAndRerank(
      finalQuestion,
      chatDto.userId as string,
      chatDto.projectId as string,
    );

    // Handle case when no documents found
    // Xử lý trường hợp không có tài liệu nào
    if (!scoredDocs || scoredDocs.length === 0) {
      // Return with not save
      return {
        answer:
          'Tôi không tìm thấy thông tin nào phù hợp trong tài liệu của bạn để trả lời câu hỏi này.',
      };
    }

    // Debug: Log kết quả sau khi Rerank
    console.log(`📋 Top ${scoredDocs.length} Documents after Rerank:`);
    scoredDocs.slice(0, 3).forEach((doc, idx) => {
      console.log(
        `  ${idx + 1}. [Score=${doc.finalScore?.toFixed(3)}] ${doc.pageContent.substring(0, 50)}...`,
      );
    });

    // -- HELPER: Create File Groups from Scored Docs --
    const fileGroups = this.createFileGroups(scoredDocs);

    // -- HELPER: Create Context from File Groups --
    const contextStr = this.createContextFromFileGroups(fileGroups);
    console.log('Final Context passed to LLM:\n', contextStr);

    // -- HELPER: Create final inputLlm for LLM --
    const inputLlm = this.createFinalInputLlm(
      contextStr,
      chatDto.message,
      contentHistory,
    );

    // Call LLM
    const response = await this.openaiService.getChatModel().invoke(inputLlm);
    const aiAnswer = response.content as string;

    // ---------------------------------------------------------
    // 5. PREPARE CITATIONS (FE will controll it)
    // ---------------------------------------------------------
    // Map từ ScoredDocument sang CitationType
    const citations: CitationType[] = scoredDocs.map((doc) => ({
      index: doc.metadata.chunkIndex as number,
      snippet: doc.pageContent.substring(0, 150) + '...', // Preview ngắn
      text: doc.pageContent,
      fileId: doc.metadata.fileId as string,
      // Fallback các trường metadata nếu thiếu
      fileUrl: (doc.metadata.fileUrl as string) || '',
      page: (doc.metadata.page as number) || 0,
      score: doc.finalScore, // Trả về score để FE có thể hiện độ tin cậy
      startOffset: (doc.metadata.startOffset as number) || 0,
      endOffset: (doc.metadata.endOffset as number) || 0,
      projectId: doc.metadata.projectId as string,
    }));

    // ---------------------------------------------------------
    // 6. SAVE & RETURN
    // ---------------------------------------------------------
    const updatedMessages = [
      ...((historyMessages?.messages as MessageType[]) || []),
      { role: 'user', content: chatDto.message },
      {
        role: 'assistant',
        content: aiAnswer,
        citation: citations,
      },
    ];

    // Update async
    this.prisma.chats
      .update({
        where: { id: chatId },
        data: { messages: updatedMessages },
      })
      .catch((err) => {
        console.error('Error updating chat messages:', err);
      });

    return {
      answer: aiAnswer,
      citations,
      chatId: chatId!,
    };
  }

  // -- PUBLIC CHAT FUNC --
  async chatGlobal(chatDto: ChatDto) {
    return await this.chatUtil(chatDto);
  }

  // -- Chat history --
  async chatHistory(chatDto: ChatDto) {
    // -- VALIDATIONS --
    // ... TODO: ...

    return await this.chatUtil(chatDto);
  }

  // -- HELPER FUNC FOR CHAT MANAGEMENT --
  private createFinalInputLlm(
    context: string,
    message: string,
    contentHistory: MessageType[],
  ) {
    // ---------------------------------------------------------
    // 3. PROMPT ENGINEERING (Tinh chỉnh cho Rerank)
    // ---------------------------------------------------------
    const SYSTEM_PROMPT = `
      Bạn là trợ lý AI chuyên nghiệp, nhiệm vụ là trả lời câu hỏi dựa trên các tài liệu được cung cấp.

      HƯỚNG DẪN XỬ LÝ THÔNG TIN:
      1. **Ưu tiên**: Các tài liệu được liệt kê đầu tiên trong Context là quan trọng nhất (đã được xếp hạng). Hãy dùng chúng làm cơ sở chính.
      2. **Tổng hợp**: Nếu thông tin nằm rải rác ở nhiều tài liệu, hãy tổng hợp lại một cách mạch lạc.
      3. **Mâu thuẫn**: Nếu các tài liệu mâu thuẫn nhau, hãy tin tưởng tài liệu có "Độ phù hợp" cao hơn (nằm trên cùng).
      4. **Trung thực**: Nếu không tìm thấy thông tin để trả lời, hãy nói "Tài liệu hiện tại không chứa thông tin về vấn đề này". Đừng bịa đặt.
      5. Nếu câu hỏi độc lập (rephrased) có vẻ sai lệch so với ý định ban đầu, hãy ưu tiên trả lời theo ngữ cảnh tài liệu tìm được.

      QUY TẮC: BẮT BUỘC TRÍCH DẪN (CITATION) :
      - Đã trích dẫn thì phải chính xác
      - Mọi thông tin đưa ra phải có dẫn chứng.
      - Sử dụng format **[#index]** ngay sau câu thông tin liên quan.
      - Ví dụ: "Doanh thu năm nay tăng 20% [#12]"
      - Chỉ sử dụng số index đã có trong context (Trích đoạn #...).
    `;

    const FINAL_USER_PROMPT = `
      CONTEXT TÀI LIỆU:
      ${context}

      ---
      CÂU HỎI CỦA TÔI: 
      ${message}
    `;

    // ---------------------------------------------------------
    // 4. HISTORY & LLM CALL (Logic giữ nguyên, chỉ thay đổi input)
    // ---------------------------------------------------------

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT.trim() },
      ...contentHistory,
      { role: 'user', content: FINAL_USER_PROMPT.trim() },
    ];

    return messages;
  }

  // -- CREATE CONTEXT --
  private createContextFromFileGroups(fileGroups: Map<string, FileGroup>) {
    // Sắp xếp các FILE theo độ quan trọng giảm dần
    const sortedFiles = Array.from(fileGroups.values()).sort(
      (a, b) => b.maxScore - a.maxScore,
    );

    // Tạo chuỗi Context mạch lạc
    const contextParts: string[] = [];

    sortedFiles.forEach((group) => {
      // Trong 1 file, sắp xếp chunk theo thứ tự xuất hiện (index) để đọc như văn bản thường
      group.chunks.sort((a, b) => a.index - b.index);

      // Header rõ ràng cho LLM nhận biết nguồn
      let fileContext = `--- NGUỒN TÀI LIỆU: "${group.fileName}" (Độ phù hợp: ${(group.maxScore * 100).toFixed(0)}%) ---\n`;

      fileContext += group.chunks
        .map((c) => `(Trích đoạn #${c.index}): ${c.content}`) // Format: (Trích đoạn #1): Nội dung
        .join('\n\n');

      contextParts.push(fileContext);
    });

    const context = contextParts.join('\n\n');

    return context;
  }

  // -- CREATE FILE GROUPS --
  private createFileGroups(
    scoredDocs: ScoredDocument[],
  ): Map<string, FileGroup> {
    // ---------------------------------------------------------
    // 2. CONTEXT CONSTRUCTION (Learn Logic from "NotebookLM")
    // ---------------------------------------------------------
    // Gom nhóm chunk theo File để LLM hiểu ngữ cảnh của từng tài liệu
    const fileGroups = new Map<string, FileGroup>();

    // Lưu ý: scoredDocs bây giờ là mảng object, không phải [doc, score] nữa
    scoredDocs.forEach((doc) => {
      // Lọc nhiễu cơ bản
      if (doc.pageContent.length < 30) return;

      const fileId = doc.metadata.fileId as string;
      const fileName =
        doc.metadata['originalFileName'] ||
        `File_${fileId?.substring(0, 5) ?? 'Unknown'}`;
      const chunkIndex = doc.metadata.chunkIndex as number;
      const score = doc.finalScore || 0;

      if (!fileGroups.has(fileId)) {
        fileGroups.set(fileId, {
          fileId,
          // remove extension from file name
          fileName: path.parse(fileName).name,
          maxScore: 0,
          chunks: [],
        });
      }

      const group = fileGroups.get(fileId)!;
      // Cập nhật maxScore để biết file nào quan trọng nhất
      // TODO: Nên lấy trung bình score của tất cả chunk trong file thay vì maxScore?
      if (score > group.maxScore) group.maxScore = score;

      group.chunks.push({
        content: doc.pageContent,
        index: chunkIndex,
        score: score,
      });
    });

    return fileGroups;
  }

  // -- CREATE SCORED DOCS --
  private async callRetrieveAndRerank(
    finalQuestion: string,
    userId: string,
    projectId?: string,
  ) {
    const scoredDocs: ScoredDocument[] =
      await this.retrievalService.retrieveAndRerank(
        finalQuestion,
        userId,
        projectId,
      );

    return scoredDocs;
  }

  // -- HELPER: Ensure chat exists or create it --
  private async ensureChatExists(chatId: string | undefined, chatDto: ChatDto) {
    let chatIdLocal = chatId;
    if (!chatId) {
      const created = await this.prisma.chats.create({
        data: {
          messages: [],
          userId: chatDto.userId as string,
          projectId: chatDto.projectId as string,
          // Title là câu hỏi được slice tròn câu để tránh quá dài
          title:
            chatDto.message.length > 50
              ? chatDto.message.slice(0, 50) + '...'
              : chatDto.message,
        },
      });
      chatIdLocal = created.id;
    }
    return chatIdLocal;
  }

  // -- HELPER: Rephrase question to standalone --
  private async createStandaloneQuestion(
    chatHistory: MessageType[],
    question: string,
  ) {
    if (!chatHistory || chatHistory.length === 0) return question;

    const historyContext = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const rephrasePrompt = `
    Dựa trên lịch sử trò chuyện và câu hỏi mới nhất của người dùng, hãy viết lại câu hỏi mới sao cho nó trở thành một câu hỏi ĐỘC LẬP, đầy đủ ngữ nghĩa mà không cần đọc lịch sử vẫn hiểu được.
    KHÔNG trả lời câu hỏi, chỉ viết lại hoặc giữ nguyên nếu đã rõ ràng.
    Ví dụ: 
    - History: "Ai là hiệu trưởng?" -> Current: "Ông ấy bao nhiêu tuổi?" -> Output: "Hiệu trưởng trường hiện tại bao nhiêu tuổi?"
    `;

    // Call llm
    const messages = [
      { role: 'system', content: rephrasePrompt.trim() },
      {
        role: 'user',
        content: `HISTORY:\n${historyContext}\n\nCURRENT QUESTION:\n${question}`,
      },
    ];

    const rewrittenQuestion = await this.openaiService
      .getRewriteModel()
      .invoke(messages)
      .then((res) => res.content as string);

    return rewrittenQuestion;
  }

  // -- Get all user chats --
  // async getAllUserChat(userId: string) {
  //   return await this.prisma.chats.findMany({
  //     orderBy: { updatedAt: 'desc' },
  //     where: { userId },
  //     omit: { messages: true, userId: true },
  //   });
  // }

  // -- Get global user chats --
  async getGlobalUserChat(userId: string) {
    return await this.prisma.chats.findMany({
      orderBy: { updatedAt: 'desc' },
      where: { userId, projectId: null },
      omit: { messages: true, userId: true },
    });
  }

  // -- Get Chat by ID --
  async getChatById(userId: string, chatId: string) {
    return await this.prisma.chats.findUnique({
      where: { id: chatId, userId },
    });
  }

  // -- Update chat (title, or move in project) --
  async update(userId: string, id: string, updateChatDto: UpdateChatDto) {
    return await this.prisma.chats.update({
      where: { id, userId },
      data: updateChatDto,
      omit: { userId: true, messages: true },
    });
  }

  // -- Delete chat --
  async remove(userId: string, id: string) {
    const chat = await this.prisma.chats.findUnique({
      where: { id },
    });
    if (!chat) throw new BadRequestException('Chat not found');
    if (chat.userId !== userId)
      throw new ForbiddenException('User Unauthorized!');

    return await this.prisma.chats.delete({
      where: { id },
      omit: { userId: true, messages: true },
    });
  }
}

```

### src\chat\dto\chat.dto.ts

```ts
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';
export class ChatDto {
  @IsString({ message: 'userId must be a string' })
  userId?: string;
  @IsString({ message: 'chatId must be a string' })
  chatId?: string;
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  @IsNotEmpty({ message: 'message should not be empty' })
  @IsString({ message: 'message must be a string' })
  @MaxLength(1000, { message: 'message must not exceed 1000 characters' })
  message: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 100 characters' })
  title?: string;
}

```

### src\chat\dto\update-chat.dto.ts

```ts
import { IsString } from 'class-validator';

export class UpdateChatDto {
  @IsString({ message: 'title must be a string' })
  title?: string;

  @IsString({ message: 'projectId must be a string' })
  projectId?: string | null;
}

```

### src\common\pipes\parse-json.pipe.ts

```ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Nếu value không tồn tại hoặc không phải string, trả về undefined hoặc giữ nguyên
    if (!value || typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException(
        `Invalid JSON string in field ${metadata.data}`,
      );
    }
  }
}

```

### src\config\env.config.ts

```ts
export const envConfig = () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  database: {
    // Flexible: works with any PostgreSQL provider (Neon, Supabase, Docker, etc.)
    url: process.env.DATABASE_URL,
    // Optional: for migrations (required by some providers like Neon)
    directUrl: process.env.DATABASE_DIRECT_URL,
    // Connection pool settings (optional, provider-specific)
    pooling: {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
      ),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  jwtRefresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
});

```

### src\config\pg.config.ts

```ts
import { DistanceStrategy } from '@langchain/community/vectorstores/pgvector';
import { PoolConfig } from 'pg';

/**
 * Universal PostgreSQL Vector Store Configuration
 * Works with: Neon, Supabase, Docker, AWS RDS, Google Cloud SQL, etc.
 *
 * Configuration is driven by environment variables for maximum flexibility.
 */

// Get database configuration based on DATABASE_URL or individual params
const getDatabaseConfig = (): PoolConfig => {
  const databaseUrl =
    process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

  // If DATABASE_URL exists, use it directly - pg Pool handles parsing
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,

      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(
        process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
      ),

      // Keepalive settings (important for cloud databases like NeonDB)
      keepAlive: process.env.DB_KEEPALIVE === 'true',
      keepAliveInitialDelayMillis: parseInt(
        process.env.DB_KEEPALIVE_DELAY || '10000',
      ),

      // SSL configuration - use sslmode from connection string or env var
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              rejectUnauthorized:
                process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
            }
          : undefined,
    };
  }

  // Fallback: individual connection parameters (legacy/Docker)
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(
      process.env.DB_POOL_CONNECTION_TIMEOUT || '10000',
    ),
    keepAlive: process.env.DB_KEEPALIVE === 'true',
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : undefined,
  };
};

/**
 * Universal PGVector configuration
 * Compatible with all PostgreSQL providers
 *
 * IMPORTANT: This must be a getter function to ensure environment variables
 * are loaded from ConfigModule before accessing them
 */
export const getPgConfig = () => ({
  postgresConnectionOptions: getDatabaseConfig(),
  tableName: process.env.PGVECTOR_TABLE || 'embeddings',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'embedding',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: (process.env.PGVECTOR_DISTANCE_STRATEGY ||
    'cosine') as DistanceStrategy,
});

/**
 * @deprecated Use getPgConfig() instead - lazy evaluation required for env vars
 */
export const pgConfig = getPgConfig();

/**
 * @deprecated Use getPgConfig() instead - it's now universal
 * Kept for backward compatibility
 */
export const getPgConfigNeon = getPgConfig;

```

### src\constant\index.constant.ts

```ts
export const PARENT_CHUNK_SIZE = 3000;
export const PARENT_CHUNK_OVERLAP = 300;

export const CHILD_CHUNK_SIZE = 900;
export const CHILD_CHUNK_OVERLAP = 150;

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

// Authorization

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  LIBRARIAN = 'LIBRARIAN',
  GUEST = 'GUEST',
}

export enum AccessLevelDoc {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED',
}

```

### src\document\document.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Logger,
  Headers,
  Req,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './oss';
import path from 'path';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';
import { ParseJsonPipe } from '../common/pipes/parse-json.pipe';
import { UploadMetadataDto } from './dto/upload-document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // -- UPLOAD FILES --
  @Post('upload/files')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      dest: 'uploads/documents',
      storage: storage,
      limits: { fileSize: 2000 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const extName = path.extname(file.originalname).toLowerCase();
        const allowedExts = [
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          '.txt',
        ];
        if (!allowedExts.includes(extName)) {
          return cb(
            new BadRequestException('Only document files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFiles(
    @Req() req: { user: JwtPayloadWithRt },
    @UploadedFiles() files: Express.Multer.File[],
    // @Body('projectId') projectId?: string,
    @Body('data', ParseJsonPipe) metadata?: UploadMetadataDto,
  ) {
    Logger.log('Uploaded files:', files);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    console.log('Metadata:', metadata);
    // Lúc này 'metadata' đã là Object xịn, có type đầy đủ, không cần parse thủ công
    console.log(metadata?.authors); // ['Nguyen Van A', 'Tran Van B']
    console.log(metadata?.publishedYear); // 2024 (Number)

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    await this.documentService.uploadFiles(
      req.user.userId,
      files,
      metadata?.projectId as string,
      metadata,
    );
    return files.map((file) => ({
      url: `/uploads/documents/${file.filename}`,
    }));
  }

  // -- REMOVE --
  @Delete(':fileId')
  removeDocument(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('fileId') fileId: string,
  ) {
    return this.documentService.removeDocument(fileId, req.user.userId);
  }

  // -- GET ALL DOCUMENTS --
  @Get()
  getAllDocuments(@Req() req: { user: JwtPayloadWithRt }) {
    return this.documentService.getAllDocuments(req.user.userId);
  }

  // -- GET DOCUMENT DETAIL BY USER --
  @Get(':id')
  getDocumentDetail(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('id') id: string,
  ) {
    return this.documentService.getDocumentDetail(req.user.userId, id);
  }

  //  -- UPDATE DOCUMENT --
  @Patch(':id')
  updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.updateDocument(id, updateDocumentDto);
  }
}

```

### src\document\document.module.ts

```ts
import { ConsoleLogger, Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { IngestModule } from '../ingest/ingest.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [IngestModule],
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService, ConsoleLogger],
  exports: [DocumentService],
})
export class DocumentModule {}

```

### src\document\document.service.ts

```ts
import { ConsoleLogger, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { IngestService } from '../ingest/ingest.service';
import { VectorService } from '../ingest/vector/vector.service';
import { deleteFile } from './oss';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { documents, DocumentStatus } from '@prisma/client';
import { AccessLevelDoc } from '../constant/index.constant';
import { UploadMetadataDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    private readonly ingestService: IngestService,
    private vectorService: VectorService,
    private prisma: PrismaService,
    private readonly logger: ConsoleLogger,
  ) {}

  //-- UPLOAD --
  async uploadFiles(
    userId: string,
    files: Express.Multer.File[],
    projectId?: string,
    metadata?: UploadMetadataDto,
  ): Promise<void> {
    for (const file of files) {
      let document: documents | null = null;
      try {
        // Pre create document record with 'processing' status
        document = await this.createDocument({
          projectId: projectId,
          originalName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: DocumentStatus.PROCESSING,
          userId: userId,
          accessLevel: metadata?.accessLevel || AccessLevelDoc.PRIVATE,
          viewCount: 0, // TODO: default 0
          pageCount: 0, // TODO: get real page count after OCR
          authors: metadata?.authors || [],
          description: metadata?.description || '',
          publishedYear: metadata?.publishedYear || undefined,
          subjects: metadata?.subjects || [],
          tags: metadata?.tags || [],
          title: metadata?.title || path.parse(file.originalname).name,
          documentType: 'unknown',
        });

        const chunks = await this.ingestService.ingestDocument(
          file.path,
          document.id,
          userId,
          projectId,
          file.originalname,
        );

        this.logger.log(
          `✅ Ingested ${chunks.length} chunks for: ${file.originalname}`,
        );

        // If ingestion successful (has chunks), save document record in DB
        if (chunks.length > 0) {
          // update 'done' status
          await this.updateDocumentStatus(document.id, DocumentStatus.DONE);

          this.logger.log(
            `📝 Document record created for: ${file.originalname}`,
          );
        } else {
          this.logger.warn(`⚠️ No chunks created for: ${file.originalname}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to ingest ${file.originalname}:`, error);
        // Optionally update 'error' status
        if (document) {
          await this.updateDocumentStatus(document.id, DocumentStatus.ERROR);
        }
      }
    }
  }

  // -- REMOVE --
  async removeDocument(fileId: string, userId: string) {
    //  1. Check doc exists & Ownership
    const document = await this.prisma.documents.findUnique({
      where: { id: fileId },
    });
    if (!document) throw new NotFoundException('Document not found');
    if (document.userId !== userId)
      throw new NotFoundException('Document not found');

    // 2. Remove vectors
    await this.vectorService.removeVectorByFileId(fileId);

    // 3. Delete physical file
    try {
      const absolutePath = path.resolve(process.cwd(), document.filePath);
      deleteFile(absolutePath);
    } catch (error) {
      console.error('⚠️ File delete error:', error);
      throw new NotFoundException('Delete file uploads error');
    }

    // 4. Delete Record => Cascade delete `project_resources`
    return await this.prisma.documents.delete({
      where: { id: fileId },
    });
  }

  // -- UNLINK DOCUMENT FROM PROJECT --
  async unlinkDocumentFromProject(docId: string, projId: string) {
    return await this.prisma.project_resources.deleteMany({
      where: {
        projectId: projId,
        documentId: docId,
      },
    });
  }

  // -- CREATE DOCUMENT MAPPING --
  async createDocument(documentDto: CreateDocumentDto) {
    // Validate project exists if projectId provided

    const document = await this.prisma.documents.create({
      data: {
        userId: documentDto.userId,
        title: documentDto.title,
        description: documentDto.description,
        authors: documentDto.authors,
        subjects: documentDto.subjects,
        tags: documentDto.tags,
        documentType: documentDto.documentType,
        publishedYear: documentDto.publishedYear,
        accessLevel: documentDto.accessLevel,

        originalName: documentDto.originalName,
        filePath: documentDto.filePath,
        mimeType: documentDto.mimeType,
        size: documentDto.size as number,
        pageCount: documentDto.pageCount,

        status: documentDto.status,
        viewCount: documentDto.viewCount,
      },
    });

    if (documentDto.projectId) {
      await this.prisma.project_resources.create({
        data: {
          projectId: documentDto.projectId,
          documentId: document.id,
          isSelected: true,
        },
      });
    }
    return document;
  }

  /**
    1. Check Project exists AND belongs to User
    2. Validate Documents (Security Check)
    3. Prepare data for bulk insert
    4. Create links
   */
  async addDocumentsToProject(
    userId: string,
    projectId: string,
    documentIds: string[],
  ) {
    // 1. Check Project exists AND belongs to User
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have permission to access it',
      );
    }

    // 2. Validate Documents (Security Check)
    const validDocuments = await this.prisma.documents.findMany({
      where: {
        id: { in: documentIds },
        OR: [
          { userId: userId }, // Của mình
          { accessLevel: AccessLevelDoc.PUBLIC }, // Hoặc thư viện công cộng
        ],
      },
      select: { id: true }, // Chỉ select ID cho nhẹ query
    });

    const validDocIds = validDocuments.map((doc) => doc.id);

    if (validDocIds.length === 0) {
      throw new NotFoundException(
        'No valid documents found to add (Check ownership or ID)',
      );
    }

    // 3. Prepare data for bulk insert
    const dataToInput = validDocIds.map((docId) => ({
      projectId: projectId,
      documentId: docId,
      isSelected: true,
    }));

    // 4. Create links
    return await this.prisma.project_resources.createMany({
      data: dataToInput,
      skipDuplicates: true,
    });
  }

  // -- Unlink ALL DOCUMENTS IN PROJECT --
  async unlinkAllDocumentsInProject(projectId: string) {
    return await this.prisma.project_resources.deleteMany({
      where: {
        projectId: projectId,
      },
    });
  }

  // -- GET DOCUMENT IN PROJECT --
  async getDocumentsInProject(userId: string, projectId: string) {
    // Check exist project

    const docsRaw = await this.prisma.project_resources.findMany({
      where: { projectId: projectId, document: { userId: userId } },
      include: {
        document: {
          omit: { userId: true, indexedAt: true },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    console.log(docsRaw);
    // return docsRaw;
    return docsRaw.map((item) => {
      return {
        // 1. Các trường từ bảng trung gian (project_resources)
        addedAt: item.addedAt,
        isSelected: item.isSelected,
        linkId: item.id, //  sau này dùng chức năng "Unlink"

        // 2. Spread trực tiếp các trường của document ra ngoài
        ...item.document,
      };
    });
  }

  // -- GET DOCUMENT NOT IN PROJECT --
  async getDocumentsNotInProject(userId: string, projectId: string) {
    return await this.prisma.documents.findMany({
      where: {
        OR: [{ userId: userId }, { accessLevel: AccessLevelDoc.PUBLIC }],
        NOT: {
          linkedProjects: {
            some: { projectId: projectId },
          },
        },
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        createdAt: true,
        mimeType: true,
      },
      orderBy: {
        createdAt: 'desc', // Mới nhất lên đầu
      },
    });
  }

  // -- GET ALL DOCUMENTS --
  async getAllDocuments(userId: string) {
    return await this.prisma.documents.findMany({
      where: {
        userId: userId,
      },
      include: {
        linkedProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  // -- GET DOCUMENT DETAIL --
  async getDocumentDetail(userId: string, id: string) {
    return await this.prisma.documents.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        linkedProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  // -- UPDATE DOCUMENT --
  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto) {
    return await this.prisma.documents.update({
      where: { id: id },
      data: {
        title: updateDocumentDto.title,
      },
    });
  }
  // -- UPDATE DOCUMENT STATUS --
  async updateDocumentStatus(id: string, status: DocumentStatus) {
    // Validate status
    if (!Object.values(DocumentStatus).includes(status)) {
      throw new Error('Invalid status value');
    }

    return await this.prisma.documents.update({
      where: { id: id },
      data: {
        status: status,
      },
    });
  }
}

```

### src\document\dto\add-doc2pj.dto.ts

```ts
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AddDocumentToProjectDto {
  @IsArray()
  @IsUUID('4', { each: true }) // Validate từng phần tử trong mảng phải là UUID
  @IsNotEmpty()
  documentIds: string[];
}

```

### src\document\dto\create-document.dto.ts

```ts
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccessLevelDoc } from '../../constant/index.constant';
import { DocumentStatus } from '@prisma/client';

export class CreateDocumentDto {
  // Out info
  @IsString({ message: 'projectId must be a string' })
  projectId?: string;

  // Basic Info

  @IsString({ message: 'userId must be a string' })
  userId: string;

  @IsString({ message: 'title must be a string' })
  @Length(1, 100, { message: 'title must be between 1 and 255 characters' })
  title?: string;

  @IsString({ message: 'description must be a string' })
  @Length(1, 500, {
    message: 'description must be between 1 and 500 characters',
  })
  description?: string;

  @IsString({ each: true, message: 'each author must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each author must be at most 50 characters',
  })
  authors?: string[];

  @IsString({ each: true, message: 'each subject must be a string' })
  @MaxLength(50, {
    each: true,
    message: 'each subject must be at most 50 characters',
  })
  subjects?: string[];

  @IsString({ each: true, message: 'each tag must be a string' })
  @MaxLength(30, {
    each: true,
    message: 'each tag must be at most 30 characters',
  })
  tags?: string[];

  @IsString({ message: 'documentType must be a string' })
  documentType?: string;

  @IsInt({ message: 'publishedYear must be an integer' })
  publishedYear?: number;

  @IsEnum(AccessLevelDoc, { message: 'accessLevel must be a valid enum value' })
  accessLevel: AccessLevelDoc;

  //
  @IsString({ message: 'originalName must be a string' })
  @MinLength(1, { message: 'originalName must not be empty' })
  originalName: string;

  @IsString({ message: 'filePath must be a string' })
  filePath: string;

  @IsString({ message: 'originalFileName must be a string' })
  mimeType?: string;

  @IsInt({ message: 'size must be an integer' })
  size?: number;

  @IsInt({ message: 'pageCount must be an integer' })
  pageCount?: number;

  // More Info
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus = DocumentStatus.PROCESSING;

  @IsInt({ message: 'viewCount must be an integer' })
  viewCount: number;

  metadata?: any;

  @IsDate({ message: 'indexedAt must be a valid date' })
  indexedAt?: Date;
}

```

### src\document\dto\update-document.dto.ts

```ts
export class UpdateDocumentDto {
  title?: string;
}

```

### src\document\dto\upload-document.dto.ts

```ts
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccessLevelDoc } from '../../constant/index.constant';

export class UploadMetadataDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsEnum(AccessLevelDoc)
  accessLevel?: AccessLevelDoc;

  @IsOptional()
  @IsInt()
  @Type(() => Number) // Convert string "2024" to number 2024
  publishedYear?: number;
}

```

### src\document\entities\document.entity.ts

```ts
export class Document {}

```

### src\document\oss.ts

```ts
// Object storage server (OSS) configuration

import * as fs from 'fs';
import * as multer from 'multer';
import path from 'path';

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      fs.mkdirSync('uploads/documents', { recursive: true });
    } catch (error) {}
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Latin1 to utf-8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    cb(null, uniqueSuffix + ext);
  },
});

// Delete file function
export const deleteFile = (filePath: string) => {
  const normalizedPath = path.normalize(filePath);
  fs.unlink(normalizedPath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
    } else {
      console.log('File deleted successfully');
    }
  });
};

```

### src\http-exception.filter.ts

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { request, Response } from 'express';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // -- STATUS CODE DETECTION --
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // -- MESSAGE DETECTION --
    const messageError =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any)?.message || 'Internal server error';

    // -- LOG ERROR --
    this.logger.error(
      `❌ ${request.method} ${request.url}`,
      (exception as any).stack,
    );

    res.status(statusCode).json({
      statusCode: statusCode,
      success: false,
      message: messageError,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}

```

### src\ingest\ingest.module.ts

```ts
import { ConsoleLogger, Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { PdfService } from './loaders/pdf.loader';
import { OcrService } from './loaders/ocr.loader';
import { TextSplitterService } from './splitters/text-splitter';
import { VectorService } from './vector/vector.service';
import { PgvectorService } from './vector/pgvector.client';
import { OpenaiService } from '../llm/openai/openai.service';
import { CloudService } from './loaders/cloud.loader';

@Module({
  providers: [
    IngestService,
    PdfService,
    OcrService,
    CloudService,
    TextSplitterService,
    VectorService,
    PgvectorService,
    OpenaiService,
    ConsoleLogger,
  ],
  exports: [IngestService, VectorService],
})
export class IngestModule {}

```

### src\ingest\ingest.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { VectorService } from './vector/vector.service';
import { TextSplitterService } from './splitters/text-splitter';
import { CloudService } from './loaders/cloud.loader';

@Injectable()
export class IngestService {
  constructor(
    private cloudService: CloudService,
    private textSplitterService: TextSplitterService,
    private vectorService: VectorService,
  ) {}
  /* 
    1. Load document (Text/PDF/Image)
    2. Split text into chunks
    3. Create embeddings => Store embeddings in vector database
    */
  async ingestDocument(
    filePath: string,
    fileId: string,
    userId: string,
    projectId?: string,
    originalFileName?: string,
  ) {
    const markdownResult = await this.cloudService.load(filePath);

    // console.log(JSON.stringify(markdownResult));

    // 2. Split text into chunks
    // Extract markdown text from ParseResult array
    const markdownList = markdownResult
      .flatMap((result) =>
        result.pages.map((page) => ({
          content: (page.md || page.text || '') as string,
          page: page.page as number,
        })),
      )
      .filter((item) => item.content.trim().length > 0); // Filter dựa trên thuộc tính .content

    const chunks = await this.textSplitterService.splitToMarkdown(markdownList);

    const metadata = {
      fileId,
      projectId,
      userId,
      fileUrl: filePath,
      originalFileName,
    };

    console.log(
      '💾 Saving to vector store with metadata:',
      JSON.stringify(metadata),
    );
    // console.log('📦 Total chunks:', chunks);

    // 3. Create embeddings => Store embeddings in vector database
    await this.vectorService.addDocuments({
      chunks,
      metadata,
    });

    // Return number of chunks processed
    return chunks;
  }
}

```

### src\ingest\loaders\cloud.loader.ts

```ts
import { Injectable } from '@nestjs/common';
import { LlamaParseReader } from 'llama-cloud-services';

@Injectable()
export class CloudService {
  private reader: LlamaParseReader;

  constructor() {
    this.reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      // The parsing tier. Options: fast, cost_effective, agentic, agentic_plus
      tier: 'cost_effective',
      // The version of the parsing tier to use. Use 'latest' for the most recent version
      version: 'latest',
      // Whether to use high resolution OCR (Slow)
      high_res_ocr: true,
      // Adaptive long table. LlamaParse will try to detect long table and adapt the output
      adaptive_long_table: true,
      // Whether to try to extract outlined tables
      outlined_table_extraction: true,
      // Whether to output tables as HTML in the markdown output
      output_tables_as_HTML: true,
      // The maximum number of pages to parse
      max_pages: 0,
      // Whether to use precise bounding box extraction (experimental)
      precise_bounding_box: true,
    });
  }
  // docx, pdf, ... to markdown
  async load(fileUrl: string) {
    const results = await this.reader.parse(fileUrl);

    //parse() returns an array of ParseResult objects
    for (const result of results) {
      console.log(`Job ID: ${result.job_id}`);
      console.log(`File: ${result.file_path}`);
      console.log(`Completed: ${result.is_completed}`);
      console.log(`Number of pages: ${result.pages.length}`);
      console.log('---');

      // Access individual pages
      for (const page of result.pages) {
        // The page object structure depends on the parsing configuration
        // It may contain: text, md, images, layout, structuredData, etc.
        if (page.text) console.log('Text:', page.text);
        if (page.md) console.log('Markdown:', page.md);
        if (page.json) console.log('JSON:', page.json);
      }
    }

    return results;
  }
}

```

### src\ingest\loaders\ocr.loader.ts

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import sharp from 'sharp';

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private workers: Tesseract.Worker[] = [];
  private readonly WORKER_COUNT = 8; // Số workers song song

  async onModuleInit() {
    console.log('🔧 Initializing OCR worker pool...');
    // Tạo worker pool để OCR song song
    const workerPromises = Array.from(
      { length: this.WORKER_COUNT },
      async () => {
        const worker = await Tesseract.createWorker('vie', 1, {
          logger: () => {}, // Tắt log verbose
        });

        // Cấu hình tối ưu cho tiếng Việt
        await worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Tự động detect layout
          tessedit_char_whitelist: '', // Cho phép tất cả ký tự
          preserve_interword_spaces: '1',
          // Cải thiện nhận diện dấu tiếng Việt
          textord_heavy_nr: '1',
          // Giảm noise
          edges_use_new_outline_complexity: '1',
        });

        return worker;
      },
    );

    this.workers = await Promise.all(workerPromises);
    console.log(`✅ Initialized ${this.workers.length} OCR workers`);
  }

  private getWorker(index: number): Tesseract.Worker {
    return this.workers[index % this.workers.length];
  }

  // Handle
  async load(filePath: string) {
    try {
      const ext = filePath.toLowerCase();
      const isPdf = ext.endsWith('.pdf');

      // Supported image formats for OCR
      const isImage = /\.(jpg|jpeg|png|bmp|tiff|webp)$/i.test(ext);

      // --- CASE 1: Image files only ---
      if (isImage) {
        const result = await this.workers[0].recognize(filePath);
        return { text: result.data.text, confidence: result.data.confidence };
      }

      // --- CASE 2: Non-PDF and non-image files (e.g., .txt) ---
      if (!isPdf) {
        throw new Error(
          `Unsupported file type for OCR. Only PDF and images are supported. Got: ${path.extname(filePath)}`,
        );
      }

      // --- CASE 3: PDF files ---
      // -- Get pageNumber --
      const pdfBuffet = fs.readFileSync(filePath);
      const pdfInfo = await pdf(pdfBuffet);

      if (pdfInfo.text && pdfInfo.text.trim().length > 20) {
        // Return if PDF has embedded text
        console.log('📄 PDF has embedded text, skipping OCR.');
        return { text: pdfInfo.text };
      }

      const pageCount = pdfInfo.numpages;

      if (!pageCount || pageCount === 0) return { text: '' };

      // Create: "uploads/temp" if not exists
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // List pages: convert(1) => page 1
      console.log('📄 PDF scanned → OCR');
      const convert = fromPath(filePath, {
        density: 200, // Tăng DPI để OCR chính xác hơn (từ 200 lên 300)
        saveFilename: `ocr-${Date.now()}`, // Temporary filename
        savePath: tempDir,
        format: 'png',
        width: 1700, // Tăng kích thước để giữ chi tiết (từ 1200 lên 2400)
        height: 2400,
      });

      const convertPromises: Promise<any>[] = [];
      for (let page = 1; page <= pageCount; page++) {
        convertPromises.push(convert(page, { responseType: 'image' }));
      }
      const pageImages = await Promise.all(convertPromises);
      console.log('✅ PDF converted to images');

      // 5️⃣ OCR tất cả trang song song với worker pool
      console.log(`🔍 Running OCR on ${pageCount} pages...`);

      const ocrPromises = pageImages.map(async (img: any, index: number) => {
        const worker = this.getWorker(index);

        const prep = await this.preprocessImage(img.path);

        const res = await worker.recognize(prep);

        return {
          text: res.data.text,
          path: img.path,
          prepPath: prep, // Lưu đường dẫn file preprocessed
          page: index + 1,
        };
      });

      const results = await Promise.all(ocrPromises);
      console.log('✅ OCR completed');

      // 6️⃣ Ghép text theo thứ tự trang
      const allText = results
        .sort((a, b) => a.page - b.page)
        .map((r) => this.normalizeText(r.text))
        .join('\n');

      // 7️⃣ Xoá file ảnh tạm (cả gốc và preprocessed)
      results.forEach((r) => {
        try {
          // Xóa file gốc
          if (fs.existsSync(r.path)) {
            fs.unlinkSync(r.path);
          }
          // Xóa file preprocessed
          if (r.prepPath && fs.existsSync(r.prepPath)) {
            fs.unlinkSync(r.prepPath);
          }
        } catch (error) {
          console.warn(`⚠️ Cannot delete temp file: ${r.path}`, error.message);
        }
      });

      return { text: allText };
    } catch (error) {
      console.log('OCR Error: ', error);
      throw error;
    }
  }

  // Normalize text: nối từ ngắt dòng, gộp khoảng trắng, sửa lỗi OCR phổ biến tiếng Việt
  private normalizeText(text: string): string {
    const normalized = text
      // Nối từ bị ngắt dòng
      .replace(/-\s*\n\s*/g, '')
      // Giữ nguyên xuống dòng đơn, chỉ gộp xuống dòng nhiều
      .replace(/\n{3,}/g, '\n\n')
      // Chuẩn hóa space (không gộp xuống dòng)
      .replace(/[ \t]+/g, ' ')
      // Remove brand watermarks
      .replace(/Scanned with[\s\S]*$/gi, '')
      // Sửa lỗi OCR phổ biến tiếng Việt
      .replace(/\bl\b/g, 'I') // l đơn -> I
      .replace(/ĐẠl/g, 'ĐẠI')
      .replace(/HỘl/g, 'HỘI')
      .replace(/TRUẬT/g, 'THUẬT')
      .replace(/lẼN/g, 'MIỄN')
      // Loại bỏ ký tự lỗi OCR phổ biến
      .replace(/[¬]/g, '-')
      .replace(/[‹›«»]/g, '"')
      // Loại bỏ các ký tự lạ không phải chữ cái, số, dấu câu thông thường
      .replace(
        /[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ.,;:!?()\-"/\n]/g,
        ' ',
      )
      // Gộp space thừa sau khi xử lý
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Đếm diacritics để debug
    const diacriticCount = (
      normalized.match(
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi,
      ) || []
    ).length;
    if (diacriticCount > 0) {
      console.log(`Detected ${diacriticCount} diacritics`);
    }

    return normalized;
  }

  private async preprocessImage(imgPath: string): Promise<string> {
    const outPath = imgPath.replace('.png', '-prep.png');

    const img = sharp(imgPath);
    const meta = await img.metadata();

    const topCut = Math.floor(meta.height * 0.03); // 1000px => cut 30px
    const bottomCut = Math.floor(meta.height * 0.03);

    // Chỉ cắt trái/phải nếu ảnh quá rộng (scan lệch)
    // aspect ratio: width / height
    // < 1 là ảnh dọc, 0.75 là tỉ lệ phổ biến của trang A4
    const sideCut =
      meta.width / meta.height > 0.75 ? Math.floor(meta.width * 0.012) : 0;

    await img
      .extract({
        left: sideCut,
        top: topCut,
        width: meta.width - sideCut * 2, // cut left/right
        height: meta.height - topCut - bottomCut, // cut top/bottom
      })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 0.5 })
      // .threshold(115)
      .median(1)
      .toFile(outPath);

    return outPath;
  }

  async onModuleDestroy() {
    console.log('🛑 Terminating OCR workers...');
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}

```

### src\ingest\loaders\pdf.loader.ts

```ts
import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';

// Type definitions for pdf.js objects
interface TextItem {
  str: string;
  transform: number[];
}

interface TextContent {
  items: TextItem[];
}

interface PageData {
  pageNumber: number;
  getTextContent(options?: {
    normalizeWhitespace?: boolean;
    disableCombineTextItems?: boolean;
  }): Promise<TextContent>;
}

@Injectable()
export class PdfService {
  private pageTexts: Map<number, string> = new Map();

  async load(filePath: string): Promise<{ page: number; text: string }[]> {
    // Reset page texts for new document
    this.pageTexts.clear();

    // Read PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF with pdf-parse
    await pdfParse(dataBuffer, {
      pagerender: (pageData: PageData) => this.renderPage(pageData),
    });

    // Convert Map to array sorted by page number
    const result = Array.from(this.pageTexts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNum, text]) => ({
        page: pageNum,
        text: text,
      }));

    return result;
  }

  private async renderPage(pageData: PageData): Promise<string> {
    const render_options = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };

    const textContent = await pageData.getTextContent(render_options);
    const strings = textContent.items.map((item) => item.str);
    const pageText = strings.join(' ') + '\n';

    // Store text by page number
    this.pageTexts.set(pageData.pageNumber, pageText);

    return pageText;
  }
}

```

### src\ingest\splitters\text-splitter.ts

```ts
import { Injectable, Logger } from '@nestjs/common';
import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constant/index.constant.js';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import { randomUUID } from 'node:crypto';

export type ChunkResult = {
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
};

export type MarkdownProp = { content: string; page: number };

// Alias for backward compatibility
@Injectable()
export class TextSplitterService {
  private readonly logger = new Logger(TextSplitterService.name);

  // private readonly HEADER_TO_SPLIT = [
  //   ['#', 'Header 1'],
  //   ['##', 'Header 2'],
  //   ['###', 'Header 3'],
  // ];

  async splitToMarkdown(
    markdownInputs: MarkdownProp[],
  ): Promise<ChunkResult[]> {
    if (!markdownInputs) {
      this.logger.warn('Empty markdown text received for splitting.');
      return [];
    }

    const texts = markdownInputs.map((item) => item.content);
    const metadata = markdownInputs.map((item) => ({
      page: item.page,
      // Thêm các metadata khác từ input nếu cần
    }));

    const splitter = new MarkdownTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      // keepSeparator: true,
    });

    const docsSplitted = await splitter.createDocuments(texts, metadata);
    this.logger.log(
      `Start splitting: Generated ${docsSplitted.length} parent chunks.`,
    );

    let globalChildIndex = 0;

    return docsSplitted.map((doc) => ({
      id: randomUUID(),
      content: doc.pageContent,
      chunkIndex: globalChildIndex++,
      metadata: doc.metadata || {},
    }));
  }
}

//  === SMALL TO BIG VERSION ===
// export type ChildChunkResult = {
//   id: string;
//   content: string;
//   chunkIndex: number;
//   metadata: Record<string, any>;
// };

// export type ParentChunkResult = {
//   content: string;
//   metadata: Record<string, any>;
//   children: ChildChunkResult[];
// };
// export class TextSplitterService {
//   private readonly logger = new Logger(TextSplitterService.name);

//   private readonly HEADER_TO_SPLIT = [
//     ['#', 'Header 1'],
//     ['##', 'Header 2'],
//     ['###', 'Header 3'],
//   ];

//   async splitToMarkdown(markdownText: string[]): Promise<ParentChunkResult[]> {
//     if (!markdownText) {
//       this.logger.warn('Empty markdown text received for splitting.');
//       return [];
//     }

//     const parentSplitter = new MarkdownTextSplitter({
//       chunkSize: PARENT_CHUNK_SIZE,
//       chunkOverlap: PARENT_CHUNK_OVERLAP,
//       // keepSeparator: true,
//     });

//     const parentDocs = await parentSplitter.createDocuments(markdownText);
//     this.logger.log(
//       `Start splitting: Generated ${parentDocs.length} parent chunks.`,
//     );

//     const childrenSplitter = new MarkdownTextSplitter({
//       chunkSize: CHILD_CHUNK_SIZE,
//       chunkOverlap: CHILD_CHUNK_OVERLAP,
//     });

//     const result: ParentChunkResult[] = [];
//     let globalChildIndex = 0;
//     for (const parentDoc of parentDocs) {
//       const childDocs = await childrenSplitter.createDocuments([
//         parentDoc.pageContent,
//       ]);

//       // Map sang format ChildChunkResult
//       const childrenNodes: ChildChunkResult[] = childDocs.map((child) => ({
//         id: randomUUID(),
//         content: child.pageContent,
//         chunkIndex: globalChildIndex++,
//         // Merge metadata của cha vào con (để sau này filter nếu cần)
//         metadata: {
//           ...parentDoc.metadata,
//           ...child.metadata,
//         },
//       }));

//       result.push({
//         content: parentDoc.pageContent,
//         metadata: parentDoc.metadata,
//         children: childrenNodes,
//       });
//     }

//     return result;
//   }
// }
// OLD version

// import { Injectable } from '@nestjs/common';
// import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constant/index.constant.js';

// export type ChunkResult = {
//   text: string;
//   page: number;
//   chunkIndex: number;
//   startOffset: number;
//   endOffset: number;
// };

// @Injectable()
// export class TextSplitterService {
//   // Thứ tự ưu tiên: Ngắt đoạn đôi -> Đoạn đơn -> Câu -> Mệnh đề -> Từ
//   private readonly SEPARATORS = [
//     '\n\n',
//     '\n',
//     '. ',
//     '? ',
//     '! ',
//     '; ',
//     ': ', // Thêm dấu hai chấm
//     ', ',
//     ' ',
//     '', // Fallback cuối cùng: cắt từng ký tự nếu không tìm thấy gì
//   ];

//   splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
//     const chunks: ChunkResult[] = [];
//     let globalOffset = 0;
//     let chunkIndex = 0;

//     for (const p of pages) {
//       const pageText = p.text;

//       // Xử lý trang rỗng
//       if (!pageText || pageText.length === 0) {
//         continue; // Offset không đổi vì độ dài = 0
//       }

//       let localStart = 0;

//       while (localStart < pageText.length) {
//         // 1. Xác định điểm cắt lý tưởng (Hard Limit)
//         let localEnd = Math.min(localStart + CHUNK_SIZE, pageText.length);

//         // 2. Tìm điểm cắt ngữ nghĩa (Semantic Boundary)
//         // Chỉ tìm nếu chưa hết văn bản
//         if (localEnd < pageText.length) {
//           const semanticEnd = this.findNearestSeparator(
//             pageText,
//             localStart,
//             localEnd,
//           );
//           if (semanticEnd !== -1) {
//             localEnd = semanticEnd;
//           }
//         }

//         // 3. Lấy raw text
//         const rawChunkText = pageText.slice(localStart, localEnd);

//         // 4. XỬ LÝ TRIM VÀ OFFSET CHÍNH XÁC (QUAN TRỌNG)
//         // Ta cần tìm vị trí thực của chữ cái đầu tiên và cuối cùng trong rawChunkText
//         // để offset trả về KHÔNG bao gồm khoảng trắng thừa ở đầu/cuối.
//         if (rawChunkText.trim().length > 0) {
//           // Tính toán offset nội bộ để trim
//           const startTrimDelta =
//             rawChunkText.length - rawChunkText.trimStart().length;
//           const endTrimDelta =
//             rawChunkText.length - rawChunkText.trimEnd().length;

//           const realStartOffset = globalOffset + localStart + startTrimDelta;
//           const realEndOffset = globalOffset + localEnd - endTrimDelta;

//           chunks.push({
//             text: rawChunkText.trim(),
//             page: p.page,
//             chunkIndex: chunkIndex,
//             startOffset: realStartOffset,
//             endOffset: realEndOffset,
//           });
//           chunkIndex++;
//         }

//         // 5. Chuẩn bị cho vòng lặp sau (Overlap)
//         if (localEnd >= pageText.length) {
//           break;
//         }

//         // Tính overlap
//         const idealNextStart = Math.max(localStart, localEnd - CHUNK_OVERLAP);

//         // Tìm điểm bắt đầu "đẹp" cho chunk sau (tránh cắt giữa từ)
//         localStart = this.findSmartNextStart(
//           pageText,
//           idealNextStart,
//           localEnd,
//         );
//       }

//       globalOffset += pageText.length;
//     }

//     return chunks;
//   }

//   /**
//    * TỐI ƯU HIỆU NĂNG:
//    * Không dùng slice() để tạo chuỗi con mới. Dùng lastIndexOf với tham số position.
//    */
//   private findNearestSeparator(
//     text: string,
//     start: number,
//     limit: number,
//   ): number {
//     // Chỉ tìm ngược lại trong khoảng 40% cuối của chunk
//     // Để đảm bảo chunk không bị quá ngắn (ví dụ chunk 1000 mà cắt ở ký tự thứ 10)
//     const minSearchIndex = Math.max(
//       start,
//       limit - Math.floor(CHUNK_SIZE * 0.4),
//     );

//     for (const sep of this.SEPARATORS) {
//       if (sep === '') return limit; // Fallback hard cut

//       // Tìm separator cuối cùng xuất hiện TRƯỚC limit
//       const lastIndex = text.lastIndexOf(sep, limit);

//       // Quan trọng: lastIndex phải >= minSearchIndex để đảm bảo chunk đủ dài
//       if (lastIndex !== -1 && lastIndex >= minSearchIndex) {
//         // Cắt SAU separator (ví dụ sau dấu chấm)
//         return lastIndex + sep.length;
//       }
//     }

//     return -1; // Fallback
//   }

//   private findSmartNextStart(
//     text: string,
//     idealStart: number,
//     previousEnd: number,
//   ): number {
//     if (idealStart <= 0) return 0;
//     if (idealStart >= text.length) return text.length;

//     // Nếu ngay tại idealStart đã là ký tự bắt đầu từ mới (trước đó là space) -> Tốt
//     if (text[idealStart - 1] === ' ' || text[idealStart - 1] === '\n') {
//       return idealStart;
//     }

//     // Nếu không, lùi lại tìm khoảng trắng gần nhất
//     // Giới hạn lùi tối đa 50 ký tự để tránh chunk sau bị overlap quá nhiều (thừa thãi)
//     const searchLimit = Math.max(0, idealStart - 50);

//     // Tìm space hoặc newline gần nhất phía trước
//     const lastSpace = text.lastIndexOf(' ', idealStart);
//     const lastNewline = text.lastIndexOf('\n', idealStart);

//     const bestStart = Math.max(lastSpace, lastNewline);

//     if (bestStart !== -1 && bestStart >= searchLimit) {
//       return bestStart + 1; // Bắt đầu sau dấu cách
//     }

//     // Nếu từ quá dài (dài hơn 50 ký tự không có dấu cách), đành cắt giữa từ
//     return idealStart;
//   }

//   splitText(text: string): ChunkResult[] {
//     const pages = [{ page: 1, text }];
//     return this.splitPdfPages(pages);
//   }
// }

```

### src\ingest\vector\pgvector.client.ts

```ts
import {
  ConsoleLogger,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenaiService } from '../../llm/openai/openai.service';
import { getPgConfig } from '../../config/pg.config';
import { Pool, PoolClient } from 'pg';
@Injectable()
export class PgvectorService implements OnModuleInit, OnModuleDestroy {
  private vectorStore: PGVectorStore | null = null;
  private pool: Pool | null = null;

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: ConsoleLogger,
  ) {}

  // Tự động chạy khi module khởi tạo
  async onModuleInit() {
    await this.initVectorStore();
    // Khuyến nghị: Chỉ chạy dòng này 1 lần khi deploy hoặc migration,
    // nhưng để ở đây cũng được nếu bảng chưa có index nó sẽ tạo.
    // Nếu index đã tồn tại, nó có thể báo lỗi, ta nên dùng try/catch
    try {
      await this.ensureHnswIndex();
    } catch (e) {
      this.logger.error(
        '⚠️ Warning: HNSW Index check failed (non-fatal)',
        e.message,
      );
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async initVectorStore() {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    // Use universal pgConfig - works with any PostgreSQL provider
    // IMPORTANT: Call getPgConfig() at runtime to ensure env vars are loaded
    const config = getPgConfig();

    // Initialize PG connection pool
    this.pool = new Pool(config.postgresConnectionOptions);

    // 2. BẮT BUỘC: Lắng nghe sự kiện error trên pool
    // Nếu không có dòng này, khi Neon ngắt kết nối, App sẽ Crash ngay lập tức
    this.pool.on('error', (err) => {
      this.logger.error('❌ PG Pool Error (Idle client):', err.message);
      // Không throw error, chỉ log để app tiếp tục chạy và tự reconnect
    });

    this.pool.on('connect', (client: PoolClient) => {
      client.on('error', (err) => {
        this.logger.error('❌ PG Client Error:', err.message);
      });
    });

    // Pass the pool to vector store config
    this.vectorStore = await PGVectorStore.initialize(
      this.openaiService.getEmbeddings(),
      { ...config, pool: this.pool },
    );

    this.logger.log('✅ Connected to PGVector successfully!');
    return this.vectorStore;
  }

  // ---  INDEX HNSW ---
  async ensureHnswIndex() {
    if (!this.vectorStore) await this.initVectorStore();

    this.logger.log('🏗️ Checking/Creating HNSW Index...');

    try {
      // Các thông số này tối ưu cho OpenAI (1536 dimensions)
      await this.vectorStore?.createHnswIndex({
        dimensions: 1536,
        m: 16, // Số kết nối mỗi node (Default: 16)
        efConstruction: 64, // Độ sâu tìm kiếm khi xây dựng index (Default: 64)
      });
      this.logger.log('✅ HNSW Index created successfully');
    } catch (error) {
      // PGVector thường throw lỗi nếu Index đã tồn tại.
      // Ta catch lỗi này để không làm crash app.
      if (error.message && error.message.includes('already exists')) {
        this.logger.log('ℹ️ HNSW Index already exists. Skipping creation.');
      } else {
        this.logger.error('❌ Error creating HNSW index:', error);
      }
    }
  }
}

```

### src\ingest\vector\vector.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { PgvectorService } from './pgvector.client';
import { ChunkResult } from '../splitters/text-splitter';

type Metadata = {
  fileId: string;
  projectId?: string;
  userId: string;
  fileUrl: string;
};
@Injectable()
export class VectorService {
  constructor(private readonly pgvectorService: PgvectorService) {}

  // -- ADD DOCUMENTS TO VECTOR STORE --
  async addDocuments({
    chunks,
    metadata,
  }: {
    chunks: ChunkResult[];
    metadata: Metadata;
  }) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    return vectorStore.addDocuments(
      chunks.map((chunk) => ({
        pageContent: chunk.content,
        metadata: {
          chunkIndex: chunk.chunkIndex,
          ...metadata,
          ...chunk.metadata,
        },
      })),
    );
  }

  // -- RETRIEVE SIMILAR DOCUMENTS --
  async getRetrievalsWithK(
    query: string,
    k: number,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearch(query, k, filter);
    return results;
  }

  // -- RETRIEVE SIMILAR WITH SCORE --
  async getRetrievalsWithScore(
    query: string,
    k = 30,
    userId: string,
    projectId?: string,
  ) {
    const vectorStore = await this.pgvectorService.initVectorStore();

    const filter: { userId: string; projectId?: string } = { userId };

    if (projectId) filter.projectId = projectId;

    const results = await vectorStore.similaritySearchWithScore(
      query,
      k,
      filter,
    );

    //  for (const [doc, score] of similaritySearchWithScoreResults) {
    //   console.log(`* [SIM=${score.toFixed(3)}] ${doc.pageContent} [${JSON.stringify(doc.metadata)}]`);
    // }

    return results;
  }

  // -- DELETE VECTOR STORE BY FILEID --
  async removeVectorByFileId(fileId: string) {
    const vectorStore = await this.pgvectorService.initVectorStore();
    await vectorStore.delete({ filter: { fileId } });
  }
}

```

### src\llm\openai\openai.module.ts

```ts
import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Module({
  providers: [OpenaiService],
})
export class OpenaiModule {}

```

### src\llm\openai\openai.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenaiService {
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('openai.apiKey')!;
  }

  // Modal: Rewrite user's prompt
  getRewriteModel(modelName = 'gpt-4o-mini') {
    return new ChatOpenAI({
      model: modelName,
      apiKey: this.apiKey,
      temperature: 0,
    });
  }

  // Modal: Final chat with user
  getChatModel(modelName = 'gpt-4.1') {
    return new ChatOpenAI({
      model: modelName,
      apiKey: this.apiKey,
      temperature: 0,
      maxRetries: 2,
    });
  }

  // Modal: Embeddings
  getEmbeddings(model = 'text-embedding-3-small') {
    return new OpenAIEmbeddings({
      model,
      apiKey: this.apiKey,
    });
  }
}

```

### src\main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './response.interceptor';
import { HttpExceptionFilter } from './http-exception.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Replace the default NestJS logger with Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // --- Config CORS ---
  // Dev mode: Allow all origins
  app.enableCors();

  /* //  Production mode: Restrict origins
   */
  app.enableCors({
    origin: ['http://localhost:3000'], // Add your allowed origins here
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies
  });

  const config = new DocumentBuilder()
    .setTitle('Chatnary API')
    .setDescription('The Chatnary API description')
    .setVersion('1.1')
    .addTag('chatnary')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // -- Response interceptor --
  app.useGlobalInterceptors(new ResponseInterceptor());
  // -- HTTP exception filter --
  app.useGlobalFilters(new HttpExceptionFilter());
  // -- Prefix all routes with /api/v1 --
  app.setGlobalPrefix('api/v1');
  // -- Swagger setup --
  SwaggerModule.setup('api/v1/docs', app, documentFactory);
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();

```

### src\pipeline\pipeline.module.ts

```ts
import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Module({
  providers: [PipelineService],
})
export class PipelineModule {}

```

### src\pipeline\pipeline.service.ts

```ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PipelineService {}

```

### src\prisma\prisma.module.ts

```ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

```

### src\prisma\prisma.service.ts

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get<string>('database.url'),
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    // Configure connection pool via Prisma's internal pooling
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database disconnected');
  }
}

```

### src\project\dto\create-project.dto.ts

```ts
import { IsBoolean, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsString({ message: 'color must be a string' })
  color?: string;

  @IsBoolean({ message: 'isArchived must be a boolean' })
  isArchived?: boolean;

  @IsString({ message: 'userId must be a string' })
  userId: string;
}

```

### src\project\dto\update-project.dto.ts

```ts
import { IsBoolean, IsString, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsString({ message: 'color must be a string' })
  color?: string;

  @IsBoolean({ message: 'isArchived must be a boolean' })
  isArchived?: boolean;
}

```

### src\project\entities\project.entity.ts

```ts
export class Project {}

```

### src\project\project.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ChatDto } from '../chat/dto/chat.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';
import { DocumentService } from '../document/document.service';
import { AddDocumentToProjectDto } from '../document/dto/add-doc2pj.dto';

@Controller('project')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly documentService: DocumentService,
  ) {}

  // -- CREATE --
  @Post()
  createNewProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() createProjectDto: CreateProjectDto,
  ) {
    createProjectDto.userId = req.user.userId;
    return this.projectService.createNewProject(createProjectDto);
  }

  // -- ADD DOCUMENTS TO PROJECT --
  @Post('/:projectId/documents')
  async addDocumentsToProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Body() dto: AddDocumentToProjectDto,
  ) {
    return await this.documentService.addDocumentsToProject(
      req.user.userId,
      projectId,
      dto.documentIds,
    );
  }

  // -- READ BY USERID --
  @Get('')
  findByUserId(@Req() req: { user: JwtPayloadWithRt }) {
    return this.projectService.findByUserId(req.user.userId);
  }

  // -- GET CHATS IN PROJECT --
  @Get('/:projectId/chats')
  async getChatsInProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
  ) {
    // RETURN LIST OF CHATS IN A PROJECT
    return await this.projectService.getChatsInProject(
      req.user.userId,
      projectId,
    );
  }

  // -- GET DOCUMENTS IN PROJECT --
  @Get('/:projectId/documents')
  async getDocumentsProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
  ) {
    return await this.projectService.getDocumentsInProject(
      req.user.userId,
      projectId,
    );
  }

  // -- GET CHAT IN PROJECTS --
  // @Get('/:projectId/chats/:chatId/messages')
  // async getChatDetailInProject(
  //   @Req() req: { user: JwtPayloadWithRt },
  //   @Param('projectId') projectId: string,
  //   @Param('chatId') chatId: string,
  // ) {
  //   // CHECK EXISTED
  //   //...

  //   // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
  //   return await this.projectService.getChatDetailInProject(
  //     req.user.userId,
  //     projectId,
  //     chatId,
  //   );
  // }

  // -- POST CHAT IN PROJECTS --
  @Post('/:projectId/chats/messages')
  async chatMessageInProject(
    @Req() req: { user: JwtPayloadWithRt },
    @Param('projectId') projectId: string,
    @Query('chatId') chatId: string | undefined,
    @Body() body: ChatDto, // message
  ) {
    body.chatId = chatId;
    body.userId = req.user.userId;
    body.projectId = projectId;
    // RETURN CHAT MESSAGES IN A PROJECT SPECIFIC CHAT
    return await this.projectService.chatMessageInProject(body);
  }

  // -- UPDATE PROJECT --
  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(id, updateProjectDto);
  }

  // -- DELETE PROJECT CASCADE --
  @Delete(':id')
  removeProject(@Param('id') id: string) {
    return this.projectService.removeProject(id);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(+id);
  }
}

```

### src\project\project.module.ts

```ts
import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../llm/openai/openai.service';
import { IngestModule } from '../ingest/ingest.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [IngestModule, RetrievalModule, DocumentModule],
  controllers: [ProjectController],
  providers: [ProjectService, ChatService, PrismaService, OpenaiService],
})
export class ProjectModule {}

```

### src\project\project.service.ts

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from '../chat/dto/chat.dto';
import { ChatService } from '../chat/chat.service';
import { DocumentService } from '../document/document.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly documentService: DocumentService,
  ) {}

  // -- CREATE NEW PROJECT --
  async createNewProject(createProjectDto: CreateProjectDto) {
    return await this.prisma.projects.create({
      data: createProjectDto,
      omit: { userId: true },
    });
  }

  // -- FIND PROJECTS BY USER ID --
  async findByUserId(userId: string) {
    return await this.prisma.projects.findMany({
      where: { userId: userId },
      omit: { userId: true },
    });
  }

  // -- GET CHATS IN PROJECT --
  async getChatsInProject(userId: string, projectId: string) {
    // Check existed
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, userId: userId },
    });
    if (!project) {
      throw new NotFoundException(
        'Project not found or does not belong to user',
      );
    }

    return await this.prisma.chats.findMany({
      where: { projectId: projectId },
      omit: { userId: true, projectId: true, messages: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -- GET CHAT DETAIL IN PROJECT --
  // async getChatDetailInProject(
  //   userId: string,
  //   projectId: string,
  //   chatId: string,
  // ) {
  //   // TODO: CHECK EXISTED
  //   return await this.prisma.chats.findUnique({
  //     where: { id: chatId, userId: userId, projectId: projectId },
  //     omit: { userId: true, projectId: true },
  //   });
  // }

  // -- GET DOCUMENTS IN PROJECT --
  async getDocumentsInProject(userId: string, projectId: string) {
    // Check existed
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, userId: userId },
    });
    if (!project)
      throw new NotFoundException(
        'Project not found or does not belong to user',
      );

    return await this.documentService.getDocumentsInProject(userId, projectId);
  }

  // -- POST CHAT IN PROJECTS --
  async chatMessageInProject(chatDto: ChatDto) {
    return await this.chatService.chatHistory(chatDto);
  }

  // -- UPDATE PROJECT --
  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    return await this.prisma.projects.update({
      where: { id: id },
      data: updateProjectDto,
    });
  }

  // -- DELETE PROJECT CASCADE --
  async removeProject(id: string) {
    // Get project info first (before delete)
    const project = await this.prisma.projects.findUnique({
      where: { id: id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Unlink all documents in project
    await this.documentService.unlinkAllDocumentsInProject(id);

    // Then delete project (cascade will delete DB records)
    const projectDel = await this.prisma.projects.delete({
      where: { id: id },
    });

    return projectDel;
  }

  findAll() {
    return `This action returns all project`;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }
}

```

### src\response.interceptor.ts

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse<Response>();
    // -- RETURN WRAPPED RESPONSE --
    return next.handle().pipe(
      map((data: any) => {
        // If response already formatted → do NOTHING
        if (
          data &&
          typeof data === 'object' &&
          data.hasOwnProperty('statusCode') &&
          data.hasOwnProperty('success')
        ) {
          return data;
        }
        return {
          statusCode: res.statusCode || 200,
          // message: data?.message ?? 'success',
          success: true,
          data: data ?? null,
        };
      }),
    );
  }
}

// ========== UPDATED VERSION ==========
// import {
//   CallHandler,
//   ExecutionContext,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { Response } from 'express';

// export interface ApiResponse<T> {
//   statusCode: number;
//   success: boolean;
//   data: T;
// }

// function isWrappedResponse(data: unknown): data is ApiResponse<unknown> {
//   return (
//     typeof data === 'object' &&
//     data !== null &&
//     'success' in data &&
//     'statusCode' in data
//   );
// }

// @Injectable()
// export class ResponseInterceptor<T>
//   implements NestInterceptor<T, ApiResponse<T>>
// {
//   intercept(
//     context: ExecutionContext,
//     next: CallHandler<T>,
//   ): Observable<ApiResponse<T>> {
//     const res = context.switchToHttp().getResponse<Response>();

//     return next.handle().pipe(
//       map((data: T) => {
//         if (isWrappedResponse(data)) {
//           return data;
//         }

//         return {
//           statusCode: res.statusCode ?? 200,
//           success: true,
//           data,
//         };
//       }),
//     );
//   }
// }

```

### src\retrieval\retrieval.module.ts

```ts
import { Logger, Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { IngestModule } from '../ingest/ingest.module';

@Module({
  imports: [IngestModule],
  providers: [RetrievalService, Logger],
  exports: [RetrievalService],
})
export class RetrievalModule {}

```

### src\retrieval\retrieval.service.ts

```ts
import { Injectable, Logger } from '@nestjs/common';
import { VectorService } from '../ingest/vector/vector.service';
import { CohereRerank } from '@langchain/cohere';
import { Document } from '@langchain/core/documents';

type MetadataDoc = {
  fileId?: string;
  projectId?: string;
  userId?: string;
  fileUrl?: string;

  endOffset?: number;
  startOffset?: number;
  chunkIndex?: number;
  page?: number;
  title?: string;
  originalFileName?: string;
};

export interface ScoredDocument {
  pageContent: string;
  metadata: MetadataDoc;
  vectorScore: number;
  keywordScore?: number;
  finalScore?: number;
}

@Injectable()
export class RetrievalService {
  // Lấy nhiều hơn để lọc kỹ hơn (Wide Net)
  private readonly RETRIEVE_K = 90;
  // Chỉ lấy top kết quả chất lượng nhất gửi cho LLM
  private readonly FINAL_K = 20;

  // Trọng số cho Hybrid search (Fire tune base on real data)
  private readonly WEIGHT_VECTOR = 0.3;
  private readonly WEIGHT_KEYWORD = 0.7;

  constructor(
    private vectorService: VectorService,
    private logger: Logger,
  ) {}

  /**
   * Pipeline tìm kiếm chuyên nghiệp:
   * 1. Retrieve (Vector Search)
   * 2. Rerank (Keyword Boosting / Cross-Encoder)
   * 3. Cutoff (Cut Top K)
   */
  async retrieveAndRerank(query: string, userId: string, projectId?: string) {
    // BƯỚC 1: RETRIEVAL - Lấy tập ứng viên rộng
    const rawDocs = await this.vectorService.getRetrievalsWithScore(
      query,
      this.RETRIEVE_K,
      userId,
      projectId,
    );

    if (!rawDocs.length) return [];

    const docsRerank: Document[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rawDocs.forEach(([doc, _]) => {
      docsRerank.push(
        new Document({
          id: doc.id,
          pageContent: doc.pageContent,
          metadata: { ...doc.metadata },
        }),
      );
    });

    const cohereRerank = new CohereRerank({
      apiKey: process.env.COHERE_API_KEY, // Default
      topN: this.FINAL_K, // Default 8
      model: 'rerank-v4.0-pro',
    });

    const rerankedDocuments = await cohereRerank.compressDocuments(
      docsRerank,
      query,
    );

    console.log(rerankedDocuments);

    // Chuẩn hóa documents sang format dễ xử lý
    const candidates: ScoredDocument[] = rerankedDocuments.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      finalScore: doc.metadata.relevanceScore as number,
      vectorScore: 0,
      keywordScore: 0,
    }));

    // Log để debug chất lượng tìm kiếm
    // this.logSearchQuality(query, candidates);

    // Trả về top kết quả tốt nhất
    return candidates.slice(0, this.FINAL_K);
  }

  // async retrieveAndRerank(query: string, userId: string, projectId?: string) {
  //   // BƯỚC 1: RETRIEVAL - Lấy tập ứng viên rộng
  //   const rawDocs = await this.vectorService.getRetrievalsWithScore(
  //     query,
  //     this.RETRIEVE_K,
  //     userId,
  //     projectId,
  //   );

  //   if (!rawDocs.length) return [];

  //   // Chuẩn hóa documents sang format dễ xử lý
  //   let candidates: ScoredDocument[] = rawDocs.map(([doc, score]) => ({
  //     pageContent: doc.pageContent,
  //     metadata: doc.metadata,
  //     vectorScore: score, // Giả sử score càng cao càng tốt (Cosine Similarity)
  //   }));

  //   // BƯỚC 2: RERANKING - Tính điểm từ khóa (Keyword Boosting)
  //   // Đây là Core quality để tìm chính xác thông tin hỗn tạp
  //   candidates = this.performKeywordReranking(query, candidates);

  //   // BƯỚC 3: SORTING & SELECTION
  //   // Sắp xếp theo điểm số cuối cùng (Final Score)
  //   candidates.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

  //   // Log để debug chất lượng tìm kiếm
  //   this.logSearchQuality(query, candidates);

  //   // Trả về top kết quả tốt nhất
  //   return candidates.slice(0, this.FINAL_K);
  // }

  /**
   * THUẬT TOÁN RERANK MỚI CHO TIẾNG VIỆT
   * Ưu tiên: Cụm từ chính xác (Bigram/Phrase) > Từ đơn (Unigram)
   */
  private performKeywordReranking(
    query: string,
    docs: ScoredDocument[],
  ): ScoredDocument[] {
    const queryLower = query.toLowerCase().trim();

    // 1. Tách từ đơn (Unigrams) - KHÔNG lọc độ dài nữa
    const unigrams = queryLower.split(/\s+/);

    // 2. Tạo cụm từ (Bigrams) để bắt ngữ cảnh.
    // Ví dụ: "miễn giảm học phí" -> ["miễn giảm", "giảm học", "học phí"]
    const bigrams: string[] = [];
    for (let i = 0; i < unigrams.length - 1; i++) {
      bigrams.push(`${unigrams[i]} ${unigrams[i + 1]}`);
    }

    return docs.map((doc) => {
      const contentLower = doc.pageContent.toLowerCase();
      let score = 0;

      // -- A. Điểm cho cụm từ (Quan trọng nhất - Trọng số cao) --
      // Nếu tìm thấy "miễn giảm" hoặc "học phí", cộng điểm rất lớn
      bigrams.forEach((gram) => {
        if (contentLower.includes(gram)) {
          score += 0.5; // Mỗi bigram khớp cộng 0.5 điểm
        }
      });

      // -- B. Điểm cho từ đơn (Bổ trợ) --
      unigrams.forEach((term) => {
        if (contentLower.includes(term)) {
          score += 0.1; // Mỗi từ đơn khớp cộng 0.1 điểm
        }
      });

      // -- C. Boost đặc biệt nếu khớp nguyên câu query (Hiếm nhưng chất) --
      if (contentLower.includes(queryLower)) {
        score += 2.0;
      }

      // Normalization: Kéo điểm về khoảng [0, 1] để không lấn át Vector quá đà
      // (Dùng hàm sigmoid hoặc min/max đơn giản)
      const normalizedKeywordScore = Math.min(score, 2.0) / 2.0; // Max là 1.0

      doc.keywordScore = normalizedKeywordScore;

      // Công thức tính Final Score
      doc.finalScore =
        doc.vectorScore * this.WEIGHT_VECTOR +
        normalizedKeywordScore * this.WEIGHT_KEYWORD;

      return doc;
    });
  }

  /**
   * Thuật toán tính điểm Keyword đơn giản nhưng hiệu quả (BM25 Simplified)
   * Tăng điểm cho các document chứa chính xác từ khóa trong query
   */
  // private performKeywordReranking(
  //   query: string,
  //   docs: ScoredDocument[],
  // ): ScoredDocument[] {
  //   // Tách query thành các token (từ đơn), loại bỏ từ quá ngắn
  //   const queryTerms = query
  //     .toLowerCase()
  //     .split(/\s+/)
  //     .filter((w) => w.length > 2); // TODO: User chat: "IT là gì, AI là gì?, IC là gì? " -> loại bỏ luôn key thì toang

  //   if (queryTerms.length === 0) return docs;

  //   return docs.map((doc) => {
  //     const contentLower = doc.pageContent.toLowerCase();
  //     let keywordMatches = 0;

  //     // Đếm số lượng từ khóa xuất hiện trong đoạn văn
  //     queryTerms.forEach((term) => {
  //       // Sử dụng regex để tìm từ chính xác (word boundary) tránh match nhầm
  //       // Ví dụ: tìm "tài" không nên match "tài liệu"
  //       const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'g');
  //       const matches = contentLower.match(regex);
  //       if (matches) {
  //         keywordMatches += matches.length;
  //       }
  //       // Fallback: nếu không tìm thấy chính xác, tìm chuỗi con (cho tiếng Việt)
  //       else if (contentLower.includes(term)) {
  //         keywordMatches += 0.5;
  //       }
  //     });

  //     // Tính điểm keyword (Normalization đơn giản)
  //     // Giới hạn điểm keyword boost tối đa là 1.0 để không lấn át hoàn toàn Vector
  //     const keywordScore = Math.min(keywordMatches * 0.1, 1.0);

  //     // CÔNG THỨC HYBRID SCORE
  //     // Kết hợp sức mạnh của Vector (hiểu ngữ nghĩa) và Keyword (độ chính xác)
  //     doc.keywordScore = keywordScore;
  //     doc.finalScore =
  //       doc.vectorScore * this.WEIGHT_VECTOR +
  //       keywordScore * this.WEIGHT_KEYWORD;

  //     return doc;
  //   });
  // }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private logSearchQuality(query: string, sortedDocs: ScoredDocument[]) {
    const topDoc = sortedDocs[0];
    this.logger.debug({
      msg: 'Rerank Results',
      query,
      topResult: {
        preview: topDoc?.pageContent.substring(0, 50),
        vScore: topDoc?.vectorScore.toFixed(3),
        kScore: topDoc?.keywordScore?.toFixed(3),
        final: topDoc?.finalScore?.toFixed(3),
      },
    });
  }
}

```

### src\user\dto\create-user.dto.ts

```ts
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

```

### src\user\dto\update-user.dto.ts

```ts
export class UpdateUserDto {
  email?: string;
  username?: string;
  name?: string;
  password?: string;
}

```

### src\user\entities\user.entity.ts

```ts
export class User {}

```

### src\user\user.controller.ts

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../constant/index.constant';

@Controller('user')
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // === GET ===
  @Get()
  // @ApiBearerAuth()
  findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Get(':userId')
  // @ApiBearerAuth()
  findUserById(@Param('userId') id: string) {
    return this.userService.findUserById(id);
  }

  // === POST ===
  // TODO: Avatar image update
  @Post()
  createNewUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createNewUser(createUserDto);
  }

  // === PATCH ===
  @Patch(':userId')
  // @ApiBearerAuth()
  updateUser(
    @Param('userId') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  // === DELETE ===
  @Delete(':userId')
  // @ApiBearerAuth()
  removeUser(@Param('userId') id: string) {
    return this.userService.removeUser(id);
  }
}

```

### src\user\user.module.ts

```ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}

```

### src\user\user.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // -- ALL USERS: ADMIN ONLY --
  findAllUsers() {
    return this.prisma.users.findMany();
  }

  // -- FIND USER BY ID --
  findUserById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  // -- CREATE USER --
  createNewUser(createUserDto: CreateUserDto) {
    return this.prisma.users.create({
      data: createUserDto,
    });
  }

  // -- UPDATE USER --
  updateUser(id: string, updateUserDto: UpdateUserDto) {
    // TODO: logic update password
    return this.prisma.users.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // -- DELETE USER --
  removeUser(id: string) {
    // TODO: Projected logic del
    return this.prisma.users.delete({ where: { id } });
  }
}

```

### prisma\schema.prisma

*(Unsupported file type)*

### package.json

```json
{
  "name": "backend-chatnary-nestjs",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "scripts": {
    "build": "nest build",
    "postinstall": "prisma generate",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "dev": "nest start",
    "start:dev": "nest start --watch",
    "wdev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/src/main.js",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@langchain/cohere": "^1.0.1",
    "@langchain/community": "^1.0.4",
    "@langchain/core": "^1.0.6",
    "@langchain/openai": "^1.1.2",
    "@langchain/textsplitters": "^1.0.0",
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/mapped-types": "*",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/serve-static": "^5.0.4",
    "@nestjs/swagger": "^11.2.3",
    "@prisma/adapter-pg": "6.9.0",
    "@prisma/client": "6.9.0",
    "bcrypt": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.3",
    "express": "^5.2.1",
    "joi": "^18.0.2",
    "llama-cloud-services": "^0.5.1",
    "lodash": "^4.17.21",
    "multer": "^2.0.2",
    "nest-winston": "^1.10.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pdf-parse": "1.1.1",
    "pdf2pic": "^3.2.0",
    "pg": "^8.16.3",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "sharp": "^0.34.5",
    "tesseract.js": "^6.0.1",
    "uuid": "^13.0.0",
    "winston": "^3.19.0",
    "winston-daily-rotate-file": "^5.0.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/bcrypt": "^6.0.0",
    "@types/dotenv": "^8.2.3",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/lodash": "^4.17.21",
    "@types/multer": "^2.0.0",
    "@types/node": "^22.10.7",
    "@types/passport-jwt": "^4.0.1",
    "@types/pdf-parse": "^1.1.5",
    "@types/pg": "^8.15.6",
    "@types/supertest": "^6.0.2",
    "dotenv": "^17.2.3",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "prisma": "6.9.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### API_ENDPOINTS.md

```md
# 📘 Chatnary Backend API Endpoints

*(NestJS · Prisma · PGVector · LangChainJS)*

## Base URL

```
http://localhost:8000/api/v1
```

---

# 🏠 Root

### **GET** `/docs`

* API documents Backend

---

# 🔑 Authentication

## Register

### **POST** `/auth/register`

**Body**

```json
{
  "email": "user1@example.com",
  "password": "123456"
}
```

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "message": "User registered successfully"
  }
}

// Error
{
  "statusCode": 403,
  "success": false,
  "message": {
    "message": "User already exists",
    "error": "Forbidden",
    "statusCode": 403
  },
  "timestamp": "2025-12-13T08:34:50.308Z",
  "path": "/api/v1/auth/register"
}
```

## Login

### **POST** `/auth/login`

**Body**

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY1NTk5ODYyLCJleHAiOjE3NjU2MDA3NjJ9.OlDUVXNx2FNlF7g7ldbuiHFFueiexPW6dvSj0jIQNsM",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzY1NTk5ODYyLCJleHAiOjE3NjYyMDQ2NjJ9.tiCXjCNmMOrzdZYKmgoEXQvgFvViZAWd8IhFn8bIYIE",
    "user": {
      "id": "bbe027d0-74ea-4630-a846-5040a9772d19",
      "email": "admin@example.com",
      "username": "admin",
      "name": "Administrator",
      "refreshToken": "$2b$10$L/FBJkavJpoQMrz3dgjg7.MdglrEahBl6dS77syc.P08fkXyHjGuu",
      "role": "ADMIN"
    }
  }
}

// Error
{
  "statusCode": 500,
  "success": false,
  "message": "Invalid credentials",
  "timestamp": "2025-12-13T08:58:05.663Z",
  "path": "/api/v1/auth/login"
}
```

## Refresh token

### **POST** `/auth/refresh`

**Headers(Bearer header)**
authentication = Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1NDQzMTE5LCJleHAiOjE3NjYwNDc5MTl9.0QkgBkk39vVfY1vUWNDB57Rk3eQ0VSz_cnRibutD_Ro

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1NDQzMTE5LCJleHAiOjE3NjU0NDQwMTl9.822N8k9AZQ5Yk3KT1gwd-NI77ujFDFd7TjR_yainwQk",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJ1c2VySWQiOiJiYmUwMjdkMC03NGVhLTQ2MzAtYTg0Ni01MDQwYTk3NzJkMTkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1NDQzMTE5LCJleHAiOjE3NjYwNDc5MTl9.0QkgBkk39vVfY1vUWNDB57Rk3eQ0VSz_cnRibutD_Ro"
  }
}

// Error
{
  "statusCode": 403,
  "success": false,
  "message": {
    "message": "Access Denied",
    "error": "Forbidden",
    "statusCode": 403
  },
  "timestamp": "2025-12-13T09:00:00.471Z",
  "path": "/api/v1/auth/refresh"
}
```

## Logout

### **POST** `/auth/logout`

**Response**

```json
// Success
{
  "statusCode": 201,
  "success": true,
  "data": {
    "message": "User logged out successfully"
  }
}

```

# 📁 Projects

*(Giống ChatGPT workspace — quản lý không gian dự án)*

## Create Project

### **POST** `/project`

**Body**

```json
{
  "name": "Sinoo khung bo",
  "description": "Desc ...",
  "color": "#3B82F6",
  "isArchived": false
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "id": "0c08f09e-f996-454c-a9b0-055c35658fea",
    "name": "Sinoo khung bo",
    "description": "Desc ...",
    "color": "#3B82F6",
    "isArchived": false,
    "createdAt": "2025-12-25T05:33:54.970Z",
    "updatedAt": "2025-12-25T05:33:54.970Z"
  }
}
```

## List Projects by user

### **GET** `/project`

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "cf3ad296-3044-451f-84db-9fc99c9e327d",
      "name": "AI Văn Bản",
      "description": "Project dùng để test RAG + OCR",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-23T16:52:10.813Z",
      "updatedAt": "2025-12-23T16:52:10.813Z"
    },
    {
      "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
      "name": "Thư Viện Số",
      "description": "Project số hóa tài liệu PDF",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-23T16:52:10.972Z",
      "updatedAt": "2025-12-23T16:52:10.972Z"
    },
    {
      "id": "0c08f09e-f996-454c-a9b0-055c35658fea",
      "name": "Sinoo khung bo",
      "description": "Desc ...",
      "color": "#3B82F6",
      "isArchived": false,
      "createdAt": "2025-12-25T05:33:54.970Z",
      "updatedAt": "2025-12-25T05:33:54.970Z"
    }
  ]
}
```

## List Chats in Project

### **GET** `/project/:projectId/chats`

**Param**:
projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "1d86b1ef-f248-420b-9413-21747c92bd9c",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:54:02.583Z",
      "updatedAt": "2025-12-25T06:54:05.592Z"
    },
    {
      "id": "62dc4be3-deeb-4360-bf90-c6613efaea4a",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:52:14.196Z",
      "updatedAt": "2025-12-25T06:52:16.691Z"
    },
    {
      "id": "3538ea80-e655-45e2-ad7a-5952871e1f2c",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:44:56.699Z",
      "updatedAt": "2025-12-25T06:45:04.120Z"
    },
    {
      "id": "84cf2155-4fde-4f61-ae96-21a9f113bc85",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:44:08.271Z",
      "updatedAt": "2025-12-25T06:44:11.607Z"
    },
    {
      "id": "e2c71722-deea-4568-ad41-e385493ab389",
      "title": "New Chat",
      "createdAt": "2025-12-25T06:43:52.259Z",
      "updatedAt": "2025-12-25T06:43:54.114Z"
    }
  ]
}
```

## List Documents in Project

### **GET** `/project/:projectId/documents`

**Param**: projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "addedAt": "2025-12-25T06:42:10.797Z",
      "isSelected": true,
      "linkId": "bcc2b031-8d14-4fe2-9b66-190090faa263",
      "id": "b75e74c0-58a1-4d11-ba67-3842e938211e",
      "title": "MGHP HK1(2025-2026).pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "MGHP HK1(2025-2026).pdf",
      "filePath": "uploads\\documents\\1766638685745-591043014.pdf",
      "mimeType": "application/pdf",
      "size": 2751843,
      "pageCount": 0,
      "status": "done",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T04:58:05.759Z",
      "updatedAt": "2025-12-25T04:58:16.140Z"
    },
    {
      "addedAt": "2025-12-25T06:42:10.797Z",
      "isSelected": true,
      "linkId": "1169513b-68b6-44dd-9c62-8802e1a99ae3",
      "id": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
      "title": "LV_CTUET_ThinhNhat.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "LV_CTUET_ThinhNhat.pdf",
      "filePath": "uploads\\documents\\1766638903777-216667186.pdf",
      "mimeType": "application/pdf",
      "size": 2743322,
      "pageCount": 0,
      "status": "done",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T05:01:43.787Z",
      "updatedAt": "2025-12-25T05:01:58.145Z"
    },
    {
      "addedAt": "2025-12-23T17:06:25.989Z",
      "isSelected": true,
      "linkId": "866d7528-48f0-4a8b-9594-680f4551c0b4",
      "id": "1c375418-270c-4a60-ac88-13aa5fb885f9",
      "title": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "filePath": "uploads\\documents\\1766509585247-333190162.pdf",
      "mimeType": "application/pdf",
      "size": 39998,
      "pageCount": 0,
      "status": "done",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-23T17:06:25.897Z",
      "updatedAt": "2025-12-23T17:06:30.157Z"
    }
  ]
}
```

## Update Project

### **PATCH** `/project/:projectId`

**Param**
projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Body**

```json
// some fields:  name, description, color, isArchived
{
  "name": "Sinoo khung bo 1101"
  // ... some fields to update
}
```

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "eae33420-8426-4f3e-b055-d4afeefad60b",
    "name": "Sinoo khung bo 1101",
    "description": "Desc ...",
    "color": "#3B82F6",
    "isArchived": false,
    "createdAt": "2025-12-08T15:48:49.375Z",
    "updatedAt": "2025-12-08T15:53:24.488Z",
    "userId": "bbe027d0-74ea-4630-a846-5040a9772d19"
  }
}
```

## Delete Project

### **DELETE** `/project/:projectId`

**Param**
projectId = eae33420-8426-4f3e-b055-d4afeefad60b

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "8a4457cd-9c0d-4346-a88e-16b0b1aed99e",
      "name": "MGHP HK1(2025-2026).pdf",
      "filePath": "uploads\\documents\\1765080486331-485462277.pdf",
      "mimeType": "application/pdf",
      "size": 2751843,
      "status": "done",
      "createdAt": "2025-12-07T04:08:06.354Z"
    }
  ]
}
```

---

# 📄 Documents

## Access static file

`http://localhost:8000/uploads/documents/1765080486331-485462277.pdf`

## Upload Document (Auto Ingest)

### **POST** `/document/upload/files`

**Headers**: Content-Type: multipart/form-data

**Mulit-Part (Body)**

```json
// multi part
{
  "files": "File[]",// multi-part... from form input
  "data": //Chuỗi JSON String. FE cần JSON.stringify(metadataObj) trước khi gửi.
}

// "data" exmaple
// {
//   "projectId": "eae33420-8426-4f3e-b055-d4afeefad60b", // Nếu muốn nằm ở trong project và muốn thêm file sau đó nó sẽ tự link 
//   "title": "Tên hiển thị (Optional)",
//   "description": "Mô tả ngắn",
//   "authors": ["Tác giả A", "Tác giả B"],
//   "tags": ["Tag1", "Tag2"],
//   "subjects": ["Chủ đề 1"],
//   "publishedYear": 2024,
//   "accessLevel": "PRIVATE"  // hoặc "PUBLIC", "RESTRICTED"
// }

// FE phải stringify object này trước khi gửi 
// formData.append('data', JSON.stringify(metadata));

```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": [
    {
      "url": "/uploads/documents/1764829198418-674679539.pdf"
    }
  ]
}
```

## Get All Document by user

### **GET** `/document`

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "1c375418-270c-4a60-ac88-13aa5fb885f9",
      "title": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "filePath": "uploads\\documents\\1766509585247-333190162.pdf",
      "mimeType": "application/pdf",
      "size": 39998,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-23T17:06:25.897Z",
      "updatedAt": "2025-12-23T17:06:30.157Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "866d7528-48f0-4a8b-9594-680f4551c0b4",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "1c375418-270c-4a60-ac88-13aa5fb885f9",
          "isSelected": true,
          "addedAt": "2025-12-23T17:06:25.989Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    },
    {
      "id": "b75e74c0-58a1-4d11-ba67-3842e938211e",
      "title": "MGHP HK1(2025-2026).pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "MGHP HK1(2025-2026).pdf",
      "filePath": "uploads\\documents\\1766638685745-591043014.pdf",
      "mimeType": "application/pdf",
      "size": 2751843,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T04:58:05.759Z",
      "updatedAt": "2025-12-25T04:58:16.140Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "bcc2b031-8d14-4fe2-9b66-190090faa263",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "b75e74c0-58a1-4d11-ba67-3842e938211e",
          "isSelected": true,
          "addedAt": "2025-12-25T06:42:10.797Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    },
    {
      "id": "5c4d7aa4-1460-4160-accc-ad5f2ea71e94",
      "title": "HTTT_CTDH_2022.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "HTTT_CTDH_2022.pdf",
      "filePath": "uploads\\documents\\1766638786657-7059145.pdf",
      "mimeType": "application/pdf",
      "size": 24305987,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T04:59:46.711Z",
      "updatedAt": "2025-12-25T05:01:02.794Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": []
    },
    {
      "id": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
      "title": "LV_CTUET_ThinhNhat.pdf",
      "description": "",
      "authors": [],
      "subjects": [],
      "tags": [],
      "documentType": "unknown",
      "publishedYear": null,
      "accessLevel": "PRIVATE",
      "originalName": "LV_CTUET_ThinhNhat.pdf",
      "filePath": "uploads\\documents\\1766638903777-216667186.pdf",
      "mimeType": "application/pdf",
      "size": 2743322,
      "pageCount": 0,
      "status": "PROCESSING",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T05:01:43.787Z",
      "updatedAt": "2025-12-25T05:01:58.145Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "1169513b-68b6-44dd-9c62-8802e1a99ae3",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "87fff748-6ba4-429c-93b7-47b2c7427f6e",
          "isSelected": true,
          "addedAt": "2025-12-25T06:42:10.797Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    },
    {
      "id": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
      "title": "Giáo trình AI",
      "description": "Demo upload",
      "authors": [
        "Teacher A"
      ],
      "subjects": [],
      "tags": [
        "AI"
      ],
      "documentType": "unknown",
      "publishedYear": 2024,
      "accessLevel": "PRIVATE",
      "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
      "filePath": "uploads\\documents\\1766670753505-891084681.pdf",
      "mimeType": "application/pdf",
      "size": 39998,
      "pageCount": 0,
      "status": "DONE",
      "metadata": null,
      "viewCount": 0,
      "createdAt": "2025-12-25T13:52:33.512Z",
      "updatedAt": "2025-12-25T13:52:37.474Z",
      "indexedAt": null,
      "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
      "linkedProjects": [
        {
          "id": "5154c96d-c0a5-43d4-9452-c7a284e53963",
          "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "documentId": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
          "isSelected": true,
          "addedAt": "2025-12-25T13:52:33.906Z",
          "project": {
            "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
            "name": "Thư Viện Số",
            "description": "Project số hóa tài liệu PDF",
            "color": "#3B82F6"
          }
        }
      ]
    }
  ]
}
```

## Get Document Detail by user

### **GET** `/document/:documentId`

**Param**

documentId = 8a4457cd-9c0d-4346-a88e-16b0b1aed99e

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
    "title": "Giáo trình AI",
    "description": "Demo upload",
    "authors": [
      "Teacher A"
    ],
    "subjects": [],
    "tags": [
      "AI"
    ],
    "documentType": "unknown",
    "publishedYear": 2024,
    "accessLevel": "PRIVATE",
    "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
    "filePath": "uploads\\documents\\1766670753505-891084681.pdf",
    "mimeType": "application/pdf",
    "size": 39998,
    "pageCount": 0,
    "status": "DONE",
    "metadata": null,
    "viewCount": 0,
    "createdAt": "2025-12-25T13:52:33.512Z",
    "updatedAt": "2025-12-25T13:52:37.474Z",
    "indexedAt": null,
    "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717",
    "linkedProjects": [
      {
        "id": "5154c96d-c0a5-43d4-9452-c7a284e53963",
        "projectId": "a1eb1073-7b5d-470b-bb70-929515554f9b",
        "documentId": "6499af04-1bf1-4a16-a2f6-a847f02f8526",
        "isSelected": true,
        "addedAt": "2025-12-25T13:52:33.906Z",
        "project": {
          "id": "a1eb1073-7b5d-470b-bb70-929515554f9b",
          "name": "Thư Viện Số",
          "description": "Project số hóa tài liệu PDF",
          "color": "#3B82F6"
        }
      }
    ]
  }
}
```

## Delete Document

### **DELETE** `/document/:documentId`

**Param**
documentId = 8a4457cd-9c0d-4346-a88e-16b0b1aed99e

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "6b4c5bb7-a05b-4661-8d1c-abf437e3ec9c",
    "title": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
    "description": "",
    "authors": [],
    "subjects": [],
    "tags": [],
    "documentType": "unknown",
    "publishedYear": null,
    "accessLevel": "PRIVATE",
    "originalName": "Nghiên cứu nước ngoài về mô hình ngôn ngữ lớn (LLM) và so sánh ChatGPT – Gemini.pdf",
    "filePath": "uploads\\documents\\1766654367238-651959962.pdf",
    "mimeType": "application/pdf",
    "size": 39998,
    "pageCount": 0,
    "status": "done",
    "metadata": null,
    "viewCount": 0,
    "createdAt": "2025-12-25T09:19:27.249Z",
    "updatedAt": "2025-12-25T09:19:33.060Z",
    "indexedAt": null,
    "userId": "4251d365-0aeb-4e5f-a5be-83b77017b717"
  }
}
```
<!-- --------------------- CHAT MODULE --------------------- -->
# 💬 Chat RAG Module

## Chat global

*Will have projectId = null

### **POST** `/chat/global`

**Query**
chatId = bbe027d0-74ea-4630-a846-5040a9772aaa

**Body**

```json
{
  "message": "Đối tượng nào được miễn giảm học phí năm 2025 2026"
}
```

**Response**

```json
{
  "statusCode": 201,
  "success": true,
  "data": {
    "answer": "Theo thông báo của Trường Đại học Kỹ thuật - Công nghệ Cần Thơ, các đối tượng được miễn, giảm học phí học kỳ I năm học 2025-2026 phải đáp ứng đủ 2 điều kiện:\n\n1. Thường trú tại thành phố Cần Thơ (sau sáp nhập).\n2. Thuộc đối tượng được miễn, giảm theo Nghị định số 238/2025/ND-CP.\n\nCụ thể, các đối tượng được miễn, giảm học phí bao gồm:\n\n### 1. Đối tượng được miễn học phí\n- Con của người hoạt động cách mạng trước tháng 08/1945; con của Anh hùng Lực lượng vũ trang nhân dân, Anh hùng Lao động trong thời kỳ kháng chiến; con của liệt sĩ, thương binh, bệnh binh được hưởng chính sách như thương binh, bệnh binh; con của người hoạt động kháng chiến bị nhiễm chất độc hóa học.\n- Sinh viên khuyết tật.\n- Sinh viên từ 16 đến 22 tuổi đang học văn bằng thứ nhất, không có nguồn nuôi dưỡng, thuộc đối tượng hưởng trợ cấp xã hội hàng tháng theo quy định tại khoản 1 và khoản 2 Điều 5 Nghị định số 20/2021/ND-CP.\n- Sinh viên là dân tộc thiểu số có cha hoặc mẹ hoặc cả cha và mẹ hoặc ông bà (trong trường hợp ở với ông bà) thuộc hộ nghèo và hộ cận nghèo theo quy định của Thủ tướng Chính phủ.\n- Sinh viên là dân tộc thiểu số rất ít người ở vùng có điều kiện kinh tế - xã hội khó khăn và đặc biệt khó khăn.\n\n### 2. Đối tượng được giảm 70% học phí\n- Sinh viên là người dân tộc thiểu số (ngoài đối tượng dân tộc thiểu số rất ít người) ở thôn/bản đặc biệt khó khăn, xã khu vực III vùng dân tộc và miền núi, xã đặc biệt khó khăn vùng bãi ngang ven biển hải đảo theo quy định của cơ quan có thẩm quyền.\n\n### 3. Đối tượng được giảm 50% học phí\n- Sinh viên là con cán bộ, công chức, viên chức, công nhân mà cha hoặc mẹ bị mắc bệnh nghề nghiệp hoặc tai nạn lao động được hưởng trợ cấp thường xuyên.\n\n**Lưu ý:** Nếu sinh viên thuộc nhiều diện miễn, giảm học phí thì chỉ được hưởng một chế độ ưu đãi cao nhất [#0][#1].",
    "citations": [
      {
        "index": 0,
        "snippet": "# THÔNG BÁO\n## Về các chế độ chính sách miễn, giảm học phí cho sinh viên chính quy học kỳ I năm học 2025 - 2026\n\nCăn cứ Nghị định số 238/2025/ND-CP ng...",
        "text": "# THÔNG BÁO\n## Về các chế độ chính sách miễn, giảm học phí cho sinh viên chính quy học kỳ I năm học 2025 - 2026\n\nCăn cứ Nghị định số 238/2025/ND-CP ngày 03 tháng 9 năm 2025 của Chính phủ quy định về chính sách học phí, miễn, giảm, hỗ trợ học phí, hỗ trợ chi phí học tập và giá dịch vụ trong lĩnh vực giáo dục, đào tạo, Trường Đại học Kỹ thuật - Công nghệ Cần Thơ thông báo đến lãnh đạo các khoa, cố vấn học tập và toàn thể sinh viên chính quy các nội dung sau:\n\n### I. Đối tượng được miễn, giảm: Sinh viên thuộc đối tượng được miễn, giảm học phí phải đủ 02 điều kiện sau:\n\n1. Thường trú tại thành phố Cần Thơ (sau sáp nhập).\n2. Thuộc đối tượng được miễn, giảm theo Nghị định số 238/2025/ND-CP (được nêu cụ thể tại phần \"Thủ tục thực hiện\").\n\n### II. Thủ tục thực hiện\n\nSinh viên thuộc đối tượng được miễn, giảm học phí cần nộp hồ sơ để được xét miễn, giảm học phí, cụ thể như sau:\n\n<table>\n  <thead>\n    <tr>\n        <th>1. Đối tượng miễn học phí</th>\n        <th>Hồ sơ cần thực hiện</th>\n    </tr>\n<tr>\n        <th>Đối tượng 1: (Khoản 2 - Điều 15)</th>\n        <th>-</th>\n    </tr>\n<tr>\n        <th>Con của người hoạt động cách mạng trước tháng 08/1945; Con của Anh hùng Lực lượng vũ trang nhân dân, Anh hùng Lao động trong thời kỳ kháng chiến; Con của liệt sĩ, thương binh, bệnh binh được hưởng chính sách như thương binh, bệnh binh; Con của người hoạt động kháng chiến bị nhiễm chất độc hóa học.</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);</th>\n    </tr>\n<tr>\n        <th></th>\n        <th>- Bản sao có công chứng Giấy xác nhận đối tượng do cơ quan quản lý đối với người có công.</th>\n    </tr>\n<tr>\n        <th>Đối tượng 2: (Khoản 3 - Điều 15)</th>\n        <th>-</th>\n    </tr>\n<tr>\n        <th>Sinh viên khuyết tật.</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);</th>\n    </tr>\n<tr>\n        <th></th>\n        <th>- Bản sao có công chứng Giấy xác nhận khuyết tật</th>\n    </tr>\n  </thead>\n</table>",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 1,
        "score": 0.96973956,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 1,
        "snippet": "2\n\n<table>\n  <thead>\n    <tr>\n        <th>**Đối tượng 3: (Khoản 4 - Điều 15)**</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;...",
        "text": "2\n\n<table>\n  <thead>\n    <tr>\n        <th>**Đối tượng 3: (Khoản 4 - Điều 15)**</th>\n        <th>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao có công chứng Quyết định về việc trợ cấp xã hội.</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n        <td>Sinh viên từ 16 tuổi đến 22 tuổi đang học văn bằng thứ nhất không có nguồn nuôi dưỡng thuộc đối tượng hưởng trợ cấp xã hội hàng tháng theo quy định tại khoản 1 và khoản 2 Điều 5 Nghị định số 20/2021/ND-CP.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**Đối tượng 4: (Khoản 7 - Điều 15)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Giấy chứng nhận hộ nghèo, hộ cận nghèo.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là dân tộc thiểu số có cha hoặc mẹ hoặc cả cha và mẹ hoặc ông bà (trong trường hợp ở với ông bà) thuộc hộ nghèo và hộ cận nghèo theo quy định của Thủ tướng Chính phủ.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**Đối tượng 5: (Khoản 10 - Điều 15)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao công chứng của Giấy khai sinh.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là dân tộc thiểu số rất ít người ở vùng có điều kiện kinh tế - xã hội khó khăn và đặc biệt khó khăn.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**2. Đối tượng giảm 70% học phí**</td>\n<td>**Hồ sơ cần thực hiện**</td>\n    </tr>\n<tr>\n        <td>**Đối tượng 6: (Khoản 1 - Điều 16)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao công chứng của Giấy khai sinh.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là người dân tộc thiểu số (ngoài đối tượng dân tộc thiểu số rất ít người) ở thôn/bản đặc biệt khó khăn, xã khu vực III vùng dân tộc và miền núi, xã đặc biệt khó khăn vùng bãi ngang ven biển hải đảo theo quy định của cơ quan có thẩm quyền.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**3. Đối tượng giảm 50% học phí**</td>\n<td>**Hồ sơ cần thực hiện**</td>\n    </tr>\n<tr>\n        <td>**Đối tượng 7: (Khoản 2 - Điều 16)**</td>\n<td>- Đơn đề nghị miễn, giảm học phí (theo mẫu);&lt;br&gt;- Bản sao công chứng của Quyết định hưởng trợ cấp hàng tháng của cha hoặc mẹ bị tai nạn lao động hoặc mắc bệnh nghề nghiệp do tổ chức Bảo hiểm xã hội cấp.</td>\n    </tr>\n<tr>\n        <td>Sinh viên là con cán bộ, công chức, viên chức, công nhân mà cha hoặc mẹ bị mắc bệnh nghề nghiệp hoặc tai nạn lao động được hưởng trợ cấp thường xuyên.</td>\n<td></td>\n    </tr>\n<tr>\n        <td>**Lưu ý:**</td>\n<td></td>\n    </tr>\n<tr>\n        <td>(1) Sinh viên thuộc diện miễn, giảm học phí cùng lúc hưởng nhiều chính sách hỗ trợ khác nhau thì chỉ được hưởng một chế độ ưu đãi cao nhất.</td>\n<td></td>\n    </tr>\n  </tbody>\n</table>\n\nScanned with<br>CS CamScanner™",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 2,
        "score": 0.9009141,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 4,
        "snippet": "# ĐƠN ĐỀ NGHỊ MIỄN, GIẢM HỌC PHÍ\n\nKính gửi:- Ban Giám hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ;  \n- Phòng Công tác Chính trị - Quản lý sinh vi...",
        "text": "# ĐƠN ĐỀ NGHỊ MIỄN, GIẢM HỌC PHÍ\n\nKính gửi:- Ban Giám hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ;  \n- Phòng Công tác Chính trị - Quản lý sinh viên - Khối nghiệp;  \n- Cố vấn học tập: ……………………………………………\n\nHọ và tên sinh viên: ………………………………………… CC/CCCD: …………………………………………  \nNgày, tháng, năm sinh: …………………………………………  \nNơi sinh: …………………………………………  \nLớp: ………………………………………… Khoa: …………………………………………  \nMSSV: …………………………………………  \nSố điện thoại sinh viên: ………………………………………… Số điện thoại người thân: …………………………………………  \nĐịa chỉ thường trú cũ: …………………………………………  \nĐịa chỉ thường trú mới: …………………………………………  \nThuộc đối tượng: …………………………………………  \n\n(Ghi rõ đối tượng được quy định tại Nghị định 238/2025/ND-CP)\n\nCăn cứ vào Nghị định số 238/2025/ND-CP của Chính phủ, tôi làm đơn này đề nghị được Nhà trường xem xét để được miễn, giảm học phí theo quy định và chế độ hiện hành.\n\n……, ngày …… tháng …… năm ……\n\n**Xác nhận của CVHT**  \n………………………………………  \n………………………………………  \n………………………………………\n\n**Người làm đơn**  \n(Ký tên và ghi rõ họ tên)  \n………………………………………",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 5,
        "score": 0.84927243,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 2,
        "snippet": "(2) Danh mục vùng, địa bàn có điều kiện kinh tế - xã hội đặc biệt khó khăn áp dụng đối với đối tượng 5 và đối tượng 6 theo phụ lục đính kèm thông báo ...",
        "text": "(2) Danh mục vùng, địa bàn có điều kiện kinh tế - xã hội đặc biệt khó khăn áp dụng đối với đối tượng 5 và đối tượng 6 theo phụ lục đính kèm thông báo này. Sinh viên cần có theo địa chỉ thường trú trước sáp nhập để xét.\n\nIII. Thời gian và địa điểm nộp hồ sơ:\n\nSinh viên nộp trực tiếp tại Phòng Công tác Chính trị - Quản lý sinh viên - Khối nghiệp đến hết ngày 03/10/2025. Để biết thêm thông tin vui lòng liên hệ Phòng Công tác Chính trị - Quản lý sinh viên - Khối nghiệp (Cô Đinh Việt Tuyết Hiền, ĐT: 0919.232.577).\n\nNoi nhận:\n- Các đơn vị;\n- website Phòng QLSV;\n- Lưu: VT, QLSV.\n(Hiện)\n\nKT. HIỆU TRƯỞNG\nPHÓ HIỆU TRƯỞNG\nNguyễn Thị Yên Chi",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 3,
        "score": 0.7214293,
        "startOffset": 0,
        "endOffset": 0
      },
      {
        "index": 3,
        "snippet": "# PHỤ LỤC\n## DANH MỤC VÙNG, ĐỊA BÀN CÓ ĐIỀU KIỆN KINH TẾ - XÃ HỘI ĐẶC BIỆT KHÓ KHĂN\n(Kèm theo Thông báo số 169/TB-DHKTGN ngày 16 tháng 9 năm 2025 của ...",
        "text": "# PHỤ LỤC\n## DANH MỤC VÙNG, ĐỊA BÀN CÓ ĐIỀU KIỆN KINH TẾ - XÃ HỘI ĐẶC BIỆT KHÓ KHĂN\n(Kèm theo Thông báo số 169/TB-DHKTGN ngày 16 tháng 9 năm 2025 của Trường Đại học Kỹ thuật – Công nghệ Cần Thơ)\n\n1. Quyết định số 353/QĐ-TTg ngày 15 tháng 3 năm 2022 của Thủ tướng Chính phủ: Phê duyệt danh sách huyện nghèo, xã đặc biệt khó khăn vùng bãi ngang, ven biển và hải đảo giai đoạn 2021 - 2025;\n\n2. Quyết định số 576/QĐ-TTg ngày 22 tháng 6 năm 2024 của Thủ tướng Chính phủ: Công nhận 09 xã đặc biệt khó khăn vùng bãi ngang, ven biển và hải đảo giai đoạn 2021 - 2025 thoát khỏi tình trạng đặc biệt khó khăn;\n\n3. Quyết định số 861/QĐ-TTg ngày 04 tháng 6 năm 2021 của Thủ tướng Chính phủ: Phê duyệt danh sách các xã khu vực III, khu vực II, khu vực I thuộc vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2025;\n\n4. Quyết định số 698/QĐ-TTg ngày 19 tháng 7 năm 2024 của Thủ tướng Chính phủ: Phê duyệt điều chỉnh, bổ sung và hiệu chỉnh danh sách xã khu vực III, khu vực II, khu vực I thuộc vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2025;\n\n5. Quyết định số 612/QĐ-UBDT ngày 16 tháng 9 năm 2021 phê duyệt danh sách các thôn đặc biệt khó khăn vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2025;\n\n6. Quyết định số 497/QĐ-UBDT ngày 30 tháng 7 năm 2024 phê duyệt điều chỉnh và hiệu chỉnh tên huyện, xã, thôn đặc biệt khó khăn; thôn thuộc vùng dân tộc thiểu số và miền núi giai đoạn 2021 - 2025.",
        "fileId": "ee6016ad-58b7-44c3-b334-411b9619f35f",
        "fileUrl": "uploads\\documents\\1767614161574-58673668.pdf",
        "page": 4,
        "score": 0.6509999,
        "startOffset": 0,
        "endOffset": 0
      }
    ],
    "chatId": "53852a0e-6bb8-49c0-b17d-e5accb980355"
  }
}
```

## New chat and Chat Session

### **POST** `/project/:projectId/chats/messages`

**Param**:
projectId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Query**:

``` json
// chatId null thì tạo mới chat, sau khi tạo xong gắng chatId vào để tiếp tục chat 
chatId = bbe027d0-74ea-4630-a846-5040a9772aaa
```

Body and Response same with `/chat/global`

## Get Chat Detail

### **GET** `/chat/:chatId/messages`

**Param**
chatId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "bdb88320-5a0a-4153-8f9a-1d1a9e43d3eb",
    "title": "New Chat",
    "createdAt": "2025-12-28T08:17:52.074Z",
    "updatedAt": "2025-12-28T08:17:55.145Z",
    "userId": "977a368e-abfe-4a38-adbe-4625cce8d500",
    "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
    "messages": [
      {
        "role": "user",
        "content": "Cho tôi biết kiến trúc hệ thống và công nghệ của luận văn tốt nghiệp của tác giả Trường Thịnh và Minh Nhật. Vậy kiến trúc này có giống kiến trúc RAG không hay chỉ là một phiên bản đơn giản hơn"
      },
      {
        "role": "assistant",
        "content": "Tài liệu hiện tại không chứa thông tin về kiến trúc hệ thống và công nghệ của luận văn tốt nghiệp của tác giả Trường Thịnh và Minh Nhật, cũng như không đề cập đến việc kiến trúc này có giống kiến trúc RAG hay chỉ là một phiên bản đơn giản hơn. Nội dung tài liệu chủ yếu tập trung vào các mô hình ngôn ngữ lớn như ChatGPT và Gemini, cùng các công nghệ liên quan đến LLM hiện đại [#0][#5][#10][#12].",
        "citation": [
          {
            "page": 2,
            "text": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay.",
            "index": 12,
            "score": 0.9077052703255086,
            "fileId": "c65128ad-9272-46a3-a20d-9c3d83096727",
            "fileUrl": "uploads\\documents\\1766909856075-818194294.pdf",
            "snippet": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tu...",
            "endOffset": 7353,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 6616
          },
          {
            "page": 2,
            "text": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tuy nhiên,  ở bài kiểm tra HellaSwag về suy luận thường thức ,   GPT-4 (ChatGPT)  lại    nhỉnh hơn Gemini Ultra  đôi chút, phản ánh rằng  mô hình của OpenAI vẫn dẫn trước về một số khả năng hiểu biết ngữ cảnh thường nhật . Điều này gợi ý rằng  hiệu suất của LLM  phụ thuộc vào tính chất của từng nhiệm vụ cũng như  cách thức huấn luyện : mô hình có thể vượt trội trong lĩnh vực này nhưng kém hơn ở lĩnh vực khác.  Tóm lại,  các nghiên cứu nước ngoài  đã và đang làm sáng tỏ bức tranh phát triển của LLM, từ nền tảng Transformer  đến những hệ thống đa năng như  ChatGPT và Gemini  ngày nay.",
            "index": 12,
            "score": 0.907649701833725,
            "fileId": "24e58995-f414-4530-a863-56c3dc85e287",
            "fileUrl": "uploads\\documents\\1766727002595-897595108.pdf",
            "snippet": "Gemini Ultra thậm chí vượt qua cả mức trung bình của chuyên gia con người trên bộ đề MMLU , cho thấy tiềm năng xuất sắc về  kiến thức và suy luận . Tu...",
            "endOffset": 7353,
            "projectId": "b90a5e74-9cf9-416b-9acc-900bee4baa02",
            "startOffset": 6616
          },
          // ...
        ]
      }
    ]
  }
}
```

## Get Global Chats

### **GET** `/chat/user/global`

**Note:** Get all chats that have `projectId` = null

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": [
    {
      "id": "05db033f-643d-4cbc-92cc-8b13538eb217",
      "title": "New Chat",
      "createdAt": "2025-12-25T05:07:23.316Z",
      "updatedAt": "2025-12-25T05:07:32.142Z",
      "projectId": null
    },
    {
      "id": "65d1f823-e0d2-4e92-b32b-97351ce85561",
      "title": "New Chat",
      "createdAt": "2025-12-25T05:04:19.340Z",
      "updatedAt": "2025-12-25T05:04:23.696Z",
      "projectId": null
    }
  ]
}
```

## Update chat

### **PATCH** `/chat/user/:chatId`

**Param**
chatId = bbe027d0-74ea-4630-a846-5040a9772jkk

**Body**

```json
{
    // Just update 2 fields
    "title": "Sinoo chat",
    "projectId": "46da89f2-401a-489c-98ea-4a4121d6ed91"
}
```

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "65d1f823-e0d2-4e92-b32b-97351ce85561",
    "title": "Sinoo chat moved",
    "createdAt": "2025-12-25T05:04:19.340Z",
    "updatedAt": "2025-12-25T14:23:51.997Z",
    "projectId": "cf3ad296-3044-451f-84db-9fc99c9e327d"
  }
}
```

## Delete chat

### **DELETE** `/chat/user/:chatId`

**Param**
chatId = db4d69de-d88f-4ae8-8dc1-d087907dc195

**Response**

```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "id": "65d1f823-e0d2-4e92-b32b-97351ce85561",
    "title": "Sinoo chat moved",
    "createdAt": "2025-12-25T05:04:19.340Z",
    "updatedAt": "2025-12-25T14:23:51.997Z",
    "projectId": "cf3ad296-3044-451f-84db-9fc99c9e327d"
  }
}
```

---

# 📙 Response Format

## Success Response

```json
{
  "statusCode": 200, // 201, 400, 500
  "success": true,
  "data": // {} or [],
}
```

```
