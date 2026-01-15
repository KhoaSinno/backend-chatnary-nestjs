export class CreateQuizDto {
    userId?: string;
    projectId: string;
    topic: string;
    numQuestions: number;
    difficulty?: string;
    timeLimit?: number;
}
