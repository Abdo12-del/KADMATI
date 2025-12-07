export interface Order {
  id: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  price: number;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  details?: string;
  createdAt?: Date;
  updatedAt?: Date;
}