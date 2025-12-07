export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  createdAt?: Date;
  updatedAt?: Date;
}