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
  created_at?: Date;
  updated_at?: Date;
}