export interface Rating {
  id: string;
  serviceId: string;
  clientId: string;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}