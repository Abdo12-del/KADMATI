export interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  phone?: string;
  bio?: string;
  avatar_url?: string;
  favorite_service_ids?: number[];
}

export interface ServiceData {
  id: number;
  provider_id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  delivery_time?: number;
  image_url?: string;
  rating?: number;
  reviews_count?: number;
  location?: string;
  service_level?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RatingData {
  id: number;
  service_id: number;
  client_id: number;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface ProviderCardPropsData {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  serviceCount: number;
}

export interface ClientServiceCardPropsData {
  id: string;
  title: string;
  description: string;
  price: number;
  providerName: string;
  rating: number;
  location: string;
  imageUrl?: string;
}

export interface ReviewCardPropsData {
  id: string;
  customerName: string;
  serviceTitle: string;
  rating: number;
  comment?: string;
  date: string;
  avatarUrl?: string;
}

export interface TransactionData {
  id: string;
  service: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  method: string;
}