import { Injectable } from '@nestjs/common';

@Injectable()
export class OcrService {
  // THis way use OpenAI OCR directly
  //     async loadImage(path: string) {
  //     const buffer = await fs.promises.readFile(path);
  //     const text = await this.openai.ocrImage(buffer);
  //     return text;
  //   }
}
