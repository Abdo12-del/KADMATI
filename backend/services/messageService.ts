import { Message } from '../models/messageModel';

let messages: Message[] = [
  {
    id: 1,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-1-2',
    text: 'مرحباً ليلى، كيف يمكنني مساعدتك في مشروعك؟',
    read: false,
    created_at: new Date('2023-11-20T10:00:00Z'),
  },
  {
    id: 2,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'أهلاً أحمد، أبحث عن مصمم شعار لشركتي الناشئة.',
    read: true,
    created_at: new Date('2023-11-20T10:05:00Z'),
  },
  {
    id: 3,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-1-2',
    text: 'بالتأكيد، يمكنني مساعدتك في ذلك. هل لديك أي أفكار مبدئية؟',
    read: false,
    created_at: new Date('2023-11-20T10:10:00Z'),
  },
  {
    id: 4,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'نعم، أريده بسيطاً وعصرياً ويعكس مجال التقنية.',
    read: true,
    created_at: new Date('2023-11-20T10:15:00Z'),
  },
  {
    id: 5,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-1-2',
    text: 'رائع! سأقوم بإعداد بعض المفاهيم الأولية لك.',
    read: false,
    created_at: new Date('2023-11-20T10:20:00Z'),
  },
  {
    id: 6,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'شكراً جزيلاً!',
    read: true,
    created_at: new Date('2023-11-20T10:25:00Z'),
  },
  {
    id: 7,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-1-2',
    text: 'لا شكر على واجب. سأتواصل معك قريباً.',
    read: false,
    created_at: new Date('2023-11-20T10:30:00Z'),
  },
  {
    id: 8,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'بانتظارك.',
    read: true,
    created_at: new Date('2023-11-20T10:35:00Z'),
  },
  {
    id: 9,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'هل انتهيت من المفاهيم الأولية؟',
    read: false,
    created_at: new Date('2023-11-21T11:00:00Z'),
  },
  {
    id: 10,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-1-2',
    text: 'نعم، أرسلتها لك عبر البريد الإلكتروني.',
    read: true,
    created_at: new Date('2023-11-21T11:05:00Z'),
  },
  {
    id: 11,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'رائع، سأقوم بمراجعتها الآن.',
    read: true,
    created_at: new Date('2023-11-21T11:10:00Z'),
  },
  {
    id: 12,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'أعجبني المفهوم الأول كثيراً!',
    read: false,
    created_at: new Date('2023-11-21T11:30:00Z'),
  },
  {
    id: 13,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-1-2',
    text: 'يسعدني ذلك! هل هناك أي تعديلات تودين إجراؤها؟',
    read: false,
    created_at: new Date('2023-11-21T11:35:00Z'),
  },
  {
    id: 14,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'لا، يبدو مثالياً. شكراً لك.',
    read: true,
    created_at: new Date('2023-11-21T11:40:00Z'),
  },
  {
    id: 15,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv-1-2',
    text: 'العفو، سأقوم بإنهاء العمل وإرسال الملفات النهائية.',
    read: false,
    created_at: new Date('2023-11-21T11:45:00Z'),
  },
  {
    id: 16,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv-1-2',
    text: 'ممتاز!',
    read: true,
    created_at: new Date('2023-11-21T11:50:00Z'),
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