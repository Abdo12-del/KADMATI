"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationCard } from '@/components/notifications/NotificationCard.tsx';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
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
  link?: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      <div className="min-h-screen flex flex-col bg-brand-background">
        <ClientHomeHeader />
        <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-dark font-ibm-plex-arabic">
          جاري تحميل الإشعارات...
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-background">
        <ClientHomeHeader />
        <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-danger font-ibm-plex-arabic">
          خطأ: {error}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10">
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
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;