import knex from '../db';
import { Message } from '../models/messageModel';
import { v4 as uuidv4 } from 'uuid';

class MessageService {
  private tableName = 'messages';

  async create(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'timestamp' | 'read'>): Promise<Message> {
    const newMessage = { id: uuidv4(), ...message, read: false };
    await knex(this.tableName).insert(newMessage);
    return newMessage;
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    return knex(this.tableName).where({ conversationId }).orderBy('timestamp', 'asc').select('*');
  }

  async markAsRead(messageId: string): Promise<boolean> {
    const updatedCount = await knex(this.tableName).where({ id: messageId }).update({ read: true, updatedAt: knex.fn.now() });
    return updatedCount > 0;
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<number> {
    // Mark messages as read that were sent by the other participant
    const updatedCount = await knex(this.tableName)
      .where({ conversationId, read: false })
      .whereNot({ senderId: userId })
      .update({ read: true, updatedAt: knex.fn.now() });
    return updatedCount;
  }

  async getUnreadCountForUser(userId: string): Promise<number> {
    const unreadMessages = await knex('messages')
      .join('conversations', 'messages.conversationId', 'conversations.id')
      .where('messages.read', false)
      .andWhere('messages.senderId', '!=', userId) // Messages sent by others
      .andWhere(function() {
        this.where('conversations.participant1Id', userId)
            .orWhere('conversations.participant2Id', userId);
      })
      .count('messages.id as unreadCount')
      .first();

    return parseInt(unreadMessages?.unreadCount as string || '0', 10);
  }

  async getUnreadCountForConversation(conversationId: string, userId: string): Promise<number> {
    const unreadMessages = await knex(this.tableName)
      .where({ conversationId, read: false })
      .whereNot({ senderId: userId })
      .count('id as unreadCount')
      .first();
    return parseInt(unreadMessages?.unreadCount as string || '0', 10);
  }
}

export default new MessageService();