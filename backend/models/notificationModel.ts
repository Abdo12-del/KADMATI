export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'message' | 'payment' | 'system' | 'general';
  title: string;
  description: string;
  read: boolean;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}