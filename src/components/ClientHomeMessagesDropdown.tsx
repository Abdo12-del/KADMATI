"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  read: boolean;
  avatarUrl?: string;
}

interface ClientHomeMessagesDropdownProps {
  unreadCount: number;
}

export const ClientHomeMessagesDropdown = ({ unreadCount }: ClientHomeMessagesDropdownProps) => {
  const messages: Message[] = [
    { id: '1', sender: 'شركة النظافة السريعة', content: 'تم تأكيد موعد التنظيف لمنزلك.', time: 'منذ 5 دقائق', read: false, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS' },
    { id: '2', sender: 'مهندس الديكور أحمد', content: 'هل لديك أي تعديلات على التصميم المقترح؟', time: 'منذ ساعة', read: false, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MA' },
    { id: '3', sender: 'فني الصيانة ماهر', content: 'تم الانتهاء من صيانة المكيفات.', time: 'أمس', read: true, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FM' },
  ];

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-brand-danger flex items-center justify-center text-xs text-white font-ibm-plex-arabic">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">الرسائل</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-xl shadow-soft bg-brand-card-bg p-2" align="end">
        <div className="flex justify-between items-center p-2">
          <h3 className="text-lg font-cairo text-brand-text-dark">الرسائل</h3>
          {unreadCount > 0 && (
            <span className="text-sm text-brand-primary font-ibm-plex-arabic">
              {unreadCount} غير مقروء
            </span>
          )}
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <ScrollArea className="h-[300px]">
          {messages.length > 0 ? (
            messages.map((message) => (
              <DropdownMenuItem
                key={message.id}
                className={cn(
                  "flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg cursor-pointer hover:bg-brand-background transition-colors duration-200 text-right",
                  !message.read && "font-semibold bg-brand-primary-light/10"
                )}
              >
                <Avatar className="h-10 w-10 flex-shrink-0 ml-3">
                  <AvatarImage src={message.avatarUrl} alt={message.sender} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{message.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="text-sm text-brand-text-dark font-ibm-plex-arabic">{message.sender}</p>
                  <p className="text-xs text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{message.content}</p>
                  <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">{message.time}</p>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="text-center text-brand-text-muted p-4 font-ibm-plex-arabic">لا توجد رسائل جديدة.</p>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="p-2">
          <Link to="/client-dashboard/messages" className="w-full text-center text-brand-primary hover:text-brand-primary-dark font-ibm-plex-arabic rounded-lg block">
            عرض كل الرسائل
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};