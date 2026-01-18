import {
  Controller,
  Post,
  Body,
  Req,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Get,
  Param
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { JwtPayloadWithRt } from '../auth/strategies/refresh.strategy';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@ApiTags('Quiz')
@ApiBearerAuth()
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) { }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Tạo quiz tự động từ tài liệu',
    description: 'Sử dụng AI để tạo bài quiz trắc nghiệm dựa trên nội dung tài liệu trong project'
  })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quiz được tạo thành công',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Lịch sử Việt Nam',
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        difficulty: 'MEDIUM',
        timeLimit: 30,
        questions: [
          {
            question: 'Việt Nam giành độc lập năm nào?',
            options: ['A. 1945', 'B. 1946', 'C. 1954', 'D. 1975'],
            correctAnswer: 'A',
            explanation: 'Ngày 2/9/1945 Chủ tịch Hồ Chí Minh đọc Tuyên ngôn độc lập'
          }
        ],
        createdAt: '2026-01-15T10:00:00Z'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy project hoặc tài liệu'
  })
  async generate(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() createQuizDto: CreateQuizDto
  ) {
    createQuizDto.userId = req.user.userId;
    return this.quizService.generate(createQuizDto);
  }

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Submit quiz',
    description: 'Submit quiz answers'
  })
  @ApiBody({ type: SubmitQuizDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quiz submitted successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        score: 10,
        userAnswers: {
          '123e4567-e89b-12d3-a456-426614174000': 'A',
          '123e4567-e89b-12d3-a456-426614174001': 'B',
          '123e4567-e89b-12d3-a456-426614174002': 'C',
          '123e4567-e89b-12d3-a456-426614174003': 'D',
        },
        createdAt: '2026-01-15T10:00:00Z'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy quiz'
  })
  async submitQuiz(
    @Req() req: { user: JwtPayloadWithRt },
    @Body() submitQuizDto: SubmitQuizDto
  ) {
    submitQuizDto.userId = req.user.userId;
    return this.quizService.submitQuiz(submitQuizDto);
  }

  // == GET == 
  @Get('history')
  getHistory(@Req() req: { user: JwtPayloadWithRt }) {
    return this.quizService.getQuizAttempts(req.user.userId);
  }

  @Get('history/:id')
  getAttemptDetail(@Req() req: { user: JwtPayloadWithRt }, @Param('id') id: string) {
    return this.quizService.getQuizAttemptDetail(req.user.userId, id);
  }
}
