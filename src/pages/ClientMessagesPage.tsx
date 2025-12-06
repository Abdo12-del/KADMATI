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
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">الرسائل</h1>

      <div className="flex h-[70vh] bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Sidebar for conversations */}
        <div className="w-1/3 border-r p-4 flex flex-col">
          <Input placeholder="بحث عن محادثات..." className="mb-4" />
          <Tabs defaultValue="inbox" className="flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="inbox">الكل</TabsTrigger>
              <TabsTrigger value="unread">غير مقروءة</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="flex-grow overflow-y-auto space-y-2">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={conv.avatarUrl} alt={conv.participantName} />
                    <AvatarFallback>{conv.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold font-montserrat">{conv.participantName}</p>
                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="unread" className="flex-grow overflow-y-auto space-y-2">
              {/* Placeholder for unread conversations */}
              <p className="text-gray-600 text-sm p-3">لا توجد رسائل غير مقروءة.</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          <CardHeader className="border-b p-4 flex flex-row items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={currentConversation.avatarUrl} alt={currentConversation.participantName} />
              <AvatarFallback>{currentConversation.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-montserrat">{currentConversation.participantName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
            {currentConversation.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender === 'client'
                      ? 'bg-sky-blue-light text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="font-open-sans">{msg.text}</p>
                  <span className={`text-xs mt-1 block ${msg.sender === 'client' ? 'text-white/80' : 'text-gray-500'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="border-t p-4 flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea placeholder="اكتب رسالتك..." className="flex-grow resize-none" rows={1} />
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white p-2">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientMessagesPage;