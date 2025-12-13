export interface Request {
  id?: number;
  client_id: number;
  service_id?: number; // New field: Optional ID of the service being requested/ordered
  title: string;
  description: string;
  category?: string;
  location?: string;
  due_date?: string;
  additional_options?: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'payment_pending';
  payment_status?: 'unpaid' | 'pending_review' | 'paid' | 'rejected';
  payment_reference?: string;
  receipt_url?: string;
  created_at?: Date;
  updated_at?: Date;
}