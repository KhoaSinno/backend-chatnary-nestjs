import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { OpenaiService } from '../llm/openai/openai.service';
import { ChatLiteDto } from './dto/chat-lite.dto';
import { BaseMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';

@Injectable()
export class ChatService {
  constructor(private readonly openaiService: OpenaiService) {}
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

  async chatLite(chatLiteDto: ChatLiteDto): Promise<BaseMessage> {
    console.log(
      'This action processes a lite chat + ' + JSON.stringify(chatLiteDto),
    );

    const response = await this.openaiService.model.invoke(chatLiteDto.message);

    return response;

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
