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
        OPENAI_API_KEY: Joi.string().required(),
        DATABASE_URL_NEON: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().optional(),
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
