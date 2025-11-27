import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OpenaiService } from '../llm/openai/openai.service';
import { ChatLiteDto } from './dto/chat-lite.dto';
import { BaseMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { VectorService } from '../ingest/vector/vector.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly vectorService: VectorService,
  ) {}
  // createSimpleRAG = (llm, retriever) => {
  //   return RunnableSequence.from([
  //     {
  //       context: (input) => retriever.getRelevantDocuments(input.question),
  //       question: (input) => input.question,
  //     },
  //     llm,
  //   ]);
  // };

  // createHistoryRAG = (llm, retriever) => {
  //   const questionRewriter = ChatPromptTemplate.fromMessages([
  //     ['system', "Rewrite the user's question using conversational history."],
  //     ['placeholder', 'history'],
  //     ['human', '{question}'],
  //   ]).pipe(llm);

  //   return RunnableSequence.from([
  //     {
  //       history: (input) => input.history,
  //       question: (input) => input.question,
  //     },
  //     { rewritten: questionRewriter },
  //     {
  //       context: (data) => retriever.getRelevantDocuments(data.rewritten),
  //       question: (data) => data.rewritten,
  //     },
  //     llm,
  //   ]);
  // };

  // async chatLite(chatLiteDto: ChatLiteDto): Promise<BaseMessage> {
  async chatLite(chatLiteDto: ChatLiteDto) {
    const relateDocs = await this.vectorService.getRetrievals(
      chatLiteDto.message,
      5,
    );
    console.log('Related Docs: ', relateDocs);

    const SYSTEM_PROMPT = `
      Bạn là một assistant chỉ trả lời dựa trên thông tin trong "Context".
      Nếu không thấy câu trả lời trong Context thì trả lời "Tôi không tìm thấy thông tin trong tài liệu."
      Tuyệt đối không được bịa, không lấy thông tin ngoài tài liệu. `;

    // 3. Format retrieved docs to text context
    const context = relateDocs
      .map((d, i) => `### Document ${i + 1}\n${d.pageContent}`)
      .join('\n\n');

    console.log('Context: ', context);

    const sysPrompt = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `
          Context:

          ${context}

          ---

          Câu hỏi: ${chatLiteDto.message}
      `,
      },
    ];

    // 4. Get response from LLM
    const response = await this.openaiService.model.invoke(sysPrompt);

    return { response, relateDocs };

    //     const r = await this.retriever.get(projectId);
    // const chain = createSimpleRAG(this.openai.llm, r);
    // return chain.invoke({ question });
  }

  create(createChatDto: CreateChatDto) {
    return 'This action adds a new chat';
  }

  findAll() {
    return `This action returns all chat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
