import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
  async load(filePath: string): Promise<string> {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    // return docs;
    return docs.map((d) => d.pageContent).join('\n');
  }
}
