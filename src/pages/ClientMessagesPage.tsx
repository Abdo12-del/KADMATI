import React from 'react';
// تم إزالة استيراد ClientDashboardLayout
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClientMessagesPage = () => {
  // Placeholder for conversations and messages
  const conversations = [
    { id: 'conv1', participantName: 'شركة النظافة السريعة', lastMessage: 'تم تأكيد موعد التنظيف.', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS' },
    { id: 'conv2', participantName: 'مهندس الديكور أحمد', lastMessage: 'هل لديك أي تعديلات على التصميم؟', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MA' },
    { id: 'conv3', participantName: 'فني الصيانة ماهر', lastMessage: 'تم الانتهاء من صيانة المكيفات.', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FM' },
  ];

  const currentConversation = {
    id: 'conv1',
    participantName: 'شركة النظافة السريعة',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS',
    messages: [
      { id: 'msg1', sender: 'client', text: 'مرحباً، متى يمكنكم البدء بخدمة التنظيف؟', time: '10:00 ص' },
      { id: 'msg2', sender: 'provider', text: 'أهلاً بك! يمكننا البدء غداً الساعة 9 صباحاً.', time: '10:05 ص' },
      { id: 'msg3', sender: 'client', text: 'ممتاز، هذا يناسبني. شكراً لكم.', time: '10:15 ص' },
    ],
  };

  return (
    <div> {/* تم إزالة ClientDashboardLayout */}
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">الرسائل</h1>

      <div className="flex h-[70vh] bg-brand-card-bg rounded-2xl shadow-soft overflow-hidden">
        {/* Sidebar for conversations */}
        <div className="w-1/3 border-l border-border p-6 flex flex-col rtl:border-r rtl:border-l-0">
          <Input placeholder="بحث عن محادثات..." className="mb-6 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          <Tabs defaultValue="inbox" className="flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-brand-background rounded-xl shadow-soft p-2">
              <TabsTrigger value="inbox" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الكل</TabsTrigger>
              <TabsTrigger value="unread" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">غير مقروءة</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="flex-grow overflow-y-auto space-y-3">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className="flex flex-row-reverse items-center p-4 rounded-xl hover:bg-brand-background cursor-pointer transition-colors shadow-soft bg-brand-card-bg text-right"
                >
                  <Avatar className="h-12 w-12 ml-3">
                    <AvatarImage src={conv.avatarUrl} alt={conv.participantName} />
                    <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{conv.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-cairo text-brand-text-dark font-semibold">{conv.participantName}</p>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{conv.lastMessage}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="unread" className="flex-grow overflow-y-auto space-y-3">
              {/* Placeholder for unread conversations */}
              <p className="text-brand-text-muted text-sm p-4 font-ibm-plex-arabic text-right">لا توجد رسائل غير مقروءة.</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          <CardHeader className="border-b border-border p-6 flex flex-row-reverse items-center bg-brand-background rounded-tr-2xl">
            <Avatar className="h-12 w-12 ml-3">
              <AvatarImage src={currentConversation.avatarUrl} alt={currentConversation.participantName} />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{currentConversation.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-cairo text-brand-text-dark text-xl">{currentConversation.participantName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
            {currentConversation.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-xl shadow-soft ${
                    msg.sender === 'client'
                      ? 'bg-brand-primary text-white rounded-br-none'
                      : 'bg-brand-background text-brand-text-dark rounded-bl-none'
                  }`}
                >
                  <p className="font-ibm-plex-arabic">{msg.text}</p>
                  <span className={`text-xs mt-1 block font-ibm-plex-arabic ${msg.sender === 'client' ? 'text-white/80' : 'text-brand-text-muted'}`}>
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
    </div>
  );
};

export default ClientMessagesPage;