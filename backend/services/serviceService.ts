import { db } from '../server';
import { Service } from '../models/serviceModel';

export const serviceService = {
  async getAllServices(): Promise<Service[]> {
    return db('services').select('*');
  },

  async getServiceById(id: number): Promise<Service | undefined> {
    return db('services').where({ id }).first();
  },

  async createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'rating' | 'reviews_count'>): Promise<Service> {
    const [id] = await db('services').insert(service).returning('id');
    // Fetch the newly created service to include default values like rating and reviews_count
    return this.getServiceById(id) as Promise<Service>;
  },

  async updateService(id: number, updates: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>): Promise<Service | undefined> {
    await db('services').where({ id }).update({ ...updates, updated_at: db.fn.now() });
    return this.getServiceById(id);
  },

  async deleteService(id: number): Promise<boolean> {
    const deletedCount = await db('services').where({ id }).del();
    return deletedCount > 0;
  },
};