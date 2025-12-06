import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip } from 'lucide-react';

const MessageCenterPage = () => {
  // Placeholder for conversations and messages
  const conversations = [
    { id: 'conv1', customerName: 'أحمد محمد', lastMessage: 'متى يمكن البدء بالعمل؟', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AM' },
    { id: 'conv2', customerName: 'سارة علي', lastMessage: 'شكراً على الخدمة الممتازة!', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA' },
    { id: 'conv3', customerName: 'خالد فهد', lastMessage: 'هل يمكن تعديل موعد التسليم؟', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=KF' },
  ];

  const currentConversation = {
    id: 'conv1',
    customerName: 'أحمد محمد',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AM',
    messages: [
      { id: 'msg1', sender: 'customer', text: 'مرحباً، هل أنت متاح لمشروع تصميم شعار جديد؟', time: '10:00 ص' },
      { id: 'msg2', sender: 'provider', text: 'أهلاً بك! نعم، أنا متاح. ما هي تفاصيل المشروع؟', time: '10:05 ص' },
      { id: 'msg3', sender: 'customer', text: 'أحتاج شعارًا لشركة تقنية ناشئة. أريد شيئًا حديثًا وبسيطًا.', time: '10:15 ص' },
      { id: 'msg4', sender: 'provider', text: 'بالتأكيد، يمكننا مناقشة الأفكار. هل لديك أي أمثلة تفضلها؟', time: '10:20 ص' },
    ],
  };

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">مركز الرسائل</h1>

      <div className="flex h-[70vh] bg-brand-card-bg rounded-2xl shadow-soft overflow-hidden">
        {/* Sidebar for conversations */}
        <div className="w-1/3 border-l border-border p-6 flex flex-col rtl:border-r rtl:border-l-0">
          <Input placeholder="بحث عن محادثات..." className="mb-6 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          <div className="flex-grow overflow-y-auto space-y-3">
            {conversations.map(conv => (
              <div
                key={conv.id}
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

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          <CardHeader className="border-b border-border p-6 flex flex-row-reverse items-center bg-brand-background rounded-tr-2xl">
            <Avatar className="h-12 w-12 ml-3">
              <AvatarImage src={currentConversation.avatarUrl} alt={currentConversation.customerName} />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{currentConversation.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-cairo text-brand-text-dark text-xl">{currentConversation.customerName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
            {currentConversation.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'provider' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-xl shadow-soft ${
                    msg.sender === 'provider'
                      ? 'bg-brand-primary text-white rounded-br-none'
                      : 'bg-brand-background text-brand-text-dark rounded-bl-none'
                  }`}
                >
                  <p className="font-ibm-plex-arabic">{msg.text}</p>
                  <span className={`text-xs mt-1 block font-ibm-plex-arabic ${msg.sender === 'provider' ? 'text-white/80' : 'text-brand-text-muted'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="border-t border-border p-6 flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse bg-brand-background rounded-br-2xl">
            <Button variant="ghost" size="icon" className="text-brand-text-muted hover:text-brand-primary rounded-full shadow-soft bg-brand-card-bg">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea placeholder="اكتب رسالتك..." className="flex-grow resize-none rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" rows={1} />
            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white p-3 rounded-xl shadow-soft">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessageCenterPage;