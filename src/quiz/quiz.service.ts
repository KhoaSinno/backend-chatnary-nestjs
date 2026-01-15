import { Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { OpenaiService } from '../llm/openai/openai.service';

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
    private readonly openaiService: OpenaiService,
  ) { }
  generate(quizDto: CreateQuizDto) {
    return 'This action adds a new quiz';
  }

}
