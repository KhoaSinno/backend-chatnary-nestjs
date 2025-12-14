export class CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
  userId: string;
}
