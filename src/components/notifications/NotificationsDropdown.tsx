"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Package, MessageSquare, CreditCard, Settings, Info, Star } from 'lucide-react';
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
import { toast } from 'sonner';

interface BackendMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  conversation_id: string;
  text: string;
  read?: boolean;
  created_at?: string;
}

interface BackendRequest {
  id: number;
  client_id: number;
  title: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at?: string;
}

interface BackendRating {
  id: number;
  service_id: number;
  client_id: number;
  rating: number;
  comment?: string;
  created_at?: string;
}

interface BackendUser {
  id: number;
  name: string;
}

interface BackendService {
  id: number;
  title: string;
}

interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'system' | 'general' | 'rating';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string; // Optional link for the notification
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
    case 'rating':
      return <Star className="h-5 w-5 text-yellow-500" />;
    case 'general':
    default:
      return <Info className="h-5 w-5 text-brand-info" />;
  }
};

export const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded current user ID for demonstration (Ahmed Provider)
  const CURRENT_USER_ID = 1; 

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [messagesResponse, requestsResponse, ratingsResponse, usersResponse, servicesResponse] = await Promise.all([
        fetch('http://localhost:3000/api/messages'),
        fetch('http://localhost:3000/api/requests'),
        fetch('http://localhost:3000/api/ratings'),
        fetch('http://localhost:3000/api/users'),
        fetch('http://localhost:3000/api/services'), // Fetch services
      ]);

      if (!messagesResponse.ok) throw new Error('فشل جلب الرسائل.');
      if (!requestsResponse.ok) throw new Error('فشل جلب الطلبات.');
      if (!ratingsResponse.ok) throw new Error('فشل جلب التقييمات.');
      if (!usersResponse.ok) throw new Error('فشل جلب المستخدمين.');
      if (!servicesResponse.ok) throw new Error('فشل جلب الخدمات.'); // Check services response

      const messagesData: BackendMessage[] = (await messagesResponse.json()).data;
      const requestsData: BackendRequest[] = (await requestsResponse.json()).data;
      const ratingsData: BackendRating[] = (await ratingsResponse.json()).data;
      const usersData: BackendUser[] = (await usersResponse.json()).data;
      const servicesData: BackendService[] = (await servicesResponse.json()).data; // Get services data

      const newNotifications: Notification[] = [];

      // Process Messages (new messages received by CURRENT_USER_ID)
      messagesData.forEach(msg => {
        if (msg.receiver_id === CURRENT_USER_ID && msg.sender_id !== CURRENT_USER_ID) {
          const sender = usersData.find(u => u.id === msg.sender_id);
          newNotifications.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: `رسالة جديدة من ${sender?.name || 'مستخدم غير معروف'}`,
            description: msg.text,
            time: new Date(msg.created_at || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            read: msg.read || false,
            link: '/dashboard/messages', // Link to message center
          });
        }
      });

      // Process Requests (new requests relevant to CURRENT_USER_ID, assuming provider)
      requestsData.forEach(req => {
        // Assuming provider gets notified of new pending requests
        // In a real app, you'd check if the request is for a service offered by CURRENT_USER_ID
        if (req.status === 'pending') { 
          const client = usersData.find(u => u.id === req.client_id);
          newNotifications.push({
            id: `req-${req.id}`,
            type: 'order',
            title: `طلب خدمة جديد: ${req.title}`,
            description: `من العميل: ${client?.name || 'عميل غير معروف'}`,
            time: new Date(req.created_at || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            read: false, // Assuming new requests are unread by default
            link: '/dashboard/orders', // Link to orders page
          });
        }
      });

      // Process Ratings (new ratings for services provided by CURRENT_USER_ID)
      ratingsData.forEach(rating => {
        const client = usersData.find(u => u.id === rating.client_id);
        const service = servicesData.find(s => s.id === rating.service_id); // Find the service
        // In a real app, you'd check if the service_id belongs to CURRENT_USER_ID
        newNotifications.push({
          id: `rating-${rating.id}`,
          type: 'rating',
          title: `تقييم جديد (${rating.rating} نجوم)`,
          description: `من ${client?.name || 'عميل غير معروف'} على خدمة: ${service?.title || 'غير معروفة'}.`, // Use service title
          time: new Date(rating.created_at || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          read: false, // Assuming new ratings are unread by default
          link: '/dashboard/ratings', // Link to ratings page
        });
      });

      // Sort notifications by time (most recent first)
      newNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifications(newNotifications);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب الإشعارات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications (e.g., every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000); 
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);

  // Function to mark a notification as read (this would update backend for messages/requests/ratings)
  const handleMarkAsRead = async (id: string) => {
    const [type, backendId] = id.split('-');
    try {
      if (type === 'msg') {
        await fetch(`http://localhost:3000/api/messages/${backendId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        });
      }
      // For requests/ratings, you'd need a 'read' status in their models/APIs
      // For now, we'll just update frontend state for other types
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
      );
      toast.success('تم تمييز الإشعار كمقروء.');
      fetchNotifications(); // Re-fetch to ensure consistency
    } catch (err: any) {
      toast.error('فشل تمييز الإشعار كمقروء: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
        <Bell className="h-5 w-5" />
        <span className="sr-only">الإشعارات</span>
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
        <Bell className="h-5 w-5 text-brand-danger" />
        <span className="sr-only">الإشعارات (خطأ)</span>
      </Button>
    );
  }

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
                // onClick={() => handleMarkAsRead(notification.id)} // Mark as read on click
                className={cn(
                  "flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg cursor-pointer hover:bg-brand-background transition-colors duration-200 text-right",
                  !notification.read && "font-semibold bg-brand-primary-light/10"
                )}
              >
                <Link to={notification.link || '#'} className="flex items-center space-x-3 rtl:space-x-reverse w-full" onClick={() => handleMarkAsRead(notification.id)}>
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-brand-text-dark font-ibm-plex-arabic">{notification.title}</p>
                    <p className="text-xs text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{notification.description}</p>
                    <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">{notification.time}</p>
                  </div>
                </Link>
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