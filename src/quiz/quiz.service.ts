import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { OpenaiService } from '../llm/openai/openai.service';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

interface QuizQuestionData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retrievalService: RetrievalService,
    private readonly openaiService: OpenaiService,
  ) { }

  async generate(quizDto: CreateQuizDto) {
    // 1. Verify project exists and belongs to user
    const project = await this.prisma.project.findFirst({
      where: {
        id: quizDto.projectId,
        userId: quizDto.userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or you do not have access');
    }

    // 2. Retrieve relevant documents
    const relevantDocs = await this.retrievalService.retrieveAndRerank(
      quizDto.topic || 'General summary',
      quizDto.userId!,
      quizDto.projectId
    );

    if (!relevantDocs || relevantDocs.length === 0) {
      throw new NotFoundException(
        'No documents found in this project. Please upload documents first.'
      );
    }

    // 3. Build context from documents
    const context = relevantDocs.map(d => d.pageContent).join('\n\n');

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

    const response = await this.openaiService.getChatModel().invoke([
      new SystemMessage('Bạn là chuyên gia tạo đề thi. Chỉ trả về JSON thuần, không có markdown.'),
      new HumanMessage(prompt)
    ]);

    // 5. Parse AI response
    let quizData: QuizQuestionData[];
    try {
      // Clean markdown json tags if present (```json ... ```)
      const cleanJson = (response.content as string)
        .replace(/```json|```/g, '')
        .trim();
      quizData = JSON.parse(cleanJson);

      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error('Invalid quiz data format');
      }
    } catch (e) {
      throw new BadRequestException(
        `AI returned invalid format. Please try again. Error: ${e.message}`
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
}
