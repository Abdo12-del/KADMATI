import knex from '../db';
import { Order } from '../models/orderModel';
import { v4 as uuidv4 } from 'uuid';

class OrderService {
  private tableName = 'orders';

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Order> {
    const newOrder = { id: uuidv4(), ...order, status: 'Pending' };
    await knex(this.tableName).insert(newOrder);
    return newOrder;
  }

  async findAll(): Promise<Order[]> {
    return knex(this.tableName).select('*');
  }

  async findById(id: string): Promise<Order | undefined> {
    return knex(this.tableName).where({ id }).first();
  }

  async findByClientId(clientId: string): Promise<Order[]> {
    return knex(this.tableName).where({ clientId }).select('*');
  }

  async findByProviderId(providerId: string): Promise<Order[]> {
    return knex(this.tableName).where({ providerId }).select('*');
  }

  async update(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    await knex(this.tableName).where({ id }).update({ ...updates, updatedAt: knex.fn.now() });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    return deletedCount > 0;
  }
}

export default new OrderService();