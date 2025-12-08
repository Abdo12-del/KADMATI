export interface Request {
  id?: number;
  client_id: number;
  title: string;
  description: string;
  category?: string;
  location?: string;
  due_date?: string;
  additional_options?: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}