import React, { useState } from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationCard } from '@/components/notifications/NotificationCard.tsx';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'payment' | 'system' | 'general';
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const response = await fetch(`http://localhost:3000/api/notifications/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
};

const markNotificationAsRead = async (id: string) => {
  const response = await fetch(`http://localhost:3000/api/notifications/read/${id}`, {
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
  return response.json();
};

const deleteNotification = async (id: string) => {
  const response = await fetch(`http://localhost:3000/api/notifications/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
  return response.json();
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  // Placeholder for current user ID - replace with actual auth context
  const currentUserId = 'client456'; // Or 'provider123' depending on context

  const { data: notifications = [], isLoading, error } = useQuery<Notification[], Error>({
    queryKey: ['notifications', currentUserId],
    queryFn: () => fetchNotifications(currentUserId),
    enabled: !!currentUserId,
    refetchInterval: 5000, // Poll for new notifications
  });

  const [searchTerm, setSearchTerm] = useState('');

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', currentUserId] });
      toast.success('تم تمييز الإشعار كمقروء.');
    },
    onError: (err) => {
      toast.error(`فشل في تمييز الإشعار: ${err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount', currentUserId] });
      toast.success('تم حذف الإشعار بنجاح.');
    },
    onError: (err) => {
      toast.error(`فشل في حذف الإشعار: ${err.message}`);
    }
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const filterNotifications = (type: 'all' | Notification['type']) => {
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

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل الإشعارات...
      </main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-danger font-ibm-plex-arabic">
        خطأ في تحميل الإشعارات: {error.message}
      </main>
      <Footer />
    </div>
  );

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
            <TabsTrigger value="payment" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">المدفوعات</TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">النظام</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterNotifications('all').length > 0 ? (
                filterNotifications('all').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={{ ...notif, time: new Date(notif.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }}
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
              {filterNotifications('order').length > 0 ? (
                filterNotifications('order').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={{ ...notif, time: new Date(notif.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }}
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
              {filterNotifications('message').length > 0 ? (
                filterNotifications('message').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={{ ...notif, time: new Date(notif.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد إشعارات رسائل.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="payment" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterNotifications('payment').length > 0 ? (
                filterNotifications('payment').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={{ ...notif, time: new Date(notif.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد إشعارات مدفوعات.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="system" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterNotifications('system').length > 0 ? (
                filterNotifications('system').map(notif => (
                  <NotificationCard
                    key={notif.id}
                    notification={{ ...notif, time: new Date(notif.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }}
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