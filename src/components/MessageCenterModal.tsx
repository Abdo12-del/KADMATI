"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatWindow from '@/components/ChatWindow';
import { toast } from 'sonner';

interface MessageData {
  id: number;
  sender_id: number;
  receiver_id: number;
  conversation_id: string;
  text: string;
  read?: boolean;
  created_at?: string;
}

interface UserData {
  id: number;
  name: string;
  avatar_url?: string;
}

interface Conversation {
  id: string;
  customerName: string;
  avatarUrl: string;
  messages: {
    id: string;
    sender: 'customer' | 'provider';
    text: string;
    time: string;
  }[];
  unreadCount: number;
  lastMessageTime: string;
}

interface MessageCenterModalProps {
  currentUserId?: 'provider' | 'customer'; // لتحديد من هو المستخدم الحالي
}

export const MessageCenterModal = ({ currentUserId = 'provider' }: MessageCenterModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allMessages, setAllMessages] = useState<MessageData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const CURRENT_USER_BACKEND_ID = currentUserId === 'provider' ? 1 : 2; // Map frontend role to backend user ID

  const fetchMessagesAndUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [messagesResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:3000/api/messages'),
        fetch('http://localhost:3000/api/users'),
      ]);

      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        throw new Error(errorData.message || 'فشل جلب الرسائل.');
      }
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين.');
      }

      const messagesResult = await messagesResponse.json();
      const usersResult = await usersResponse.json();

      setAllMessages(messagesResult.data);
      setAllUsers(usersResult.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب البيانات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMessagesAndUsers();
    }
  }, [isOpen, fetchMessagesAndUsers]);

  const conversations = useMemo(() => {
    const convMap = new Map<string, Conversation>();

    allMessages.forEach(msg => {
      // Only include messages relevant to the current user
      if (msg.sender_id !== CURRENT_USER_BACKEND_ID && msg.receiver_id !== CURRENT_USER_BACKEND_ID) {
        return;
      }

      const otherPartyId = msg.sender_id === CURRENT_USER_BACKEND_ID ? msg.receiver_id : msg.sender_id;
      const otherParty = allUsers.find(u => u.id === otherPartyId);

      if (!otherParty) return;

      const customerName = otherParty.name;
      const avatarUrl = otherParty.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${customerName.split(' ').map(n => n[0]).join('')}`;

      if (!convMap.has(msg.conversation_id)) {
        convMap.set(msg.conversation_id, {
          id: msg.conversation_id,
          customerName,
          avatarUrl,
          messages: [],
          unreadCount: 0,
          lastMessageTime: '',
        });
      }

      const conv = convMap.get(msg.conversation_id)!;
      conv.messages.push({
        id: msg.id.toString(),
        sender: msg.sender_id === CURRENT_USER_BACKEND_ID ? currentUserId : (currentUserId === 'provider' ? 'customer' : 'provider'),
        text: msg.text,
        time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '',
      });
      if (!msg.read && msg.sender_id !== CURRENT_USER_BACKEND_ID) {
        conv.unreadCount++;
      }
      conv.lastMessageTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
    });

    // Sort messages within each conversation by time
    convMap.forEach(conv => {
      conv.messages.sort((a, b) => new Date(`2000/01/01 ${a.time}`).getTime() - new Date(`2000/01/01 ${b.time}`).getTime());
    });

    return Array.from(convMap.values());
  }, [allMessages, allUsers, currentUserId, CURRENT_USER_BACKEND_ID]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [conversations]);

  const sortedAndFilteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv =>
      conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages.some(msg => msg.text.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return filtered.sort((a, b) => {
      // Sort by unread first, then by last message time
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(`2000/01/01 ${b.lastMessageTime}`).getTime() - new Date(`2000/01/01 ${a.lastMessageTime}`).getTime();
    });
  }, [conversations, searchTerm]);

  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    // Mark messages as read for the selected conversation in the backend
    const messagesToMarkAsRead = allMessages.filter(msg =>
      msg.conversation_id === id && !msg.read && msg.receiver_id === CURRENT_USER_BACKEND_ID
    );

    for (const msg of messagesToMarkAsRead) {
      try {
        await fetch(`http://localhost:3000/api/messages/${msg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        });
      } catch (err) {
        console.error('Failed to mark message as read:', err);
        toast.error('فشل تحديث حالة قراءة الرسالة.');
      }
    }
    // Re-fetch messages to update frontend state
    fetchMessagesAndUsers();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSelectedConversationId(null); // Reset selected conversation when closing
  };

  if (loading) {
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
          <div className="flex items-center justify-center h-full text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الرسائل...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
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
          <div className="flex items-center justify-center h-full text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
        </DialogContent>
      </Dialog>
    );
  }

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
              {sortedAndFilteredConversations.length > 0 ? (
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
                        {conv.messages[conv.messages.length - 1]?.text || 'لا توجد رسائل'}
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
                <ChatWindow conversation={selectedConversation} currentUserId={currentUserId} />
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