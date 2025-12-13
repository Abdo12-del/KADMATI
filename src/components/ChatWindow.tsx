"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // Import toast for notifications

interface Message {
  id: string;
  sender: 'customer' | 'provider'; // 'provider' for the current user, 'customer' for the other party
  text: string;
  time: string;
}

interface Conversation {
  id: string; // This is the conversation_id from backend
  customerName: string;
  avatarUrl: string;
  messages: Message[];
  otherPartyBackendId: number; // New prop to identify the other user in backend
}

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: 'provider' | 'customer'; // لتحديد من هو المستخدم الحالي
  currentBackendUserId: number; // New prop for the current user's backend ID
  onMessageSent: () => void; // Callback to notify parent about new message
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ChatWindow = ({ conversation, currentUserId, currentBackendUserId, onMessageSent }: ChatWindowProps) => {
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

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      const newMessageText = messageInput.trim();
      setMessageInput(''); // Clear input immediately

      const tempMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic UI update
        sender: currentUserId,
        text: newMessageText,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setCurrentMessages(prevMessages => [...prevMessages, tempMessage]);
      setTimeout(scrollToBottom, 100); // Scroll after optimistic update

      try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_id: currentBackendUserId,
            receiver_id: conversation.otherPartyBackendId,
            conversation_id: conversation.id,
            text: newMessageText,
            read: false, // Sender's message is initially unread by receiver
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'فشل إرسال الرسالة.');
        }

        // If successful, the parent component will re-fetch and update the actual messages
        onMessageSent();
        toast.success('تم إرسال الرسالة.');

      } catch (error: any) {
        toast.error(error.message || 'حدث خطأ أثناء إرسال الرسالة.');
        console.error('Error sending message:', error);
        // Revert optimistic update if sending fails (optional, but good for UX)
        setCurrentMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
      }
    }
  };

  const handleAttachFile = () => {
    toast.info('وظيفة إرفاق الملفات قيد التطوير (وظيفة وهمية)!');
    console.log('Attach file clicked');
  };

  return (
    <div className="flex flex-col h-full bg-brand-card-bg rounded-2xl">
      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {currentMessages.map(msg => (
          <div
            key={msg.id}
            className={cn("flex", msg.sender === currentUserId ? 'justify-start' : 'justify-end')}
          >
            <div
              className={cn(
                "max-w-[75%] p-3 rounded-xl shadow-sm", // Added shadow-sm and max-w-[75%]
                msg.sender === currentUserId
                  ? 'bg-brand-primary text-white rounded-br-none'
                  : 'bg-brand-background text-brand-text-dark rounded-bl-none'
              )}
            >
              <p className="font-ibm-plex-arabic text-sm">{msg.text}</p>
              <span className={cn("text-xs mt-1 block font-ibm-plex-arabic", msg.sender === currentUserId ? 'text-white/80' : 'text-brand-text-muted')}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="border-t border-border pt-4 flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse px-4 pb-4 flex-shrink-0">
        <Button onClick={handleAttachFile} variant="ghost" size="icon" className="text-brand-text-muted hover:text-brand-primary rounded-full">
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