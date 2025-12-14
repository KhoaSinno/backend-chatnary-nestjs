import { Injectable } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenaiService {
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('openai.apiKey')!;
  }

  getChatModel(modelName = 'gpt-4.1') {
    return new ChatOpenAI({
      model: modelName,
      apiKey: this.apiKey,
      temperature: 0,
      maxRetries: 2,
    });
  }

  getEmbeddings(model = 'text-embedding-3-small') {
    return new OpenAIEmbeddings({
      model,
      apiKey: this.apiKey,
    });
  }
}
