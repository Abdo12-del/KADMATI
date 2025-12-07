export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for retrieval, but required for creation
  role: 'seeker' | 'provider';
  phone?: string;
  providerType?: string;
  idNumber?: string;
  address?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}