import { Message } from '../models/messageModel';

const getRecentDate = (daysAgo: number = 0, monthsAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
};

let messages: Message[] = [
  {
    id: 1,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-2-1',
    text: 'مرحباً أحمد، هل يمكنك البدء في تصميم الشعار قريباً؟',
    read: false,
    created_at: getRecentDate(3),
  },
  {
    id: 2,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-2-1',
    text: 'أهلاً ليلى، نعم سأبدأ العمل عليه اليوم. سأرسل لك المسودة الأولى غداً.',
    read: true,
    created_at: getRecentDate(2),
  },
  {
    id: 3,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-2-1',
    text: 'رائع، شكراً لك!',
    read: false,
    created_at: getRecentDate(1),
  },
  {
    id: 4,
    sender_id: 3, // Khalid Client
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-3-1',
    text: 'مرحباً، هل تقدمون خدمات صيانة التكييف؟',
    read: false,
    created_at: getRecentDate(7),
  },
  {
    id: 5,
    sender_id: 1, // Ahmed Provider
    receiver_id: 3, // Khalid Client
    conversation_id: 'conv-3-1',
    text: 'أهلاً بك خالد، نعم نقدم خدمات صيانة التكييف. ما هي المشكلة التي تواجهها؟',
    read: true,
    created_at: getRecentDate(6),
  },
];

let nextMessageId = messages.length > 0 ? Math.max(...messages.map(m => m.id || 0)) + 1 : 1;

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