import { Message } from '../models/messageModel';

let messages: Message[] = []; // تم إفراغ قائمة الرسائل بالكامل

let nextMessageId = 1; // إعادة تعيين معرف الرسالة التالي إلى 1

export const messageService = {
  async getAllMessages(): Promise<Message[]> {
    return messages;
  },

  async getMessageById(id: number): Promise<Message | undefined> {
    return messages.find(m => m.id === id);
  },

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return messages.filter(m => m.conversation_id === conversationId).sort((a, b) => (a.created_at?.getTime() || 0) - (b.created_at?.getTime() || 0));
  },

  async createMessage(message: Omit<Message, 'id' | 'created_at' | 'read'>): Promise<Message> {
    const newMessage: Message = {
      id: nextMessageId++,
      ...message,
      read: false, // Default to unread
      created_at: new Date(),
    };
    messages.push(newMessage);
    return newMessage;
  },

  async updateMessage(id: number, updates: Partial<Omit<Message, 'id' | 'created_at'>>): Promise<Message | undefined> {
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      const updatedMessage = {
        ...messages[index],
        ...updates,
      };
      messages[index] = updatedMessage;
      return updatedMessage;
    }
    return undefined;
  },

  async deleteMessage(id: number): Promise<boolean> {
    const initialLength = messages.length;
    messages = messages.filter(m => m.id !== id);
    return messages.length < initialLength;
  },
};