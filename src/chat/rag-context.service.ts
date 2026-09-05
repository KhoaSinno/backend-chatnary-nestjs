import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import { LlmService } from '../llm/llm.service';
import { LlmMessage } from '../llm/llm.types';
import {
  RetrievalService,
  ScoredDocument,
} from '../retrieval/retrieval.service';
import { Citation, RagContext } from './chat.types';

type FileGroup = {
  fileId: string;
  fileName: string;
  maxScore: number;
  chunks: Array<{ content: string; index: number }>;
};

@Injectable()
export class RagContextService {
  constructor(
    private readonly llm: LlmService,
    private readonly retrieval: RetrievalService,
  ) {}

  async build(input: {
    question: string;
    history: LlmMessage[];
    userId: string;
    projectId?: string;
  }): Promise<RagContext | null> {
    const query = await this.llm.rewriteQuestion(input.history, input.question);
    const documents = await this.retrieval.retrieveAndRerank(
      query,
      input.userId,
      input.projectId,
    );
    if (documents.length === 0) return null;

    const context = this.contextFrom(documents);
    return {
      citations: this.citationsFrom(documents),
      messages: [
        { role: 'system', content: this.systemPrompt() },
        ...input.history,
        {
          role: 'user',
          content: `CONTEXT TÀI LIỆU:\n${context}\n\n---\nCÂU HỎI CỦA TÔI:\n${input.question}`,
        },
      ],
    };
  }

  private contextFrom(documents: ScoredDocument[]): string {
    const groups = new Map<string, FileGroup>();

    for (const document of documents) {
      if (document.pageContent.length < 30) continue;
      const fileId = document.metadata.fileId ?? 'unknown';
      const existing = groups.get(fileId) ?? {
        fileId,
        fileName: path.parse(document.metadata.originalFileName ?? fileId).name,
        maxScore: 0,
        chunks: [],
      };
      existing.maxScore = Math.max(existing.maxScore, document.finalScore ?? 0);
      existing.chunks.push({
        content: document.pageContent,
        index: document.metadata.chunkIndex ?? 0,
      });
      groups.set(fileId, existing);
    }

    return [...groups.values()]
      .sort((left, right) => right.maxScore - left.maxScore)
      .map((group) => {
        const chunks = group.chunks
          .sort((left, right) => left.index - right.index)
          .map((chunk) => `(Trích đoạn #${chunk.index}): ${chunk.content}`)
          .join('\n\n');
        return `--- NGUỒN TÀI LIỆU: "${group.fileName}" ---\n${chunks}`;
      })
      .join('\n\n');
  }

  private citationsFrom(documents: ScoredDocument[]): Citation[] {
    return documents.map((document) => ({
      index: document.metadata.chunkIndex ?? 0,
      snippet: `${document.pageContent.substring(0, 150)}...`,
      text: document.pageContent,
      fileId: document.metadata.fileId ?? '',
      fileUrl: document.metadata.fileUrl ?? '',
      page: document.metadata.page ?? 0,
      score: document.finalScore,
      startOffset: document.metadata.startOffset ?? 0,
      endOffset: document.metadata.endOffset ?? 0,
      projectId: document.metadata.projectId,
    }));
  }

  private systemPrompt(): string {
    return [
      'Bạn là trợ lý AI chuyên nghiệp, chỉ trả lời dựa trên tài liệu được cung cấp.',
      'Ưu tiên các nguồn xuất hiện trước; nếu tài liệu mâu thuẫn, ưu tiên nguồn phù hợp hơn.',
      'Nếu tài liệu không đủ, nói rõ điều đó và không bịa thông tin.',
      'Mọi thông tin thực tế phải ghi dẫn chứng dạng [#index] với index có trong context.',
    ].join('\n');
  }
}
