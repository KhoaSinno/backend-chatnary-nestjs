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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    IngestModule,
    DocumentModule,
    ChatModule,
    PipelineModule,
    OpenaiModule,
    PrismaModule,
    ProjectModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
