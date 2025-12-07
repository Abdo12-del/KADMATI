import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import OrderCard from '@/components/OrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OrdersPage = () => {
  // Placeholder for orders - will be fetched from API
  const pendingOrders = [];
  const acceptedOrders = [];
  const completedOrders = [];
  const cancelledOrders = [];

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