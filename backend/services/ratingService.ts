import { Rating } from '../models/ratingModel';

let ratings: Rating[] = [
  {
    id: 1,
    service_id: 1, // Professional Logo Design
    client_id: 2, // Laila Seeker
    rating: 5,
    comment: 'خدمة ممتازة وشعار رائع، أنصح به بشدة!',
    created_at: new Date('2023-10-20T15:00:00Z'),
  },
  {
    id: 2,
    service_id: 3, // Marketing Content Writing
    client_id: 2, // Laila Seeker
    rating: 4,
    comment: 'محتوى جيد جداً وسرعة في التنفيذ، شكراً.',
    created_at: new Date('2023-11-01T11:00:00Z'),
  },
  {
    id: 3,
    service_id: 1, // Professional Logo Design
    client_id: 2, // Laila Seeker
    rating: 4,
    comment: 'تصميم إبداعي، لكن استغرق وقتاً أطول قليلاً من المتوقع.',
    created_at: new Date('2023-11-15T09:00:00Z'),
  },
  {
    id: 4,
    service_id: 2, // Personal Website Development
    client_id: 2, // Laila Seeker
    rating: 5,
    comment: 'موقع رائع وتصميم احترافي، سعيد جداً بالنتيجة.',
    created_at: new Date('2023-12-01T14:00:00Z'),
  },
  {
    id: 5,
    service_id: 5, // Visual Identity Design
    client_id: 2, // Laila Seeker
    rating: 3,
    comment: 'الهوية البصرية جيدة، لكن كان هناك بعض التأخير في التسليم.',
    created_at: new Date('2023-12-20T10:00:00Z'),
  },
];

let nextRatingId = ratings.length > 0 ? Math.max(...ratings.map(r => r.id || 0)) + 1 : 1;

export const ratingService = {
  async getAllRatings(): Promise<Rating[]> {
    return ratings;
  },

  async getRatingById(id: number): Promise<Rating | undefined> {
    return ratings.find(r => r.id === id);
  },

  async createRating(rating: Omit<Rating, 'id' | 'created_at'>): Promise<Rating> {
    const newRating: Rating = {
      id: nextRatingId++,
      ...rating,
      created_at: new Date(),
    };
    ratings.push(newRating);
    return newRating;
  },

  async updateRating(id: number, updates: Partial<Omit<Rating, 'id' | 'created_at'>>): Promise<Rating | undefined> {
    const index = ratings.findIndex(r => r.id === id);
    if (index !== -1) {
      const updatedRating = {
        ...ratings[index],
        ...updates,
      };
      ratings[index] = updatedRating;
      return updatedRating;
    }
    return undefined;
  },

  async deleteRating(id: number): Promise<boolean> {
    const initialLength = ratings.length;
    ratings = ratings.filter(r => r.id !== id);
    return ratings.length < initialLength;
  },
};