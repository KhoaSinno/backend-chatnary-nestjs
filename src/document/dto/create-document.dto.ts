export class CreateDocumentDto {
  projectId: string;
  name: string;
  filePath: string;
  mimeType?: string;
  size?: number;
  status: string;
}
