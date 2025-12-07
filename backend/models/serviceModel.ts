export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}