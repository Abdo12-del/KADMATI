import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

const MessageCenterPage = () => {
  // Placeholder for conversations and messages
  const conversations = [
    { id: 'conv1', customerName: 'أحمد محمد', lastMessage: 'متى يمكن البدء بالعمل؟', avatarUrl: 'https://github.com/shadcn.png' },
    { id: 'conv2', customerName: 'سارة علي', lastMessage: 'شكراً على الخدمة الممتازة!', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA' },
  ];

  const currentConversation = {
    id: 'conv1',
    customerName: 'أحمد محمد',
    avatarUrl: 'https://github.com/shadcn.png',
    messages: [
      { id: 'msg1', sender: 'customer', text: 'مرحباً، هل أنت متاح لمشروع تصميم شعار جديد؟', time: '10:00 AM' },
      { id: 'msg2', sender: 'provider', text: 'أهلاً بك! نعم، أنا متاح. ما هي تفاصيل المشروع؟', time: '10:05 AM' },
      { id: 'msg3', sender: 'customer', text: 'أحتاج شعارًا لشركة تقنية ناشئة. أريد شيئًا حديثًا وبسيطًا.', time: '10:15 AM' },
    ],
  };

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">مركز الرسائل</h1>

      <div className="flex h-[70vh] bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Sidebar for conversations */}
        <div className="w-1/3 border-r p-4 flex flex-col">
          <Input placeholder="بحث عن محادثات..." className="mb-4" />
          <div className="flex-grow overflow-y-auto space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={conv.avatarUrl} alt={conv.customerName} />
                  <AvatarFallback>{conv.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold font-montserrat">{conv.customerName}</p>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          <CardHeader className="border-b p-4 flex flex-row items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={currentConversation.avatarUrl} alt={currentConversation.customerName} />
              <AvatarFallback>{currentConversation.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-montserrat">{currentConversation.customerName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
            {currentConversation.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender === 'provider'
                      ? 'bg-sky-blue-light text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="font-open-sans">{msg.text}</p>
                  <span className={`text-xs mt-1 block ${msg.sender === 'provider' ? 'text-white/80' : 'text-gray-500'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="border-t p-4 flex items-center space-x-2">
            <Textarea placeholder="اكتب رسالتك..." className="flex-grow resize-none" rows={1} />
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white p-2">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessageCenterPage;