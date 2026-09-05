import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { RetrievalModule } from '../retrieval/retrieval.module';

@Module({
  imports: [PrismaModule, LlmModule, RetrievalModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
