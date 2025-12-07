import knex from '../db';
import { User } from '../models/userModel';
import { v4 as uuidv4 } from 'uuid';

class UserService {
  private tableName = 'users';

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser = { id: uuidv4(), ...user };
    await knex(this.tableName).insert(newUser);
    return newUser;
  }

  async findAll(): Promise<User[]> {
    return knex(this.tableName).select('*');
  }

  async findById(id: string): Promise<User | undefined> {
    return knex(this.tableName).where({ id }).first();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return knex(this.tableName).where({ email }).first();
  }

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    await knex(this.tableName).where({ id }).update({ ...updates, updatedAt: knex.fn.now() });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    return deletedCount > 0;
  }
}

export default new UserService();