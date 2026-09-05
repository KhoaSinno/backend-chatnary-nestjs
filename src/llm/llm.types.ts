export type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatModelPurpose = 'answer' | 'rewrite';
