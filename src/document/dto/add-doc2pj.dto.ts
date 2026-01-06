import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AddDocumentToProjectDto {
  @IsArray()
  @IsUUID('4', { each: true }) // Validate từng phần tử trong mảng phải là UUID
  @IsNotEmpty()
  documentIds: string[];
}
