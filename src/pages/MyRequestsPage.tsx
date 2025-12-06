import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RequestCard from '@/components/RequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MyRequestsPage = () => {
  // Placeholder for requests
  const pendingRequests = [
    { id: 'req1', title: 'طلب تصميم موقع شخصي', status: 'Pending' },
    { id: 'req2', title: 'طلب كتابة مقال تسويقي', status: 'Pending' },
  ];
  const completedRequests = [
    { id: 'req3', title: 'تصميم شعار لشركة ناشئة', status: 'Completed' },
  ];
  const offeredServices = [
    { id: 'offer1', title: 'خدمة تصميم واجهات المستخدم', status: 'Active' },
    { id: 'offer2', title: 'خدمة تطوير تطبيقات الجوال', status: 'Paused' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">طلباتي وخدماتي</h1>

        <Tabs defaultValue="my-requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-light-gray rounded-lg">
            <TabsTrigger value="my-requests" className="data-[state=active]:bg-light-blue data-[state=active]:text-white rounded-lg">طلباتي</TabsTrigger>
            <TabsTrigger value="my-services" className="data-[state=active]:bg-light-blue data-[state=active]:text-white rounded-lg">خدماتي المقدمة</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-light-blue data-[state=active]:text-white rounded-lg">السجل</TabsTrigger>
          </TabsList>
          <TabsContent value="my-requests" className="mt-6">
            <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">الطلبات الحالية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.length > 0 ? (
                pendingRequests.map(request => (
                  <RequestCard key={request.id} />
                ))
              ) : (
                <p className="text-gray-600 col-span-full font-open-sans">لا توجد طلبات حالية.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="my-services" className="mt-6">
            <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">خدماتي المقدمة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offeredServices.length > 0 ? (
                offeredServices.map(service => (
                  <RequestCard key={service.id} />
                ))
              ) : (
                <p className="text-gray-600 col-span-full font-open-sans">لم تقم بتقديم أي خدمات بعد.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">سجل الطلبات المكتملة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedRequests.length > 0 ? (
                completedRequests.map(request => (
                  <RequestCard key={request.id} />
                ))
              ) : (
                <p className="text-gray-600 col-span-full font-open-sans">لا يوجد سجل للطلبات المكتملة.</p>
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