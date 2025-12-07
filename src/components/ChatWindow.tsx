"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  sender: 'customer' | 'provider'; // Added for frontend display logic
  time: string; // Added for frontend display logic
}

interface Conversation {
  id: string;
  customerName: string;
  avatarUrl: string;
  messages: Message[];
}

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string; // يجب أن يكون معرف المستخدم الحقيقي
}

const sendMessage = async (newMessage: { conversationId: string; senderId: string; text: string }) => {
  const response = await fetch('http://localhost:3000/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newMessage),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
};

const ChatWindow = ({ conversation, currentUserId }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState('');
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]); // Scroll when new messages arrive

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUserId] }); // Invalidate conversations to update last message/time
      setMessageInput('');
      setTimeout(scrollToBottom, 100); // Scroll after render
    },
    onError: (error) => {
      toast.error(`فشل في إرسال الرسالة: ${error.message}`);
    },
  });

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessageMutation.mutate({
        conversationId: conversation.id,
        senderId: currentUserId,
        text: messageInput.trim(),
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-card-bg rounded-2xl">
      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {conversation.messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUserId ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-xl shadow-soft ${
                msg.senderId === currentUserId
                  ? 'bg-brand-primary text-white rounded-br-none'
                  : 'bg-brand-background text-brand-text-dark rounded-bl-none'
              }`}
            >
              <p className="font-ibm-plex-arabic text-sm">{msg.text}</p>
              <span className={`text-xs mt-1 block font-ibm-plex-arabic ${msg.senderId === currentUserId ? 'text-white/80' : 'text-brand-text-muted'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
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
          disabled={sendMessageMutation.isPending}
        />
        <Button onClick={handleSendMessage} className="bg-brand-primary hover:bg-brand-primary-dark text-white p-3 rounded-xl shadow-soft" disabled={sendMessageMutation.isPending}>
          {sendMessageMutation.isPending ? '...' : <Send className="h-5 w-5" />}
          <span className="sr-only">إرسال</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatWindow;