export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string; // Password might not be returned on read operations
  role: 'seeker' | 'provider';
  phone?: string;
  bio?: string;
  avatar_url?: string;
  provider_type?: string; // Added for providers
  id_number?: string; // Added for providers
  address?: string; // Added for providers
  favorite_service_ids?: number[]; // Added for seekers to store favorite service IDs
  created_at?: Date;
  updated_at?: Date;
}