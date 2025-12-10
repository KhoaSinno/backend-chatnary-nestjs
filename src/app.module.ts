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

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // PROJECT_ROOT/uploads
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: Joi.object({
        OPENAI_API_KEY: Joi.string().required(),
        DATABASE_URL_NEON: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().optional(),
      }),
    }),

    IngestModule,
    DocumentModule,
    ChatModule,
    PipelineModule,
    OpenaiModule,
    PrismaModule,
    ProjectModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
