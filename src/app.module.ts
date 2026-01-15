import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngestModule } from './ingest/ingest.module';
import { DocumentModule } from './document/document.module';
import { ChatModule } from './chat/chat.module';
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
import 'winston-daily-rotate-file';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule } from './queue/queue.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationController } from './notification/notification.controller';
import { NotificationModule } from './notification/notification.module';
@Module({
  imports: [

    // Event emitter
    EventEmitterModule.forRoot(),
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

        // Redis (BullMQ)
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_USERNAME: Joi.string().optional().default('default'),
        REDIS_PASSWORD: Joi.string().required(),
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
    OpenaiModule,
    PrismaModule,
    ProjectModule,
    AuthModule,
    UserModule,
    RetrievalModule,
    // BullMQ Global Configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get<string>('REDIS_USERNAME') || 'default',
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    QueueModule,
    NotificationModule,
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
export class AppModule { }
