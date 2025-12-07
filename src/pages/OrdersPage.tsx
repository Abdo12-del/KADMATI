import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import OrderCard from '@/components/OrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  customerName: string; // Joined from user table
}

const fetchProviderOrders = async (providerId: string): Promise<Order[]> => {
  const response = await fetch(`http://localhost:3000/api/orders/provider/${providerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch provider orders');
  }
  return response.json();
};

const OrdersPage = () => {
  // Placeholder for current provider ID - replace with actual auth context
  const currentProviderId = 'provider123';

  const { data: orders, isLoading, error } = useQuery<Order[], Error>({
    queryKey: ['providerOrders', currentProviderId],
    queryFn: () => fetchProviderOrders(currentProviderId),
    enabled: !!currentProviderId,
    refetchInterval: 5000, // Poll for updates
  });

  const pendingOrders = orders?.filter(order => order.status === 'Pending') || [];
  const acceptedOrders = orders?.filter(order => order.status === 'Accepted') || [];
  const completedOrders = orders?.filter(order => order.status === 'Completed') || [];
  const cancelledOrders = orders?.filter(order => order.status === 'Cancelled') || [];

  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الطلبات...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل الطلبات: {error.message}</div>
    </DashboardLayout>
  );

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
                <OrderCard key={order.id} order={{
                  id: order.id,
                  serviceTitle: order.serviceTitle,
                  customerName: order.customerName,
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
        <TabsContent value="accepted" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المقبولة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedOrders.length > 0 ? (
              acceptedOrders.map(order => (
                <OrderCard key={order.id} order={{
                  id: order.id,
                  serviceTitle: order.serviceTitle,
                  customerName: order.customerName,
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
        <TabsContent value="completed" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المكتملة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedOrders.length > 0 ? (
              completedOrders.map(order => (
                <OrderCard key={order.id} order={{
                  id: order.id,
                  serviceTitle: order.serviceTitle,
                  customerName: order.customerName,
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
        <TabsContent value="cancelled" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات الملغاة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cancelledOrders.length > 0 ? (
              cancelledOrders.map(order => (
                <OrderCard key={order.id} order={{
                  id: order.id,
                  serviceTitle: order.serviceTitle,
                  customerName: order.customerName,
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
      </Tabs>
    </DashboardLayout>
  );
};

export default OrdersPage;