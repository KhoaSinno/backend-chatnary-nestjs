import { LlmMessage } from '../llm/llm.types';

export type Citation = {
  index: number;
  snippet: string;
  text: string;
  fileId: string;
  fileUrl: string;
  page: number;
  startOffset: number;
  endOffset: number;
  score?: number;
  projectId?: string;
};

export type ChatResponse = {
  answer: string;
  citations: Citation[];
  chatId: string;
};

export type ChatStreamEvent = {
  data: {
    type: 'TOKEN' | 'CITATIONS' | 'CHAT_ID' | 'ERROR' | 'DONE';
    content?: string | Citation[];
    chatId?: string;
  };
};

export type RagContext = {
  messages: LlmMessage[];
  citations: Citation[];
};
