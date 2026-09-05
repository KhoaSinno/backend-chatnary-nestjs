import { ChatService } from './chat.service';
import { RagContext } from './chat.types';
import { lastValueFrom, toArray } from 'rxjs';

describe('ChatService', () => {
  const chatDto = {
    message: 'What does the document say?',
    userId: 'user-1',
    projectId: 'project-1',
  };

  const createService = (rag: RagContext | null) => {
    const llm = {
      answer: jest.fn().mockResolvedValue('Grounded answer'),
      streamAnswer: jest.fn(),
    };
    const prisma = { chat: {} };
    const conversations = {
      resolveChat: jest.fn().mockResolvedValue('chat-1'),
      recentHistory: jest.fn().mockResolvedValue([]),
      saveExchange: jest.fn().mockResolvedValue(undefined),
    };
    const ragContext = { build: jest.fn().mockResolvedValue(rag) };

    return {
      service: new ChatService(
        llm as unknown as ConstructorParameters<typeof ChatService>[0],
        prisma as unknown as ConstructorParameters<typeof ChatService>[1],
        conversations as unknown as ConstructorParameters<
          typeof ChatService
        >[2],
        ragContext as unknown as ConstructorParameters<typeof ChatService>[3],
      ),
      llm,
      conversations,
      ragContext,
    };
  };

  it('uses one orchestration path for a non-streaming chat response', async () => {
    const citations = [
      {
        index: 0,
        snippet: 'snippet',
        text: 'text',
        fileId: 'file-1',
        fileUrl: '',
        page: 1,
        startOffset: 0,
        endOffset: 0,
      },
    ];
    const { service, llm, conversations, ragContext } = createService({
      messages: [{ role: 'user', content: chatDto.message }],
      citations,
    });

    await expect(service.chatHistory(chatDto)).resolves.toEqual({
      answer: 'Grounded answer',
      chatId: 'chat-1',
      citations,
    });

    expect(conversations.resolveChat).toHaveBeenCalledWith({
      chatId: undefined,
      firstMessage: chatDto.message,
      projectId: chatDto.projectId,
      userId: chatDto.userId,
    });
    expect(ragContext.build).toHaveBeenCalledWith({
      history: [],
      projectId: chatDto.projectId,
      question: chatDto.message,
      userId: chatDto.userId,
    });
    expect(llm.answer).toHaveBeenCalledTimes(1);
    expect(conversations.saveExchange).toHaveBeenCalledWith({
      assistantMessage: 'Grounded answer',
      chatId: 'chat-1',
      citations,
      userMessage: chatDto.message,
    });
  });

  it('persists a grounded fallback when retrieval returns no documents', async () => {
    const { service, llm, conversations } = createService(null);

    const response = await service.chatGlobal(chatDto);

    expect(response.citations).toEqual([]);
    expect(response.chatId).toBe('chat-1');
    expect(response.answer).toContain('không tìm thấy thông tin');
    expect(llm.answer).not.toHaveBeenCalled();
    expect(conversations.saveExchange).toHaveBeenCalledWith(
      expect.objectContaining({ citations: [], chatId: 'chat-1' }),
    );
  });

  it('streams model tokens and persists the completed response once', async () => {
    const { service, llm, conversations } = createService({
      messages: [{ role: 'user', content: chatDto.message }],
      citations: [],
    });
    llm.streamAnswer.mockImplementation(async function* () {
      await Promise.resolve();
      yield 'Grounded ';
      yield 'answer';
    });

    await expect(
      lastValueFrom(service.chatStream(chatDto).pipe(toArray())),
    ).resolves.toEqual([
      { data: { type: 'CITATIONS', content: [], chatId: 'chat-1' } },
      { data: { type: 'TOKEN', content: 'Grounded ' } },
      { data: { type: 'TOKEN', content: 'answer' } },
      { data: { type: 'DONE' } },
    ]);

    expect(conversations.saveExchange).toHaveBeenCalledWith({
      assistantMessage: 'Grounded answer',
      chatId: 'chat-1',
      citations: [],
      userMessage: chatDto.message,
    });
  });
});
