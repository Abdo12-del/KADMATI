"use client";

import React from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ClientHomeCategoryScroll } from '@/components/ClientHomeCategoryScroll';
import ClientServiceCard from '@/components/ClientServiceCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  imageUrl?: string;
  reviewsCount: number;
  providerId: string;
}

interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface ClientServiceCardProps {
  service: Service & { providerName: string }; // Combine service with providerName
}

const fetchAllServices = async (): Promise<Service[]> => {
  const response = await fetch('http://localhost:3000/api/services');
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
};

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`http://localhost:3000/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

const ClientHomePage = () => {
  const { data: services, isLoading, error } = useQuery<Service[], Error>({
    queryKey: ['allServices'],
    queryFn: fetchAllServices,
  });

  const [servicesWithProviderNames, setServicesWithProviderNames] = React.useState<ClientServiceCardProps['service'][]>([]);

  React.useEffect(() => {
    const getProviderNames = async () => {
      if (services) {
        const servicesWithNames = await Promise.all(
          services.map(async (service) => {
            const provider = await fetchUserProfile(service.providerId);
            return {
              ...service,
              providerName: provider?.name || 'مقدم خدمة مجهول',
              location: 'غير محدد', // Placeholder as location is not in service model
            };
          })
        );
        setServicesWithProviderNames(servicesWithNames);
      }
    };
    getProviderNames();
  }, [services]);

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل الخدمات...
      </main>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-danger font-ibm-plex-arabic">
        خطأ في تحميل الخدمات: {error.message}
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10">
        {/* حقل البحث */}
        <section className="mb-8">
          <div className="relative max-w-3xl mx-auto">
            <Input
              type="text"
              placeholder="ابحث عن خدمات، مقدمي خدمات، أو طلبات..."
              className="w-full pr-12 pl-5 py-3 text-lg rounded-2xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-text-muted" />
          </div>
        </section>

        {/* زر إضافة طلب خدمة جديد */}
        <section className="mb-10 text-center">
          <Link to="/client-home/create-request">
            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white text-lg px-8 py-4 rounded-2xl shadow-soft font-cairo">
              أضف طلب خدمة جديد
            </Button>
          </Link>
        </section>

        {/* شريط الفئات الطائر */}
        <section className="mb-10">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-4 text-right">استكشف الفئات</h2>
          <ClientHomeCategoryScroll />
        </section>

        {/* قائمة الخدمات */}
        <section>
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الخدمات المتاحة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesWithProviderNames.length > 0 ? (
              servicesWithProviderNames.map(service => (
                <ClientServiceCard key={service.id} service={service} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد خدمات متاحة حاليًا.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ClientHomePage;