"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientOrderCard from '@/components/ClientOrderCard';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Order {
  id: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  price: number;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  details?: string;
  createdAt: string;
  serviceTitle: string; // Joined from service table
  providerName: string; // Joined from user table
}

const fetchClientOrders = async (clientId: string): Promise<Order[]> => {
  const response = await fetch(`http://localhost:3000/api/orders/client/${clientId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch client orders');
  }
  return response.json();
};

const ClientOrdersModal = () => {
  // Placeholder for current client ID - replace with actual auth context
  const currentClientId = 'client456';

  const { data: orders, isLoading, error } = useQuery<Order[], Error>({
    queryKey: ['clientOrders', currentClientId],
    queryFn: () => fetchClientOrders(currentClientId),
    enabled: !!currentClientId,
    refetchInterval: 5000, // Poll for updates
  });

  const pendingOrders = orders?.filter(order => order.status === 'Pending') || [];
  const acceptedOrders = orders?.filter(order => order.status === 'Accepted') || [];
  const completedOrders = orders?.filter(order => order.status === 'Completed') || [];
  const cancelledOrders = orders?.filter(order => order.status === 'Cancelled') || [];

  if (isLoading) return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">طلباتي</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الطلبات...</div>
      </DialogContent>
    </Dialog>
  );

  if (error) return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">طلباتي</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل الطلبات: {error.message}</div>
      </DialogContent>
    </Dialog>
  );

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
            <TabsTrigger value="accepted" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">مقبولة</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">مكتملة</TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">ملغاة</TabsTrigger>
          </TabsList>
          <div className="flex-grow overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar */}
            <TabsContent value="pending" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الطلبات المعلقة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map(order => (
                    <ClientOrderCard key={order.id} order={{
                      id: order.id,
                      serviceTitle: order.serviceTitle,
                      providerName: order.providerName,
                      status: order.status,
                      date: new Date(order.createdAt).toLocaleDateString('ar-EG'),
                      price: order.price,
                    }} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات معلقة.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="accepted" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الطلبات المقبولة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acceptedOrders.length > 0 ? (
                  acceptedOrders.map(order => (
                    <ClientOrderCard key={order.id} order={{
                      id: order.id,
                      serviceTitle: order.serviceTitle,
                      providerName: order.providerName,
                      status: order.status,
                      date: new Date(order.createdAt).toLocaleDateString('ar-EG'),
                      price: order.price,
                    }} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مقبولة.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الطلبات المكتملة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedOrders.length > 0 ? (
                  completedOrders.map(order => (
                    <ClientOrderCard key={order.id} order={{
                      id: order.id,
                      serviceTitle: order.serviceTitle,
                      providerName: order.providerName,
                      status: order.status,
                      date: new Date(order.createdAt).toLocaleDateString('ar-EG'),
                      price: order.price,
                    }} />
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
                    <ClientOrderCard key={order.id} order={{
                      id: order.id,
                      serviceTitle: order.serviceTitle,
                      providerName: order.providerName,
                      status: order.status,
                      date: new Date(order.createdAt).toLocaleDateString('ar-EG'),
                      price: order.price,
                    }} />
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