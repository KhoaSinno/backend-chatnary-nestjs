import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) { }

  @Post()
  generate(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() createQuizDto: CreateQuizDto) {
    createQuizDto.userId = req.user.userId;
    return this.quizService.generate(createQuizDto);
  }

}
