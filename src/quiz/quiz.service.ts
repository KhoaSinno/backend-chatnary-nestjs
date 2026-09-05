import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { LlmService } from '../llm/llm.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

export type QuizQuestionData = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

export type AttemptQuestion = {
  questionId: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
};

const isQuizQuestionData = (value: unknown): value is QuizQuestionData => {
  if (typeof value !== 'object' || value === null) return false;
  const question = value as Record<string, unknown>;
  return (
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.every((option) => typeof option === 'string') &&
    typeof question.correctAnswer === 'string' &&
    (question.explanation === undefined ||
      typeof question.explanation === 'string')
  );
};

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
    private readonly llm: LlmService,
  ) {}
  // == generate quiz ==

  async generate(quizDto: CreateQuizDto) {
    // 1. Verify project exists and belongs to user
    const project = await this.prisma.project.findFirst({
      where: {
        id: quizDto.projectId,
        userId: quizDto.userId,
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have access',
      );
    }

    // 2. Retrieve relevant documents
    const relevantDocs = await this.retrievalService.retrieveAndRerank(
      quizDto.topic || 'General summary',
      quizDto.userId!,
      quizDto.projectId,
    );

    if (!relevantDocs || relevantDocs.length === 0) {
      throw new NotFoundException(
        'No documents found in this project. Please upload documents first.',
      );
    }

    // 3. Build context from documents
    const context = relevantDocs.map((d) => d.pageContent).join('\n\n');

    // 4. Generate quiz using AI
    const prompt = `
      Dựa vào tài liệu sau, hãy tạo một bài trắc nghiệm ${quizDto.numQuestions} câu hỏi.
      
      CONTEXT:
      ${context}

      YÊU CẦU:
      1. Độ khó: ${quizDto.difficulty || 'MEDIUM'}.
      2. Output bắt buộc là JSON array, không có markdown.
      3. Câu hỏi phải dựa trên nội dung tài liệu, không tự bịa.
      4. Format JSON chính xác:
      [
        {
          "question": "Câu hỏi...",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correctAnswer": "A",
          "explanation": "Giải thích Chi tiết..."
        }
      ]
    `;

    const response = await this.llm.answer([
      {
        role: 'system',
        content:
          'Bạn là chuyên gia tạo đề thi. Chỉ trả về JSON thuần, không có markdown.',
      },
      { role: 'user', content: prompt },
    ]);

    // 5. Parse AI response
    let quizData: QuizQuestionData[];
    try {
      // Clean markdown json tags if present (```json ... ```)
      const cleanJson = response.replace(/```json|```/g, '').trim();
      const parsed: unknown = JSON.parse(cleanJson);

      if (
        !Array.isArray(parsed) ||
        parsed.length === 0 ||
        !parsed.every(isQuizQuestionData)
      ) {
        throw new Error('Invalid quiz data format');
      }
      quizData = parsed;
    } catch (error: unknown) {
      throw new BadRequestException(
        `AI returned invalid format. Please try again. Error: ${this.errorMessage(error)}`,
      );
    }

    // 6. Save to database with transaction
    const quiz = await this.prisma.quiz.create({
      data: {
        title: quizDto.topic,
        projectId: quizDto.projectId,
        difficulty: quizDto.difficulty || 'MEDIUM',
        timeLimit: quizDto.timeLimit || 30,
        questions: {
          create: quizData.map((q) => ({
            questionText: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
          })),
        },
      },
      include: {
        questions: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return quiz;
  }

  // == Submit ==

  async submitQuiz(body: SubmitQuizDto) {
    // Get quiz
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: body.quizId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const resultArr: AttemptQuestion[] = [];
    let countCorrectQuestion = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((q) => {
      const isCorrect = q.correctAnswer === body.answers[q.id];
      if (isCorrect) {
        countCorrectQuestion++;
      }

      resultArr.push({
        questionId: q.id,
        userAnswer: body.answers[q.id] || null, // Có thể user không chọn
        correctAnswer: q.correctAnswer,
        isCorrect: isCorrect,
        explanation: q.explanation,
      });
    });

    // == Calculate score
    const score =
      totalQuestions > 0
        ? Number((countCorrectQuestion / totalQuestions) * 10).toFixed(2)
        : 0;

    // Ensure userId exists (should be populated by controller from JWT)
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }

    const attempt = await this.prisma.userQuizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: body.userId,
        score: Number(score),
        userAnswers: body.answers,
      },
    });

    return {
      attemptId: attempt.id,
      score: Number(score),
      totalQuestions: totalQuestions,
      details: resultArr,
    };
  }

  // Get history user attempts
  async getQuizAttempts(userId: string) {
    return await this.prisma.userQuizAttempt.findMany({
      where: { userId },
      include: {
        quiz: { select: { title: true, difficulty: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Get detail of a specific attempt
  async getQuizAttemptDetail(userId: string, attemptId: string) {
    return await this.prisma.userQuizAttempt.findUnique({
      where: { id: attemptId, userId }, //  Check userId to save security
      include: {
        quiz: { include: { questions: true } },
      },
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
