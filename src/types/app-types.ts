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

export interface RequestData {
  id: number;
  client_id: number;
  title: string;
  description: string;
  category?: string;
  location?: string;
  due_date?: string;
  additional_options?: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'payment_pending'; // Added 'payment_pending'
  payment_status?: 'unpaid' | 'pending_review' | 'paid' | 'rejected'; // New field
  payment_reference?: string; // New field
  receipt_url?: string; // New field
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
  serviceTitle: string;
  providerName: string;
  providerAvatarUrl?: string; // Added this field
  rating: number;
  comment?: string;
  date: string;
}

export interface TransactionData {
  id: string; // This will be the request ID
  serviceTitle: string; // Title of the service requested
  amount: number; // Price of the service
  date: string; // Date of the request
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled' | 'Payment Pending'; // Request status
  paymentStatus: 'Unpaid' | 'Pending Review' | 'Paid' | 'Rejected'; // Payment status
  method?: string; // Payment method (if recorded)
  paymentReference?: string; // Payment reference
  receiptUrl?: string; // Receipt URL
}

export interface RequestCardPropsData {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled' | 'Payment Pending'; // Updated status
  paymentStatus?: 'Unpaid' | 'Pending Review' | 'Paid' | 'Rejected'; // New field
  onDelete?: (id: string) => void;
  onConfirmPayment?: (id: string, paymentReference: string, receiptUrl: string) => Promise<void>; // New prop
}