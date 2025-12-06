import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
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
      { id: 'msg1', sender: 'client', text: 'مرحباً، متى يمكنكم البدء بخدمة التنظيف؟', time: '10:00 AM' },
      { id: 'msg2', sender: 'provider', text: 'أهلاً بك! يمكننا البدء غداً الساعة 9 صباحاً.', time: '10:05 AM' },
      { id: 'msg3', sender: 'client', text: 'ممتاز، هذا يناسبني. شكراً لكم.', time: '10:15 AM' },
    ],
  };

  return (
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">الرسائل</h1>

      <div className="flex h-[70vh] bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Sidebar for conversations */}
        <div className="w-1/3 border-r p-4 flex flex-col">
          <Input placeholder="بحث عن محادثات..." className="mb-4 rounded-lg" />
          <Tabs defaultValue="inbox" className="flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-light-gray rounded-lg">
              <TabsTrigger value="inbox" className="data-[state=active]:bg-light-blue data-[state=active]:text-white rounded-lg">الكل</TabsTrigger>
              <TabsTrigger value="unread" className="data-[state=active]:bg-light-blue data-[state=active]:text-white rounded-lg">غير مقروءة</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="flex-grow overflow-y-auto space-y-2">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className="flex items-center p-3 rounded-lg hover:bg-light-gray cursor-pointer transition-colors"
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={conv.avatarUrl} alt={conv.participantName} />
                    <AvatarFallback>{conv.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold font-montserrat text-dark-blue">{conv.participantName}</p>
                    <p className="text-sm text-gray-700 truncate font-open-sans">{conv.lastMessage}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="unread" className="flex-grow overflow-y-auto space-y-2">
              {/* Placeholder for unread conversations */}
              <p className="text-gray-700 text-sm p-3 font-open-sans">لا توجد رسائل غير مقروءة.</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          <CardHeader className="border-b p-4 flex flex-row items-center bg-light-gray rounded-t-xl">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={currentConversation.avatarUrl} alt={currentConversation.participantName} />
              <AvatarFallback>{currentConversation.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-montserrat text-dark-blue">{currentConversation.participantName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
            {currentConversation.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-xl ${
                    msg.sender === 'client'
                      ? 'bg-light-blue text-white'
                      : 'bg-light-gray text-dark-blue'
                  }`}
                >
                  <p className="font-open-sans">{msg.text}</p>
                  <span className={`text-xs mt-1 block ${msg.sender === 'client' ? 'text-white/80' : 'text-gray-600'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="border-t p-4 flex items-center space-x-2 bg-light-gray rounded-b-xl">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-dark-blue rounded-lg">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea placeholder="اكتب رسالتك..." className="flex-grow resize-none rounded-lg" rows={1} />
            <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white p-2 rounded-lg">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientMessagesPage;