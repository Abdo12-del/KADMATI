"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatWindow from '@/components/ChatWindow'; // استيراد مكون ChatWindow
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

interface Message {
  id: string;
  senderId: string; // Changed from 'sender' to 'senderId' to match backend
  text: string;
  timestamp: string; // Changed from 'time' to 'timestamp'
  read: boolean;
}

interface ConversationListItem {
  id: string;
  customerName: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface MessageCenterModalProps {
  currentUserId: string; // يجب أن يكون معرف المستخدم الحقيقي
}

const fetchConversations = async (userId: string): Promise<ConversationListItem[]> => {
  const response = await fetch(`http://localhost:3000/api/conversations/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  return response.json();
};

const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await fetch(`http://localhost:3000/api/messages/conversation/${conversationId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
};

const markConversationAsRead = async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
  const response = await fetch(`http://localhost:3000/api/messages/read/${conversationId}/${userId}`, {
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error('Failed to mark messages as read');
  }
  return response.json();
};

export const MessageCenterModal = ({ currentUserId }: MessageCenterModalProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations, error: conversationsError } = useQuery<ConversationListItem[], Error>({
    queryKey: ['conversations', currentUserId],
    queryFn: () => fetchConversations(currentUserId),
    enabled: isOpen, // Only fetch when modal is open
    refetchInterval: 5000, // Poll for new conversations/messages every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError } = useQuery<Message[], Error>({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => fetchMessages(selectedConversationId!),
    enabled: !!selectedConversationId, // Only fetch when a conversation is selected
    refetchInterval: 3000, // Poll for new messages in active chat every 3 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
    },
  });

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [conversations]);

  const sortedAndFilteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv =>
      conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.sort((a, b) => {
      // Sort by unread first, then by last message time
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }, [conversations, searchTerm]);

  const selectedConversation = useMemo(() => {
    const conv = conversations.find(conv => conv.id === selectedConversationId);
    if (conv) {
      return {
        ...conv,
        messages: messages.map(msg => ({
          ...msg,
          sender: msg.senderId === currentUserId ? 'provider' : 'customer', // Map senderId to 'provider'/'customer' for ChatWindow
          time: new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        })),
      };
    }
    return null;
  }, [conversations, selectedConversationId, messages, currentUserId]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    // Mark messages as read for the selected conversation
    markAsReadMutation.mutate({ conversationId: id, userId: currentUserId });
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSelectedConversationId(null); // Reset selected conversation when closing
  };

  if (conversationsError) console.error("Error fetching conversations:", conversationsError);
  if (messagesError) console.error("Error fetching messages:", messagesError);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <DialogHeader className="flex flex-row-reverse items-center justify-between border-b border-border pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark">مركز الرسائل</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleCloseModal} className="text-brand-text-muted hover:bg-brand-background rounded-full">
            <X className="h-5 w-5" />
            <span className="sr-only">إغلاق</span>
          </Button>
        </DialogHeader>

        <div className="flex flex-grow overflow-hidden rtl:flex-row-reverse">
          {/* Conversation List Sidebar */}
          <div className={cn(
            "w-full lg:w-1/3 border-l border-border p-4 flex flex-col flex-shrink-0 rtl:border-r rtl:border-l-0",
            selectedConversationId && "hidden lg:flex" // Hide on small screens if a chat is selected
          )}>
            <div className="relative mb-4">
              <Input
                placeholder="بحث في المحادثات..."
                className="w-full pr-10 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
            </div>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
              {isLoadingConversations ? (
                <p className="text-brand-text-muted text-center p-4 font-ibm-plex-arabic">جاري تحميل المحادثات...</p>
              ) : sortedAndFilteredConversations.length > 0 ? (
                sortedAndFilteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "flex flex-row-reverse items-center p-3 rounded-xl hover:bg-brand-background cursor-pointer transition-colors shadow-soft text-right",
                      selectedConversationId === conv.id && "bg-brand-primary-light/20"
                    )}
                  >
                    <Avatar className="h-12 w-12 ml-3 flex-shrink-0">
                      <AvatarImage src={conv.avatarUrl} alt={conv.customerName} />
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{conv.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="font-cairo text-brand-text-dark font-semibold truncate">{conv.customerName}</p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 ml-2 h-5 w-5 rounded-full bg-brand-danger flex items-center justify-center text-xs text-white font-ibm-plex-arabic">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-text-muted font-ibm-plex-arabic line-clamp-1">
                        {conv.lastMessage || 'لا توجد رسائل'}
                      </p>
                      <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">
                        {conv.lastMessageTime}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-brand-text-muted text-center p-4 font-ibm-plex-arabic">لا توجد محادثات مطابقة.</p>
              )}
            </div>
          </div>

          {/* Chat Window Area */}
          <div className={cn(
            "flex-grow flex flex-col",
            !selectedConversationId && "hidden lg:flex items-center justify-center text-brand-text-muted font-ibm-plex-arabic",
            selectedConversationId && "w-full" // Take full width on small screens if chat is selected
          )}>
            {selectedConversation ? (
              <>
                {/* Chat Window Header */}
                <div className="flex flex-row-reverse items-center border-b border-border pb-4 px-4 pt-0 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedConversationId(null)} className="lg:hidden text-brand-text-muted hover:bg-brand-background rounded-full ml-2">
                    <X className="h-5 w-5" />
                    <span className="sr-only">العودة للمحادثات</span>
                  </Button>
                  <Avatar className="h-12 w-12 ml-3 flex-shrink-0">
                    <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.customerName} />
                    <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{selectedConversation.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-cairo text-brand-text-dark text-xl flex-grow text-right">{selectedConversation.customerName}</h3>
                </div>
                {isLoadingMessages ? (
                  <div className="flex-grow flex items-center justify-center text-brand-text-muted font-ibm-plex-arabic">جاري تحميل الرسائل...</div>
                ) : (
                  <ChatWindow conversation={selectedConversation} currentUserId={currentUserId} />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageSquare className="h-16 w-16 mb-4 text-brand-primary-light" />
                <p className="text-lg">اختر محادثة من القائمة للبدء.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};