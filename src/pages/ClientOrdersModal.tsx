"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientOrderCard from '@/components/ClientOrderCard';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { RequestData, UserData, ServiceData, ClientOrderCardPropsData } from '@/types/app-types'; // Import ServiceData

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ClientOrdersModal = () => {
  const { user } = useAuth();
  const CLIENT_ID = user?.id; // Use actual client ID from auth context

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]); // To get provider names
  const [services, setServices] = useState<ServiceData[]>([]); // To get service prices
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientOrders = useCallback(async () => {
    if (!CLIENT_ID) {
      setLoading(false);
      setError('معرف العميل غير متاح. الرجاء تسجيل الدخول كطالب خدمة.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [requestsResponse, usersResponse, servicesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/requests`),
        fetch(`${API_BASE_URL}/api/users`),
        fetch(`${API_BASE_URL}/api/services`),
      ]);

      if (!requestsResponse.ok) {
        const errorData = await requestsResponse.json();
        throw new Error(errorData.message || 'فشل جلب الطلبات.');
      }
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين.');
      }
      if (!servicesResponse.ok) {
        const errorData = await servicesResponse.json();
        throw new Error(errorData.message || 'فشل جلب الخدمات.');
      }

      const requestsResult = await requestsResponse.json();
      const usersResult = await usersResponse.json();
      const servicesResult = await servicesResponse.json();

      setRequests(requestsResult.data);
      setUsers(usersResult.data);
      setServices(servicesResult.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب طلباتك.');
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID]);

  useEffect(() => {
    fetchClientOrders();
  }, [fetchClientOrders]);

  const mapRequestsToClientOrderCards = (reqs: RequestData[]): ClientOrderCardPropsData[] => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'payment_pending': 'Payment Pending',
    };
    return reqs.map(req => {
      const service = req.service_id ? services.find(s => s.id === req.service_id) : undefined;
      const provider = service ? users.find(u => u.id === service.provider_id) : undefined;

      return {
        id: req.id?.toString() || '',
        serviceTitle: service?.title || req.title, // Use service title if available, else request title
        providerName: provider?.name || 'مقدم خدمة غير معروف',
        status: statusMap[req.status || 'pending'] as ClientOrderCardPropsData['status'],
        date: req.created_at ? new Date(req.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
        price: service?.price || 0, // Use actual service price or 0 as fallback
      };
    });
  };

  const clientRequests = useMemo(() => requests.filter(req => req.client_id === CLIENT_ID), [requests, CLIENT_ID]);

  const pendingOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'pending' || req.status === 'payment_pending')), [clientRequests, users, services]);
  const activeOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'accepted')), [clientRequests, users, services]);
  const completedOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'completed')), [clientRequests, users, services]);
  const cancelledOrders = useMemo(() => mapRequestsToClientOrderCards(clientRequests.filter(req => req.status === 'cancelled')), [clientRequests, users, services]);

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
          <div className="flex-grow overflow-y-auto pr-2">
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