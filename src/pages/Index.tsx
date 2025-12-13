"use client";

import { useState, useEffect, useCallback } from 'react';
import ChatWindow from '../components/ChatWindow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // Assuming sonner is used for toasts

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
  otherPartyBackendId: number;
}

// Mock data for conversations - Initial messages will be cleared here
const initialConversations: Conversation[] = [
  {
    id: 'conv1',
    customerName: 'أحمد محمد',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    messages: [], // تم إفراغ الرسائل الأولية
    otherPartyBackendId: 101,
  },
  {
    id: 'conv2',
    customerName: 'فاطمة الزهراء',
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    messages: [], // تم إفراغ الرسائل الأولية
    otherPartyBackendId: 102,
  },
  {
    id: 'conv3',
    customerName: 'علياء محمود',
    avatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    messages: [], // تم إفراغ الرسائل الأولية
    otherPartyBackendId: 103,
  },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations.map(conv => ({ ...conv, messages: [] })) // Ensure all initial messages are empty
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversations[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentBackendUserId = 1; // Assuming a fixed ID for the current user for now

  const fetchMessagesForConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversation/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const fetchedMessages = await response.json();

      // Map backend messages to frontend Message interface
      const formattedMessages: Message[] = fetchedMessages.map((msg: any) => ({
        id: msg.id.toString(),
        sender: msg.sender_id === currentBackendUserId ? 'provider' : 'customer',
        text: msg.text,
        time: new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      }));

      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, messages: formattedMessages } : conv
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('فشل تحميل الرسائل.');
    }
  }, [currentBackendUserId]);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessagesForConversation(selectedConversationId);
    }
  }, [selectedConversationId, fetchMessagesForConversation]);

  const handleMessageSent = useCallback(() => {
    if (selectedConversationId) {
      fetchMessagesForConversation(selectedConversationId);
    }
  }, [selectedConversationId, fetchMessagesForConversation]);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  const filteredConversations = conversations.filter(conv =>
    conv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-brand-background text-brand-text-dark font-ibm-plex-arabic">
      {/* Left Pane: Chat List */}
      <div className="w-1/3 border-r border-border flex flex-col bg-brand-card-bg rounded-2xl m-4 p-4">
        <h2 className="text-2xl font-bold mb-6 text-brand-primary">المحادثات</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
          <Input
            type="text"
            placeholder="ابحث عن محادثة..."
            className="pl-10 pr-4 py-2 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-grow overflow-y-auto space-y-2">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={cn(
                "flex items-center p-3 rounded-xl cursor-pointer transition-colors",
                selectedConversationId === conv.id ? 'bg-brand-primary text-white shadow-soft' : 'hover:bg-brand-background'
              )}
              onClick={() => setSelectedConversationId(conv.id)}
            >
              <Avatar className="h-10 w-10 ml-3">
                <AvatarImage src={conv.avatarUrl} alt={conv.customerName} />
                <AvatarFallback>{conv.customerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow text-right">
                <p className={cn("font-medium", selectedConversationId === conv.id ? 'text-white' : 'text-brand-text-dark')}>{conv.customerName}</p>
                <p className={cn("text-sm", selectedConversationId === conv.id ? 'text-white/80' : 'text-brand-text-muted')}>
                  {conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : 'لا توجد رسائل بعد'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Chat Window */}
      <div className="flex-grow m-4">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUserId="provider"
            currentBackendUserId={currentBackendUserId}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-brand-card-bg rounded-2xl text-brand-text-muted">
            <p>الرجاء اختيار محادثة للبدء.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;