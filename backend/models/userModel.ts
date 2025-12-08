export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string; // Password might not be returned on read operations
  role: 'seeker' | 'provider';
  phone?: string;
  bio?: string;
  avatar_url?: string;
  created_at?: Date;
  updated_at?: Date;
}