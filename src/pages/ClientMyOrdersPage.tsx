import React from 'react';
// تم إزالة استيراد ClientDashboardLayout
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
  const cancelledOrders = [
    { id: 'ord5', serviceTitle: 'تصميم هوية بصرية', providerName: 'محمد سعيد', status: 'Cancelled' as const, date: '2023-10-10', price: 300 },
  ];

  return (
    <div> {/* تم إزالة ClientDashboardLayout */}
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">طلباتي</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-brand-background rounded-xl shadow-soft p-2">
          <TabsTrigger value="pending" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">معلقة</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">نشطة</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">مكتملة</TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">ملغاة</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المعلقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <ClientOrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات معلقة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات النشطة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <ClientOrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات نشطة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المكتملة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedOrders.length > 0 ? (
              completedOrders.map(order => (
                <ClientOrderCard key={order.id} order={order} />
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
                <ClientOrderCard key={order.id} order={order} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات ملغاة.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientMyOrdersPage;