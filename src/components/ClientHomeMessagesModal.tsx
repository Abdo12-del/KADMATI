"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search, Paperclip, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  sender: 'client' | 'provider'; // 'client' for current user, 'provider' for other party
  content: string;
  time: string;
}

interface Conversation {
  id: string;
  participantName: string;
  participantAvatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

const dummyConversations: Conversation[] = [
  {
    id: 'conv1',
    participantName: 'شركة النظافة السريعة',
    participantAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS',
    lastMessage: 'تم تأكيد موعد التنظيف لمنزلك.',
    lastMessageTime: 'منذ 5 دقائق',
    unreadCount: 1,
    messages: [
      { id: 'msg1', sender: 'provider', content: 'مرحباً، تم تأكيد طلب تنظيف منزلك ليوم غد الساعة 10 صباحاً.', time: '10:00 ص' },
      { id: 'msg2', sender: 'client', content: 'شكراً جزيلاً! هل يمكنني إضافة خدمة غسيل السجاد؟', time: '10:05 ص' },
      { id: 'msg3', sender: 'provider', content: 'بالتأكيد، يمكننا ترتيب ذلك. سأقوم بتحديث الفاتورة.', time: '10:10 ص' },
      { id: 'msg4', sender: 'provider', content: 'تم تأكيد موعد التنظيف لمنزلك.', time: '10:15 ص' },
    ],
  },
  {
    id: 'conv2',
    participantName: 'مهندس الديكور أحمد',
    participantAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MA',
    lastMessage: 'هل لديك أي تعديلات على التصميم المقترح؟',
    lastMessageTime: 'منذ ساعة',
    unreadCount: 0,
    messages: [
      { id: 'msg5', sender: 'client', content: 'مرحباً مهندس أحمد، التصميم يبدو رائعاً!', time: '09:30 ص' },
      { id: 'msg6', sender: 'provider', content: 'شكراً لك! هل لديك أي تعديلات على التصميم المقترح؟', time: '09:45 ص' },
    ],
  },
  {
    id: 'conv3',
    participantName: 'فني الصيانة ماهر',
    participantAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FM',
    lastMessage: 'تم الانتهاء من صيانة المكيفات.',
    lastMessageTime: 'أمس',
    unreadCount: 0,
    messages: [
      { id: 'msg7', sender: 'provider', content: 'مرحباً، تم الانتهاء من صيانة المكيفات بنجاح.', time: '03:00 م' },
      { id: 'msg8', sender: 'client', content: 'عمل ممتاز، شكراً لك!', time: '03:15 م' },
    ],
  },
];

export const ClientHomeMessagesModal = () => {
  const [open, setOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(dummyConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = dummyConversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Simple sorting by unread count, then by last message time (dummy)
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    // For real app, use actual timestamps
    return 0;
  });

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      const newMessage: Message = {
        id: `msg${selectedConversation.messages.length + 1}`,
        sender: 'client',
        content: messageInput,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      // In a real app, you'd send this to an API and update state from response
      setSelectedConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, newMessage],
        lastMessage: messageInput,
        lastMessageTime: 'الآن',
      }));
      setMessageInput('');
    }
  };

  const totalUnreadCount = dummyConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <MessageSquare className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-brand-danger flex items-center justify-center text-xs text-white font-ibm-plex-arabic">
              {totalUnreadCount}
            </span>
          )}
          <span className="sr-only">الرسائل</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-border">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-right">مركز الرسائل</DialogTitle>
          {/* Close button is automatically handled by Dialog */}
        </DialogHeader>

        <div className="flex flex-grow overflow-hidden">
          {/* Conversation List Sidebar */}
          <div className="w-1/3 flex flex-col border-l border-border flex-shrink-0 rtl:border-r rtl:border-l-0">
            <div className="p-4 flex-shrink-0">
              <div className="relative">
                <Input
                  placeholder="بحث في المحادثات..."
                  className="w-full pr-10 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {filteredConversations.length > 0 ? (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "flex flex-row-reverse items-center p-4 rounded-xl hover:bg-brand-background cursor-pointer transition-colors shadow-soft text-right",
                      selectedConversation?.id === conv.id && "bg-brand-primary-light/20",
                      conv.unreadCount > 0 && "font-semibold"
                    )}
                  >
                    <Avatar className="h-12 w-12 ml-3 flex-shrink-0">
                      <AvatarImage src={conv.participantAvatarUrl} alt={conv.participantName} />
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{conv.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="font-cairo text-brand-text-dark text-lg truncate">{conv.participantName}</p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-brand-danger text-white text-xs px-2 py-1 rounded-full font-ibm-plex-arabic flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{conv.lastMessage}</p>
                      <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">{conv.lastMessageTime}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-brand-text-muted p-4 font-ibm-plex-arabic">لا توجد محادثات.</p>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="w-2/3 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex flex-row-reverse items-center p-4 border-b border-border flex-shrink-0">
                  <Avatar className="h-12 w-12 ml-3">
                    <AvatarImage src={selectedConversation.participantAvatarUrl} alt={selectedConversation.participantName} />
                    <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{selectedConversation.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-cairo text-xl text-brand-text-dark flex-grow text-right">{selectedConversation.participantName}</h3>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                  {selectedConversation.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender === 'client' ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] p-4 rounded-xl shadow-soft",
                          msg.sender === 'client'
                            ? 'bg-brand-primary text-white rounded-br-none'
                            : 'bg-brand-background text-brand-text-dark rounded-bl-none'
                        )}
                      >
                        <p className="font-ibm-plex-arabic">{msg.content}</p>
                        <span className={cn("text-xs mt-1 block font-ibm-plex-arabic", msg.sender === 'client' ? 'text-white/80' : 'text-brand-text-muted')}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border flex-shrink-0">
                  <div className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse">
                    <Button variant="ghost" size="icon" className="text-brand-text-muted hover:text-brand-primary rounded-full shadow-soft bg-brand-card-bg">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Textarea
                      placeholder="اكتب رسالتك..."
                      className="flex-grow resize-none rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                      rows={1}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} className="bg-brand-primary hover:bg-brand-primary-dark text-white p-3 rounded-xl shadow-soft">
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-brand-text-muted font-ibm-plex-arabic text-lg">
                اختر محادثة للبدء
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};