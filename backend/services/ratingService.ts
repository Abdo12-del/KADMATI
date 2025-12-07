import knex from '../db';
import { Rating } from '../models/ratingModel';
import { v4 as uuidv4 } from 'uuid';
import ServiceService from './serviceService';

class RatingService {
  private tableName = 'ratings';

  async create(rating: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rating> {
    const newRating = { id: uuidv4(), ...rating };
    await knex(this.tableName).insert(newRating);
    
    // Update service's average rating
    await ServiceService.updateRating(rating.serviceId, rating.rating);

    return newRating;
  }

  async findAll(): Promise<Rating[]> {
    return knex(this.tableName).select('*');
  }

  async findById(id: string): Promise<Rating | undefined> {
    return knex(this.tableName).where({ id }).first();
  }

  async findByServiceId(serviceId: string): Promise<Rating[]> {
    return knex(this.tableName).where({ serviceId }).select('*');
  }

  async findByClientId(clientId: string): Promise<Rating[]> {
    return knex(this.tableName).where({ clientId }).select('*');
  }

  async update(id: string, updates: Partial<Rating>): Promise<Rating | undefined> {
    await knex(this.tableName).where({ id }).update({ ...updates, updatedAt: knex.fn.now() });
    // Re-calculate service rating if the rating itself was updated
    // This would require more complex logic to remove old rating and add new one
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    // Re-calculate service rating if a rating is deleted
    return deletedCount > 0;
  }
}

export default new RatingService();