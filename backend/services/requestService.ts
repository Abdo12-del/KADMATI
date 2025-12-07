import knex from '../db';
import { Request } from '../models/requestModel';
import { v4 as uuidv4 } from 'uuid';

class RequestService {
  private tableName = 'requests';

  async create(request: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Request> {
    const newRequest = { id: uuidv4(), ...request, status: 'Pending' };
    await knex(this.tableName).insert(newRequest);
    return newRequest;
  }

  async findAll(): Promise<Request[]> {
    return knex(this.tableName).select('*');
  }

  async findById(id: string): Promise<Request | undefined> {
    return knex(this.tableName).where({ id }).first();
  }

  async findByClientId(clientId: string): Promise<Request[]> {
    return knex(this.tableName).where({ clientId }).select('*');
  }

  async update(id: string, updates: Partial<Request>): Promise<Request | undefined> {
    await knex(this.tableName).where({ id }).update({ ...updates, updatedAt: knex.fn.now() });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    return deletedCount > 0;
  }
}

export default new RequestService();