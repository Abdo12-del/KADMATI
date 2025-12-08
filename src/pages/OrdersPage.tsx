"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import OrderCard from '@/components/OrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface RequestData {
  id: number;
  client_id: number;
  title: string;
  description: string;
  category?: string;
  location?: string;
  due_date?: string;
  additional_options?: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  avatar_url?: string;
}

interface OrderCardPropsData {
  id: string;
  serviceTitle: string;
  customerName: string;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  date: string;
  price: number; // Placeholder as backend request model doesn't have price
}

const OrdersPage = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestsResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:3000/api/requests'),
        fetch('http://localhost:3000/api/users'),
      ]);

      if (!requestsResponse.ok) {
        const errorData = await requestsResponse.json();
        throw new Error(errorData.message || 'فشل جلب الطلبات.');
      }
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين.');
      }

      const requestsResult = await requestsResponse.json();
      const usersResult = await usersResponse.json();

      setRequests(requestsResult.data);
      setUsers(usersResult.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب البيانات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const mapRequestsToOrderCards = (reqs: RequestData[]): OrderCardPropsData[] => {
    return reqs.map(req => {
      const customer = users.find(user => user.id === req.client_id);
      const statusMap = {
        'pending': 'Pending',
        'accepted': 'Accepted',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
      };
      return {
        id: req.id.toString(),
        serviceTitle: req.title,
        customerName: customer?.name || 'عميل غير معروف',
        status: statusMap[req.status || 'pending'] as OrderCardPropsData['status'],
        date: req.created_at ? new Date(req.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
        price: 150, // Placeholder: Backend request model does not have a price field
      };
    });
  };

  const pendingOrders = useMemo(() => mapRequestsToOrderCards(requests.filter(req => req.status === 'pending')), [requests, users]);
  const acceptedOrders = useMemo(() => mapRequestsToOrderCards(requests.filter(req => req.status === 'accepted')), [requests, users]);
  const completedOrders = useMemo(() => mapRequestsToOrderCards(requests.filter(req => req.status === 'completed')), [requests, users]);
  const cancelledOrders = useMemo(() => mapRequestsToOrderCards(requests.filter(req => req.status === 'cancelled')), [requests, users]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الطلبات...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">الطلبات</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-brand-background rounded-xl shadow-soft p-2">
          <TabsTrigger value="pending" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">معلقة</TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">مقبولة</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">مكتملة</TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">ملغاة</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المعلقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات معلقة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="accepted" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المقبولة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedOrders.length > 0 ? (
              acceptedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مقبولة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المكتملة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedOrders.length > 0 ? (
              completedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مكتملة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات الملغاة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cancelledOrders.length > 0 ? (
              cancelledOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات ملغاة.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default OrdersPage;