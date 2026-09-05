import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { LlmMessage, ChatModelPurpose } from './llm.types';

@Injectable()
export class LlmService {
  constructor(private readonly config: ConfigService) {}

  async answer(messages: LlmMessage[]): Promise<string> {
    const response = await this.chatModel('answer').invoke(messages);
    return this.toText(response.content);
  }

  async *streamAnswer(messages: LlmMessage[]): AsyncGenerator<string> {
    const stream = await this.chatModel('answer').stream(messages);

    for await (const chunk of stream) {
      const text = this.toText(chunk.content);
      if (text) yield text;
    }
  }

  async rewriteQuestion(
    history: LlmMessage[],
    question: string,
  ): Promise<string> {
    if (history.length === 0) return question;

    const response = await this.chatModel('rewrite').invoke([
      {
        role: 'system',
        content:
          'Viết lại câu hỏi cuối thành câu hỏi độc lập dựa trên lịch sử. ' +
          'Không trả lời câu hỏi, không thêm giải thích; giữ nguyên nếu đã rõ nghĩa.',
      },
      ...history,
      { role: 'user', content: question },
    ]);

    return this.toText(response.content).trim() || question;
  }

  embeddings(): OpenAIEmbeddings {
    return new OpenAIEmbeddings({
      apiKey: this.apiKey,
      model:
        this.config.get<string>('OPENAI_EMBEDDING_MODEL') ??
        'text-embedding-3-small',
    });
  }

  private chatModel(purpose: ChatModelPurpose): ChatOpenAI {
    const isRewrite = purpose === 'rewrite';
    return new ChatOpenAI({
      apiKey: this.apiKey,
      model: isRewrite
        ? (this.config.get<string>('OPENAI_REWRITE_MODEL') ?? 'gpt-4o-mini')
        : (this.config.get<string>('OPENAI_CHAT_MODEL') ?? 'gpt-4.1'),
      temperature: 0,
      maxRetries: 2,
    });
  }

  private get apiKey(): string {
    const apiKey = this.config.get<string>('openai.apiKey');
    if (!apiKey) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }
    return apiKey;
  }

  private toText(content: unknown): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map((part) => this.textFromPart(part)).join('');
    }
    return '';
  }

  private textFromPart(part: unknown): string {
    if (typeof part !== 'object' || part === null || !('text' in part)) {
      return '';
    }
    const text = (part as Record<string, unknown>).text;
    return typeof text === 'string' ? text : '';
  }
}
