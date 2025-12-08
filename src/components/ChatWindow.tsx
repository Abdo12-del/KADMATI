"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: 'customer' | 'provider'; // 'provider' for the current user, 'customer' for the other party
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customerName: string;
  avatarUrl: string;
  messages: Message[];
}

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: 'provider' | 'customer'; // لتحديد من هو المستخدم الحالي
}

const ChatWindow = ({ conversation, currentUserId }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const [currentMessages, setCurrentMessages] = useState<Message[]>(conversation.messages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setCurrentMessages(conversation.messages); // تحديث الرسائل عند تغيير المحادثة
    scrollToBottom();
  }, [conversation]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: `msg${currentMessages.length + 1}-${Date.now()}`,
        sender: currentUserId,
        text: messageInput.trim(),
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setCurrentMessages(prevMessages => [...prevMessages, newMessage]);
      setMessageInput('');
      // In a real app, you'd send this to a backend API
      console.log("Sending message:", newMessage);
      setTimeout(scrollToBottom, 100); // Scroll after render
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-card-bg rounded-2xl">
      {/* Chat Header - Managed by parent MessageCenterModal for consistency */}
      {/* <div className="border-b border-border pb-4 flex flex-row-reverse items-center px-6 pt-0">
        <Avatar className="h-12 w-12 ml-3">
          <AvatarImage src={conversation.avatarUrl} alt={conversation.customerName} />
          <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{conversation.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <h3 className="font-cairo text-brand-text-dark text-xl">{conversation.customerName}</h3>
      </div> */}

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {currentMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === currentUserId ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-xl shadow-soft ${
                msg.sender === currentUserId
                  ? 'bg-brand-primary text-white rounded-br-none'
                  : 'bg-brand-background text-brand-text-dark rounded-bl-none'
              }`}
            >
              <p className="font-ibm-plex-arabic text-sm">{msg.text}</p>
              <span className={`text-xs mt-1 block font-ibm-plex-arabic ${msg.sender === currentUserId ? 'text-white/80' : 'text-brand-text-muted'}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="border-t border-border pt-4 flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse px-4 pb-4 flex-shrink-0">
        <Button variant="ghost" size="icon" className="text-brand-text-muted hover:text-brand-primary rounded-full">
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">إرفاق ملف</span>
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
          <span className="sr-only">إرسال</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatWindow;