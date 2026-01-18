import {
    IsString,
    IsNotEmpty,
    IsInt,
    Min,
    Max,
    IsOptional,
    IsIn,
    IsUUID
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuizDto {
    // Set by backend from JWT token
    userId?: string;

    @ApiProperty({
        description: 'ID của project chứa tài liệu để tạo quiz',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsNotEmpty({ message: 'Project ID không được để trống' })
    @IsUUID('4', { message: 'Project ID phải là UUID hợp lệ' })
    @IsString()
    projectId: string;

    @ApiProperty({
        description: 'Chủ đề hoặc nội dung cần tạo quiz',
        example: 'Lịch sử Việt Nam thế kỷ 20',
        minLength: 3,
        maxLength: 200
    })
    @IsNotEmpty({ message: 'Topic không được để trống' })
    @IsString({ message: 'Topic phải là chuỗi ký tự' })
    topic: string;

    @ApiProperty({
        description: 'Số lượng câu hỏi muốn tạo',
        example: 10,
        minimum: 1,
        maximum: 50
    })
    @IsNotEmpty({ message: 'Số câu hỏi không được để trống' })
    @IsInt({ message: 'Số câu hỏi phải là số nguyên' })
    @Min(1, { message: 'Số câu hỏi phải ít nhất 1' })
    @Max(50, { message: 'Số câu hỏi tối đa 50' })
    numQuestions: number;

    @ApiPropertyOptional({
        description: 'Độ khó của quiz',
        example: 'MEDIUM',
        enum: ['EASY', 'MEDIUM', 'HARD'],
        default: 'MEDIUM'
    })
    @IsOptional()
    @IsString({ message: 'Difficulty phải là chuỗi ký tự' })
    @IsIn(['EASY', 'MEDIUM', 'HARD'], {
        message: 'Difficulty phải là EASY, MEDIUM hoặc HARD'
    })
    difficulty?: string = 'MEDIUM';

    @ApiPropertyOptional({
        description: 'Thời gian làm bài (phút)',
        example: 30,
        minimum: 5,
        maximum: 180,
        default: 30
    })
    @IsOptional()
    @IsInt({ message: 'Time limit phải là số nguyên' })
    @Min(5, { message: 'Thời gian làm bài ít nhất 5 phút' })
    @Max(180, { message: 'Thời gian làm bài tối đa 180 phút' })
    timeLimit?: number = 30;
}
