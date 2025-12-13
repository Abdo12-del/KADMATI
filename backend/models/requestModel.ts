export interface Request {
  id?: number;
  client_id: number;
  title: string;
  description: string;
  category?: string;
  location?: string;
  due_date?: string;
  additional_options?: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'payment_pending'; // Added 'payment_pending' status
  payment_status?: 'unpaid' | 'pending_review' | 'paid' | 'rejected'; // New field for payment status
  payment_reference?: string; // New field for payment reference
  receipt_url?: string; // New field for receipt URL
  assigned_provider_id?: number; // New field: ID of the provider who accepted this request
  agreed_price?: number; // New field: The price agreed upon for this request
  created_at?: Date;
  updated_at?: Date;
}