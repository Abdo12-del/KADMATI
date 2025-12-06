import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import OrderCard from '@/components/OrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OrdersPage = () => {
  // Placeholder for orders
  const pendingOrders = [
    { id: 'ord1', serviceTitle: 'تصميم شعار', customerName: 'أحمد محمد', status: 'Pending' as const, date: '2023-10-26', price: 150 },
    { id: 'ord2', serviceTitle: 'كتابة مقال', customerName: 'سارة علي', status: 'Pending' as const, date: '2023-10-25', price: 80 },
  ];
  const acceptedOrders = [
    { id: 'ord3', serviceTitle: 'تطوير موقع', customerName: 'خالد فهد', status: 'Accepted' as const, date: '2023-10-20', price: 500 },
  ];
  const completedOrders = [
    { id: 'ord4', serviceTitle: 'استشارة تسويقية', customerName: 'ليلى ناصر', status: 'Completed' as const, date: '2023-10-15', price: 200 },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">الطلبات</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
          <TabsTrigger value="pending">معلقة</TabsTrigger>
          <TabsTrigger value="accepted">مقبولة</TabsTrigger>
          <TabsTrigger value="completed">مكتملة</TabsTrigger>
          <TabsTrigger value="cancelled">ملغاة</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">الطلبات المعلقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-gray-600 col-span-full">لا توجد طلبات معلقة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="accepted" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">الطلبات المقبولة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedOrders.length > 0 ? (
              acceptedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-gray-600 col-span-full">لا توجد طلبات مقبولة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">الطلبات المكتملة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedOrders.length > 0 ? (
              completedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
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
    </DashboardLayout>
  );
};

export default OrdersPage;