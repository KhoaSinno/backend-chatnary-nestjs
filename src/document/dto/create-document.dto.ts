import { AccessLevelDoc } from '../../constant/index.constant';

export class CreateDocumentDto {
  projectId: string;
  name: string;
  filePath: string;
  mimeType?: string;
  size?: number;
  status: string;
  userId: string;

  title?: string;
  description?: string;
  authors?: string[];
  subjects?: string[];
  tags?: string[];
  documentType?: string;
  publishedYear?: number;
  accessLevel: AccessLevelDoc;

  metadata?: any;

  indexedAt?: Date;
  viewCount: number;
}
