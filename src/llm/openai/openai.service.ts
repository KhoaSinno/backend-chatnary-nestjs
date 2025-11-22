import { Injectable } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { envConfig } from '../../config/env.config';

@Injectable()
export class OpenaiService {
  model = new ChatOpenAI({
    model: 'gpt-4.1',
    apiKey: envConfig().OPENAI_API_KEY,
  });

  embeddings = () =>
    new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
    });
}
