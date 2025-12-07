import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RequestCard from '@/components/RequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';

interface Request {
  id: string;
  clientId: string;
  title: string;
  description: string;
  location?: string;
  dueDate?: string;
  additionalOptions?: string;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  createdAt: string;
}

const fetchClientRequests = async (clientId: string): Promise<Request[]> => {
  const response = await fetch(`http://localhost:3000/api/requests/client/${clientId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch client requests');
  }
  return response.json();
};

const MyRequestsPage = () => {
  // Placeholder for current client ID - replace with actual auth context
  const currentClientId = 'client456';

  const { data: requests, isLoading, error } = useQuery<Request[], Error>({
    queryKey: ['clientRequests', currentClientId],
    queryFn: () => fetchClientRequests(currentClientId),
    enabled: !!currentClientId,
    refetchInterval: 5000, // Poll for updates
  });

  const pendingRequests = requests?.filter(req => req.status === 'Pending') || [];
  const acceptedRequests = requests?.filter(req => req.status === 'Accepted') || [];
  const completedRequests = requests?.filter(req => req.status === 'Completed') || [];
  const cancelledRequests = requests?.filter(req => req.status === 'Cancelled') || [];

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <Header />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل الطلبات...
      </main>
      <Footer />
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <Header />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-danger font-ibm-plex-arabic">
        خطأ في تحميل الطلبات: {error.message}
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <Header />
      <main className="flex-grow container mx-auto px-8 py-10">
        <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">طلباتي وخدماتي</h1>

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
              {pendingRequests.length > 0 ? (
                pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات معلقة.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="accepted" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المقبولة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedRequests.length > 0 ? (
                acceptedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مقبولة.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="completed" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات المكتملة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedRequests.length > 0 ? (
                completedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مكتملة.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="cancelled" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات الملغاة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cancelledRequests.length > 0 ? (
                cancelledRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات ملغاة.</p>
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