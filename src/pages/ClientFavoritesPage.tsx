import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import ClientServiceCard from '@/components/ClientServiceCard';
import ProviderCard from '@/components/ProviderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClientFavoritesPage = () => {
  // Placeholder for favorite services and providers
  const favoriteServices = [
    { id: 's1', title: 'تنظيف منزلي عميق', description: 'خدمة تنظيف شاملة للمنازل والشقق.', price: 250, providerName: 'شركة النظافة السريعة', rating: 4.8, location: 'الرياض', imageUrl: '/placeholder.svg' },
    { id: 's2', title: 'تصميم داخلي للمنازل', description: 'تصميمات داخلية عصرية ومبتكرة.', price: 1200, providerName: 'مهندس الديكور أحمد', rating: 4.9, location: 'جدة', imageUrl: '/placeholder.svg' },
  ];

  const favoriteProviders = [
    { id: 'p1', name: 'شركة النظافة السريعة', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS', rating: 4.8, serviceCount: 15 },
    { id: 'p2', name: 'فني الصيانة ماهر', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FM', rating: 4.5, serviceCount: 8 },
  ];

  return (
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">المفضلة</h1>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-light-gray rounded-lg">
          <TabsTrigger value="services" className="data-[state=active]:bg-light-blue data-[state=active]:text-white rounded-lg">الخدمات المفضلة</TabsTrigger>
          <TabsTrigger value="providers" className="data-[state=active]:bg-light-blue data-[state=active]:text-white rounded-lg">مقدمو الخدمات المفضلون</TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">خدماتي المفضلة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteServices.length > 0 ? (
              favoriteServices.map(service => (
                <ClientServiceCard key={service.id} service={service} />
              ))
            ) : (
              <p className="text-gray-600 col-span-full font-open-sans">لا توجد خدمات في قائمة المفضلة.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="providers" className="mt-6">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">مقدمو الخدمات المفضلون</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProviders.length > 0 ? (
              favoriteProviders.map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))
            ) : (
              <p className="text-gray-600 col-span-full font-open-sans">لا يوجد مقدمو خدمات في قائمة المفضلة.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ClientDashboardLayout>
  );
};

export default ClientFavoritesPage;