"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
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
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { mockMessages, mockRequests, mockRatings, mockUsers, mockServices } from '@/lib/mock-data'; // Import mock data

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

// Removed API_BASE_URL as it's no longer needed

export const NotificationsDropdown = () => {
  const { user } = useAuth(); // Get current user from auth context
  const CURRENT_USER_ID = user?.id; // Use actual current user ID
  const CURRENT_USER_ROLE = user?.role; // Use actual current user role
  const navigate = useNavigate(); // Initialize useNavigate

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!CURRENT_USER_ID) {
      setLoading(false);
      setError('User ID not available. Please log in.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const messagesData = mockMessages;
      const requestsData = mockRequests;
      const ratingsData = mockRatings;
      const usersData = mockUsers;
      const servicesData = mockServices;

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
            link: CURRENT_USER_ROLE === 'provider' ? '/dashboard/messages' : '/client-messages', // Link to message center
          });
        }
      });

      // Process Requests
      requestsData.forEach(req => {
        if (CURRENT_USER_ROLE === 'provider') {
          // As a provider, get notified of new pending requests (for any service for now)
          // In a real app, you'd filter requests for services offered by this provider
          if (req.status === 'pending') {
            const client = usersData.find(u => u.id === req.client_id);
            newNotifications.push({
              id: `req-${req.id}`,
              type: 'order',
              title: `طلب خدمة جديد: ${req.title}`,
              description: `من العميل: ${client?.name || 'عميل غير معروف'}`,
              time: new Date(req.created_at || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              read: false,
              link: '/dashboard/orders',
            });
          }
        } else if (CURRENT_USER_ROLE === 'seeker') {
          // As a seeker, get notified about status updates on their requests
          if (req.client_id === CURRENT_USER_ID && req.status !== 'pending') { // Assuming 'pending' is initial, other statuses are updates
            const statusText = req.status === 'accepted' ? 'تم قبول' : req.status === 'completed' ? 'تم إكمال' : 'تم إلغاء';
            newNotifications.push({
              id: `req-${req.id}`,
              type: 'order',
              title: `${statusText} طلبك: ${req.title}`,
              description: `حالة الطلب: ${req.status}`,
              time: new Date(req.updated_at || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              read: false,
              link: '/client-requests', // Link to client's requests page
            });
          }
        }
      });

      // Process Ratings
      ratingsData.forEach(rating => {
        const client = usersData.find(u => u.id === rating.client_id);
        const service = servicesData.find(s => s.id === rating.service_id);

        if (CURRENT_USER_ROLE === 'provider' && service?.provider_id === CURRENT_USER_ID) {
          // Provider gets notified of new ratings for their services
          newNotifications.push({
            id: `rating-${rating.id}`,
            type: 'rating',
            title: `تقييم جديد (${rating.rating} نجوم)`,
            description: `من ${client?.name || 'عميل غير معروف'} على خدمة: ${service?.title || 'غير معروفة'}.`,
            time: new Date(rating.created_at || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            link: '/dashboard/ratings',
          });
        } else if (CURRENT_USER_ROLE === 'seeker' && rating.client_id === CURRENT_USER_ID) {
          // Seeker might get a confirmation of their rating (less common as a notification)
          // Or a notification if a provider responds to their review (not implemented yet)
          // For now, we'll skip seeker-side rating notifications to avoid redundancy.
        }
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
  }, [CURRENT_USER_ID, CURRENT_USER_ROLE]);

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
      // Simulate marking as read
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

      // For mock data, just update the frontend state
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
      );
      // No toast.success here, as navigation will happen immediately after
      // and the target page might show its own success/loading state.
      // Also, no fetchNotifications() here to avoid re-render interruption.
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
                onSelect={() => { // Use onSelect for DropdownMenuItem
                  handleMarkAsRead(notification.id); // Mark as read
                  if (notification.link) {
                    navigate(notification.link); // Navigate programmatically
                  }
                }}
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
          <Link to={CURRENT_USER_ROLE === 'provider' ? '/dashboard/notifications' : '/client-notifications'} className="w-full text-center text-brand-primary hover:text-brand-primary-dark font-ibm-plex-arabic rounded-lg block">
            عرض كل الإشعارات
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};