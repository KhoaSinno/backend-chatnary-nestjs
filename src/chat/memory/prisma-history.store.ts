import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import {
    BaseMessage,
    HumanMessage,
    AIMessage,
    SystemMessage,
} from '@langchain/core/messages';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * PrismaChatMessageHistory - Adapter for LangChain Memory
 * Automatically saves and loads chat history from ChatMessage table
 */
export class PrismaChatMessageHistory extends BaseListChatMessageHistory {
    lc_namespace = ['chat', 'memory'];

    constructor(
        private readonly chatId: string,
        private readonly prisma: PrismaService,
    ) {
        super();
    }

    /**
     * Load messages from DB and convert to LangChain format
     */
    async getMessages(): Promise<BaseMessage[]> {
        const messages = await this.prisma.chatMessage.findMany({
            where: { chatId: this.chatId },
            orderBy: { createdAt: 'asc' },
            take: 20, // Limit to last 20 messages to avoid context overflow
        });

        return messages.map((msg) => {
            if (msg.role === 'user') return new HumanMessage(msg.content);
            if (msg.role === 'assistant') return new AIMessage(msg.content);
            return new SystemMessage(msg.content);
        });
    }

    /**
     * Save a new message to DB
     */
    async addMessage(message: BaseMessage): Promise<void> {
        let role = 'user';
        if (message instanceof AIMessage) role = 'assistant';
        if (message instanceof SystemMessage) role = 'system';

        await this.prisma.chatMessage.create({
            data: {
                chatId: this.chatId,
                role,
                content: message.content as string,
                metadata: message.response_metadata || null,
            },
        });
    }

    /**
     * Clear all messages for this chat
     */
    async clear(): Promise<void> {
        await this.prisma.chatMessage.deleteMany({
            where: { chatId: this.chatId },
        });
    }
}
