import knex from '../db';
import { Service } from '../models/serviceModel';
import { v4 as uuidv4 } from 'uuid';

class ServiceService {
  private tableName = 'services';

  async create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewsCount'>): Promise<Service> {
    const newService = { id: uuidv4(), ...service, rating: 0.0, reviewsCount: 0 };
    await knex(this.tableName).insert(newService);
    return newService;
  }

  async findAll(): Promise<Service[]> {
    return knex(this.tableName).select('*');
  }

  async findById(id: string): Promise<Service | undefined> {
    return knex(this.tableName).where({ id }).first();
  }

  async findByProviderId(providerId: string): Promise<Service[]> {
    return knex(this.tableName).where({ providerId }).select('*');
  }

  async update(id: string, updates: Partial<Service>): Promise<Service | undefined> {
    await knex(this.tableName).where({ id }).update({ ...updates, updatedAt: knex.fn.now() });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await knex(this.tableName).where({ id }).delete();
    return deletedCount > 0;
  }

  async updateRating(serviceId: string, newRating: number): Promise<Service | undefined> {
    const service = await this.findById(serviceId);
    if (!service) return undefined;

    const currentReviewsCount = service.reviewsCount || 0;
    const currentTotalRating = (service.rating || 0) * currentReviewsCount;

    const updatedReviewsCount = currentReviewsCount + 1;
    const updatedTotalRating = currentTotalRating + newRating;
    const calculatedRating = updatedTotalRating / updatedReviewsCount;

    await knex(this.tableName)
      .where({ id: serviceId })
      .update({
        rating: calculatedRating,
        reviewsCount: updatedReviewsCount,
        updatedAt: knex.fn.now(),
      });

    return this.findById(serviceId);
  }
}

export default new ServiceService();