"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: 'customer' | 'provider';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customerName: string;
  avatarUrl: string;
  messages: Message[];
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

const ChatModal = ({ isOpen, onClose, conversation }: ChatModalProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, conversation]);

  if (!conversation) {
    return null;
  }

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, you'd send this to a backend and update the conversation
      console.log("Sending message:", messageInput);
      setMessageInput('');
      // For demo, we can simulate adding a message
      // conversation.messages.push({
      //   id: `msg${conversation.messages.length + 1}`,
      //   sender: 'provider', // Assuming current user is provider
      //   text: messageInput,
      //   time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      // });
      // scrollToBottom();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col rounded-2xl shadow-soft bg-red-500 p-6 overflow-hidden"> {/* تم تغيير اللون هنا مؤقتًا */}
        <DialogHeader className="border-b border-border pb-4 flex flex-row-reverse items-center bg-red-500 rounded-tr-2xl -mx-6 px-6 pt-0"> {/* تم تغيير اللون هنا مؤقتًا */}
          <Avatar className="h-12 w-12 ml-3">
            <AvatarImage src={conversation.avatarUrl} alt={conversation.customerName} />
            <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{conversation.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <DialogTitle className="font-cairo text-white text-xl">{conversation.customerName}</DialogTitle> {/* تم تغيير لون النص ليتناسب مع الخلفية الحمراء */}
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-0 space-y-4 mt-4">
          {conversation.messages.map(msg => (
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
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-border pt-4 flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse bg-red-500 -mx-6 px-6 pb-0"> {/* تم تغيير اللون هنا مؤقتًا */}
          <Button variant="ghost" size="icon" className="text-white hover:text-brand-primary rounded-full shadow-soft bg-brand-background">
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
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;