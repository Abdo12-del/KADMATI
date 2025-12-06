import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import ClientOrderCard from '@/components/ClientOrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClientMyOrdersPage = () => {
  // Placeholder for client orders
  const pendingOrders = [
    { id: 'ord1', serviceTitle: 'تنظيف منزلي عميق', providerName: 'شركة النظافة السريعة', status: 'Pending' as const, date: '2023-11-01', price: 250 },
    { id: 'ord2', serviceTitle: 'تصميم داخلي لغرفة معيشة', providerName: 'مهندس الديكور أحمد', status: 'Pending' as const, date: '2023-10-29', price: 1200 },
  ];
  const activeOrders = [
    { id: 'ord3', serviceTitle: 'صيانة مكيفات', providerName: 'فني الصيانة ماهر', status: 'Accepted' as const, date: '2023-10-28', price: 300 },
  ];
  const completedOrders = [
    { id: 'ord4', serviceTitle: 'تركيب كاميرات مراقبة', providerName: 'شركة الأمان', status: 'Completed' as const, date: '2023-10-20', price: 800 },
  ];

  return (
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">طلباتي</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">معلقة</TabsTrigger>
          <TabsTrigger value="active">نشطة</TabsTrigger>
          <TabsTrigger value="completed">مكتملة</TabsTrigger>
          <TabsTrigger value="cancelled">ملغاة</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">الطلبات المعلقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <ClientOrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-gray-600 col-span-full">لا توجد طلبات معلقة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">الطلبات النشطة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <ClientOrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-gray-600 col-span-full">لا توجد طلبات نشطة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">الطلبات المكتملة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedOrders.length > 0 ? (
              completedOrders.map(order => (
                <ClientOrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-gray-600 col-span-full">لا توجد طلبات مكتملة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">الطلبات الملغاة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <p className="text-gray-600 col-span-full">لا توجد طلبات ملغاة.</p>
          </div>
        </TabsContent>
      </Tabs>
    </ClientDashboardLayout>
  );
};

export default ClientMyOrdersPage;