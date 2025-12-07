export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  read?: boolean;
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}