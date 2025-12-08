import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, MessageSquare, CreditCard, Settings, Info, CheckCircle, Trash2, Star } from 'lucide-react'; // Import Star icon
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'system' | 'general' | 'rating'; // Added 'rating' type
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return <Package className="h-6 w-6 text-brand-primary" />;
    case 'message':
      return <MessageSquare className="h-6 w-6 text-brand-warning" />;
    case 'payment':
      return <CreditCard className="h-6 w-6 text-brand-success" />;
    case 'system':
      return <Settings className="h-6 w-6 text-brand-text-muted" />;
    case 'rating': // Added case for 'rating'
      return <Star className="h-6 w-6 text-yellow-500" />;
    case 'general':
    default:
      return <Info className="h-6 w-6 text-brand-info" />;
  }
};

export const NotificationCard = ({ notification, onMarkAsRead, onDelete }: NotificationCardProps) => {
  return (
    <Card className={cn(
      "bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-4 text-right",
      !notification.read && "border-r-4 border-brand-primary" // تمييز الإشعارات غير المقروءة
    )}>
      <CardContent className="p-0 space-y-3">
        <div className="flex flex-row-reverse items-center space-x-3 rtl:space-x-reverse">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-grow">
            <p className={cn("text-lg font-cairo text-brand-text-dark", !notification.read && "font-bold")}>
              {notification.title}
            </p>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">{notification.description}</p>
            <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">{notification.time}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {!notification.read && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkAsRead?.(notification.id)}
              className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic"
            >
              <CheckCircle className="ml-2 h-4 w-4" />
              تمييز كمقروء
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete?.(notification.id)}
            className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg shadow-soft font-ibm-plex-arabic"
          >
            <Trash2 className="ml-2 h-4 w-4" />
            حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};