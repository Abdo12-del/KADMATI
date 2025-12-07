import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Package, MessageSquare, CreditCard, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'system' | 'general';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  unreadCount: number; // This will now be passed from parent, or fetched
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return <Package className="h-5 w-5 text-brand-primary" />;
    case 'message':
      return <MessageSquare className="h-5 w-5 text-brand-warning" />;
    case 'payment':
      return <CreditCard className="h-5 w-5 text-brand-success" />;
    case 'system':
      return <Settings className="h-5 w-5 text-brand-text-muted" />;
    case 'general':
    default:
      return <Info className="h-5 w-5 text-brand-info" />;
  }
};

export const NotificationsDropdown = ({ unreadCount }: NotificationsDropdownProps) => {
  // Placeholder data for recent notifications - will be fetched from API
  const notifications: Notification[] = [];

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-brand-danger flex items-center justify-center text-xs text-white font-ibm-plex-arabic">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">الإشعارات</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-xl shadow-soft bg-brand-card-bg p-2" align="end">
        <div className="flex justify-between items-center p-2">
          <h3 className="text-lg font-cairo text-brand-text-dark">الإشعارات</h3>
          {unreadCount > 0 && (
            <span className="text-sm text-brand-primary font-ibm-plex-arabic">
              {unreadCount} غير مقروء
            </span>
          )}
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg cursor-pointer hover:bg-brand-background transition-colors duration-200 text-right",
                  !notification.read && "font-semibold bg-brand-primary-light/10"
                )}
              >
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-grow">
                  <p className="text-sm text-brand-text-dark font-ibm-plex-arabic">{notification.title}</p>
                  <p className="text-xs text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{notification.description}</p>
                  <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">{notification.time}</p>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="text-center text-brand-text-muted p-4 font-ibm-plex-arabic">لا توجد إشعارات جديدة.</p>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="p-2">
          <Link to="/notifications" className="w-full text-center text-brand-primary hover:text-brand-primary-dark font-ibm-plex-arabic rounded-lg block">
            عرض كل الإشعارات
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};