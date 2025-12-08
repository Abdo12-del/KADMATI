import { Message } from '../models/messageModel';

let messages: Message[] = [
  {
    id: 1,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv_2_1',
    text: 'مرحباً أحمد، هل أنت متاح لمشروع تصميم شعار جديد؟',
    read: false,
    created_at: new Date('2023-11-07T10:00:00Z'),
  },
  {
    id: 2,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv_2_1',
    text: 'أهلاً بك ليلى! نعم، أنا متاح. ما هي تفاصيل المشروع؟',
    read: true,
    created_at: new Date('2023-11-07T10:05:00Z'),
  },
  {
    id: 3,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv_2_1',
    text: 'أحتاج شعارًا لشركة تقنية ناشئة. أريد شيئًا حديثًا وبسيطًا.',
    read: false,
    created_at: new Date('2023-11-07T10:15:00Z'),
  },
  {
    id: 4,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv_2_1',
    text: 'تمام، في انتظار ردك.',
    read: false,
    created_at: new Date('2023-11-07T10:15:00Z'),
  },
  {
    id: 5,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv_2_1',
    text: 'هل يمكنك إرسال بعض الأمثلة لأعمالك السابقة؟',
    read: false,
    created_at: new Date('2023-11-07T10:20:00Z'),
  },
  {
    id: 6,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv_2_1',
    text: 'أنا مهتمة بخدمة تصميم الشعار الاحترافي التي تقدمها.',
    read: false,
    created_at: new Date('2023-11-07T10:25:00Z'),
  },
  {
    id: 7,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv_2_1',
    text: 'بالتأكيد، سأرسل لك محفظة أعمالي في أقرب وقت.',
    read: true,
    created_at: new Date('2023-11-07T10:30:00Z'),
  },
  {
    id: 8,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv_2_1',
    text: 'هل لديك أي تفضيلات للألوان أو الأسلوب؟',
    read: true,
    created_at: new Date('2023-11-07T10:35:00Z'),
  },
  {
    id: 9,
    sender_id: 1, // Ahmed Provider
    receiver_id: 2, // Laila Seeker
    conversation_id: 'conv_2_1',
    text: 'يمكننا تحديد موعد لمكالمة لمناقشة التفاصيل بشكل أعمق.',
    read: true,
    created_at: new Date('2023-11-07T10:40:00Z'),
  },
  {
    id: 10,
    sender_id: 2, // Laila Seeker
    receiver_id: 1, // Ahmed Provider
    conversation_id: 'conv_2_1',
    text: 'فكرة جيدة! متى يناسبك؟',
    read: false,
    created_at: new Date('2023-11-07T10:45:00Z'),
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