import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, MessageSquare } from 'lucide-react'; // تم إضافة MessageSquare هنا
import ChatModal from '@/components/ChatModal'; // استيراد المكون الجديد

interface Message {
  id: string;
  sender: 'customer' | 'provider';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  avatarUrl: string;
  messages: Message[];
}

const MessageCenterPage = () => {
  // Placeholder for conversations
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv1',
      customerName: 'أحمد محمد',
      lastMessage: 'متى يمكن البدء بالعمل؟',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AM',
      messages: [
        { id: 'msg1', sender: 'customer', text: 'مرحباً، هل أنت متاح لمشروع تصميم شعار جديد؟', time: '10:00 ص' },
        { id: 'msg2', sender: 'provider', text: 'أهلاً بك! نعم، أنا متاح. ما هي تفاصيل المشروع؟', time: '10:05 ص' },
        { id: 'msg3', sender: 'customer', text: 'أحتاج شعارًا لشركة تقنية ناشئة. أريد شيئًا حديثًا وبسيطًا.', time: '10:15 ص' },
        { id: 'msg4', sender: 'provider', text: 'بالتأكيد، يمكننا مناقشة الأفكار. هل لديك أي أمثلة تفضلها؟', time: '10:20 ص' },
      ],
    },
    {
      id: 'conv2',
      customerName: 'سارة علي',
      lastMessage: 'شكراً على الخدمة الممتازة!',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA',
      messages: [
        { id: 'msg5', sender: 'customer', text: 'شكراً جزيلاً على الخدمة الممتازة، أنا راضية تماماً عن النتيجة!', time: '03:00 م' },
        { id: 'msg6', sender: 'provider', text: 'يسعدني جداً سماع ذلك! هدفنا هو رضاكم.', time: '03:05 م' },
      ],
    },
    {
      id: 'conv3',
      customerName: 'خالد فهد',
      lastMessage: 'هل يمكن تعديل موعد التسليم؟',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=KF',
      messages: [
        { id: 'msg7', sender: 'customer', text: 'مرحباً، هل يمكننا تعديل موعد تسليم المشروع إلى الأسبوع القادم؟', time: '09:00 ص' },
        { id: 'msg8', sender: 'provider', text: 'دعني أتحقق من جدول أعمالي وسأرد عليك قريباً.', time: '09:10 ص' },
      ],
    },
  ]);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleOpenChatModal = (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
    setSelectedConversation(null);
  };

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">مركز الرسائل</h1>

      <div className="flex h-[70vh] bg-brand-card-bg rounded-2xl shadow-soft overflow-hidden">
        {/* Sidebar for conversations */}
        <div className="w-full lg:w-1/3 border-l border-border p-6 flex flex-col rtl:border-r rtl:border-l-0">
          <Input placeholder="بحث عن محادثات..." className="mb-6 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          <div className="flex-grow overflow-y-auto space-y-3">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleOpenChatModal(conv)}
                className="flex flex-row-reverse items-center p-4 rounded-xl hover:bg-brand-background cursor-pointer transition-colors shadow-soft bg-brand-card-bg text-right"
              >
                <Avatar className="h-12 w-12 ml-3">
                  <AvatarImage src={conv.avatarUrl} alt={conv.customerName} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{conv.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-cairo text-brand-text-dark font-semibold">{conv.customerName}</p>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{conv.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area - now replaced by ChatModal */}
        <div className="hidden lg:flex w-2/3 flex-col items-center justify-center text-brand-text-muted font-ibm-plex-arabic">
          <MessageSquare className="h-16 w-16 mb-4 text-brand-primary-light" />
          <p className="text-lg">اختر محادثة من القائمة للبدء.</p>
        </div>
      </div>

      <ChatModal
        isOpen={isChatModalOpen}
        onClose={handleCloseChatModal}
        conversation={selectedConversation}
      />
    </DashboardLayout>
  );
};

export default MessageCenterPage;