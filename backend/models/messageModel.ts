export interface Message {
  id?: number;
  sender_id: number;
  receiver_id: number;
  conversation_id: string; // Unique ID for conversation pair
  text: string;
  read?: boolean;
  created_at?: Date;
}