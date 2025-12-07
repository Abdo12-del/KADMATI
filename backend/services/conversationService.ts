import knex from '../db';
import { Conversation } from '../models/conversationModel';
import { v4 as uuidv4 } from 'uuid';

class ConversationService {
  private tableName = 'conversations';

  async create(participant1Id: string, participant2Id: string): Promise<Conversation> {
    const newConversation = { id: uuidv4(), participant1Id, participant2Id };
    await knex(this.tableName).insert(newConversation);
    return newConversation;
  }

  async findById(id: string): Promise<Conversation | undefined> {
    return knex(this.tableName).where({ id }).first();
  }

  async findByParticipants(participant1Id: string, participant2Id: string): Promise<Conversation | undefined> {
    return knex(this.tableName)
      .where(function() {
        this.where({ participant1Id, participant2Id });
      })
      .orWhere(function() {
        this.where({ participant1Id: participant2Id, participant2Id: participant1Id });
      })
      .first();
  }

  async findUserConversations(userId: string): Promise<Conversation[]> {
    return knex(this.tableName)
      .where('participant1Id', userId)
      .orWhere('participant2Id', userId)
      .select('*');
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    return deletedCount > 0;
  }
}

export default new ConversationService();