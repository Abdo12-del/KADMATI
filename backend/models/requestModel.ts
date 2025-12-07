export interface Request {
  id: string;
  clientId: string;
  title: string;
  description: string;
  location?: string;
  dueDate?: string;
  additionalOptions?: string;
  status?: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}