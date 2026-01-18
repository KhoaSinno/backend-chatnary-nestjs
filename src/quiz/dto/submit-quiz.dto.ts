import { IsDate, IsNotEmpty, IsObject, IsUUID, IsOptional } from 'class-validator';

export class SubmitQuizDto {
    @IsUUID()
    @IsOptional()
    userId?: string;

    @IsUUID()
    @IsNotEmpty()
    quizId: string;

    // Dạng Map: { "questionId_1": "A", "questionId_2": "C" }
    @IsObject()
    @IsNotEmpty()
    answers: Record<string, string>;

    @IsDate()
    @IsOptional()
    finishedAt: Date | null;

    @IsDate()
    @IsOptional()
    startedAt: Date | null;
}