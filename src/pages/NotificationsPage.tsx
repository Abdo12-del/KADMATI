"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import ClientHomeHeader from '@/components/ClientHomeHeader'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationCard } from '@/components/notifications/NotificationCard.tsx';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

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
  updated_at?: string; // Added for seeker notifications
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
  provider_id: number; // Added provider_id
}

interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'system' | 'general' | 'rating';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

const NotificationsPage = () => {
  const { user } = useAuth(); // Get current user from auth context
  const CURRENT_USER_ID = user?.id; // Use actual current user ID
  const CURRENT_USER_ROLE = user?.role; // Use actual current user role

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      const [messagesResponse, requestsResponse, ratingsResponse, usersResponse, servicesResponse] = await Promise.all([
        fetch('http://localhost:3000/api/messages'),
        fetch('http://localhost:3000/api/requests'),
        fetch('http://localhost:3000/api/ratings'),
        fetch('http://localhost:3000/api/users'),
        fetch('http://localhost:3000/api/services'),
      ]);

      if (!messagesResponse.ok) throw new Error('فشل جلب الرسائل.');
      if (!requestsResponse.ok) throw new Error('فشل جلب الطلبات.');
      if (!ratingsResponse.ok) throw new Error('فشل جلب التقييمات.');
      if (!usersResponse.ok) throw new Error('فشل جلب المستخدمين.');
      if (!servicesResponse.ok) throw new Error('فشل جلب الخدمات.');

      const messagesData: BackendMessage[] = (await messagesResponse.json()).data;
      const requestsData: BackendRequest[] = (await requestsResponse.json()).data;
      const ratingsData: BackendRating[] = (await ratingsResponse.json()).data;
      const usersData: BackendUser[] = (await usersResponse.json()).data;
      const servicesData: BackendService[] = (await servicesResponse.json()).data;

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
  }, [fetchNotifications]);

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

  const handleDelete = async (id: string) => {
    const [type, backendId] = id.split('-');
    try {
      if (type === 'msg') {
        await fetch(`http://localhost:3000/api/messages/${backendId}`, {
          method: 'DELETE',
        });
      }
      // For requests/ratings, you'd need a delete API
      // For now, we'll just update frontend state for other types
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('تم حذف الإشعار.');
      fetchNotifications(); // Re-fetch to ensure consistency
    } catch (err: any) {
      toast.error('فشل حذف الإشعار: ' + err.message);
    }
  };

  const filterNotificationsByType = (type: 'all' | Notification['type']) => {
    let filtered = notifications;

    if (type !== 'all') {
      filtered = filtered.filter(notif => notif.type === type);
    }

    if (searchTerm) {
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) || notif.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل الإشعارات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">
        خطأ: {error}
      </div>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">الإشعارات</h1>

      <div className="mb-8 relative max-w-lg">
        <Input
          placeholder="بحث في الإشعارات..."
          className="w-full pr-10 rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-brand-background rounded-xl shadow-soft p-2">
          <TabsTrigger value="all" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الكل</TabsTrigger>
          <TabsTrigger value="order" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الطلبات</TabsTrigger>
          <TabsTrigger value="message" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الرسائل</TabsTrigger>
          <TabsTrigger value="rating" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">التقييمات</TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">النظام</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterNotificationsByType('all').length > 0 ? (
              filterNotificationsByType('all').map(notif => (
                <NotificationCard
                  key={notif.id}
                  notification={notif}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد إشعارات.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="order" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterNotificationsByType('order').length > 0 ? (
              filterNotificationsByType('order').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد إشعارات طلبات.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="message" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterNotificationsByType('message').length > 0 ? (
                filterNotificationsByType('message').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد إشعارات رسائل.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="rating" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterNotificationsByType('rating').length > 0 ? (
                filterNotificationsByType('rating').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد إشعارات تقييمات.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="system" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterNotificationsByType('system').length > 0 ? (
                filterNotificationsByType('system').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد إشعارات نظام.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
    </>
  );
};

export default NotificationsPage;