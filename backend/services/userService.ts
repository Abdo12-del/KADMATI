import { db } from '../server';
import { User } from '../models/userModel';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    return db('users').select('*');
  },

  async getUserById(id: number): Promise<User | undefined> {
    return db('users').where({ id }).first();
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db('users').where({ email }).first();
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const [id] = await db('users').insert(user).returning('id');
    return { id, ...user };
  },

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | undefined> {
    await db('users').where({ id }).update({ ...updates, updated_at: db.fn.now() });
    return this.getUserById(id);
  },

  async deleteUser(id: number): Promise<boolean> {
    const deletedCount = await db('users').where({ id }).del();
    return deletedCount > 0;
  },
};