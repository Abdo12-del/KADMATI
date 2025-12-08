import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RequestCard from '@/components/RequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MyRequestsPage = () => {
  // Placeholder for requests
  const pendingRequests = [
    { id: 'req1', title: 'طلب تصميم موقع شخصي', description: 'أحتاج إلى تصميم موقع ويب شخصي لعرض أعمالي الفنية.', status: 'Pending' as const },
    { id: 'req2', title: 'طلب كتابة مقال تسويقي', description: 'مقال تسويقي عن فوائد استخدام الطاقة المتجددة في المنازل.', status: 'Pending' as const },
  ];
  const completedRequests = [
    { id: 'req3', title: 'تصميم شعار لشركة ناشئة', description: 'شعار احترافي لشركة تقنية جديدة.', status: 'Completed' as const },
  ];
  const offeredServices = [
    { id: 'offer1', title: 'خدمة تصميم واجهات المستخدم', description: 'تصميم واجهات مستخدم جذابة وسهلة الاستخدام لتطبيقات الويب.', status: 'Accepted' as const },
    { id: 'offer2', title: 'خدمة تطوير تطبيقات الجوال', description: 'تطوير تطبيقات جوال أصلية لنظامي iOS و Android.', status: 'Pending' as const },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <Header />
      <main className="flex-grow container mx-auto px-8 py-10">
        <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">طلباتي وخدماتي</h1>

        <Tabs defaultValue="my-requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-brand-background rounded-xl shadow-soft p-2">
            <TabsTrigger value="my-requests" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">طلباتي</TabsTrigger>
            <TabsTrigger value="my-services" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">خدماتي المقدمة</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">السجل</TabsTrigger>
          </TabsList>
          <TabsContent value="my-requests" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات الحالية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.length > 0 ? (
                pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات حالية.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="my-services" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">خدماتي المقدمة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offeredServices.length > 0 ? (
                offeredServices.map(service => (
                  // Reusing RequestCard for simplicity, ideally a ServiceCard for provider
                  <RequestCard key={service.id} request={service} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لم تقم بتقديم أي خدمات بعد.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">سجل الطلبات المكتملة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedRequests.length > 0 ? (
                completedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا يوجد سجل للطلبات المكتملة.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default MyRequestsPage;