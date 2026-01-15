import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenaiModule } from '../llm/openai/openai.module';
import { RetrievalModule } from '../retrieval/retrieval.module';

@Module({
  imports: [PrismaModule, OpenaiModule, RetrievalModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule { }
