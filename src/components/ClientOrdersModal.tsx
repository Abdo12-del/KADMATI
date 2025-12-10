"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientOrderCard from '@/components/ClientOrderCard';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface RequestData {
  id: number;
  client_id: number;
  title: string;
  description: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at?: string;
}

interface UserData {
  id: number;
  name: string;
  role: 'seeker' | 'provider';
}

interface ClientOrderCardPropsData {
  id: string;
  serviceTitle: string;
  providerName: string; // Placeholder as request model doesn't directly link to provider
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  date: string;
  price: number; // Placeholder as request model doesn't have price
}

const ClientOrdersModal = () => {
  const CLIENT_ID = 2; // Hardcoded client ID for Laila Seeker
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]); // To potentially get provider names
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestsResponse, usersResponse] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/users'),
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
      toast.error(err.message || 'حدث خطأ أثناء جلب طلباتك.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientOrders();
  }, [fetchClientOrders]);

  const mapRequestsToClientOrderCards = (reqs: RequestData[]): ClientOrderCardPropsData[] => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return reqs.map(req => {
      // In a real app, requests would be linked to a provider_id or service_id to get providerName
      // For now, we'll use a placeholder or try to infer from service if possible
      const providerName = "مقدم خدمة افتراضي"; // Placeholder
      return {
        id: req.id.toString(),
        serviceTitle: req.title,
        providerName: providerName,
        status: statusMap[req.status || 'pending'] as ClientOrderCardPropsData['status'],
        date: req.created_at ? new Date(req.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
        price: 150, // Placeholder: Backend request model does not have a price field
      };
    });
  };

  const clientRequests = useMemo(() => requests.filter(req => req.client_id === CLIENT_ID), [requests]);

  const pendingOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'pending')), [clientRequests, users]);
  const activeOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'accepted')), [clientRequests, users]);
  const completedOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'completed')), [clientRequests, users]);
  const cancelledOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'cancelled')), [clientRequests, users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-text-dark font-ibm-plex-arabic">جاري تحميل طلباتك...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">طلباتي</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6">
        <DialogHeader className="text-right pb-4">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark">طلباتي</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="pending" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-brand-background rounded-xl shadow-soft p-2 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">معلقة</TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">نشطة</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">مكتملة</TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">ملغاة</TabsTrigger>
          </TabsList>
          <div className="flex-grow overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar */}
            <TabsContent value="pending" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الطلبات المعلقة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map(order => (
                    <ClientOrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات معلقة.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="active" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الطلبات النشطة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.length > 0 ? (
                  activeOrders.map(order => (
                    <ClientOrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات نشطة.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الطلبات المكتملة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedOrders.length > 0 ? (
                  completedOrders.map(order => (
                    <ClientOrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مكتملة.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="cancelled" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الطلبات الملغاة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cancelledOrders.length > 0 ? (
                  cancelledOrders.map(order => (
                    <ClientOrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات ملغاة.</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ClientOrdersModal;