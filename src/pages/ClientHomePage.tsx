"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import ClientHomeHeader from '@/components/ClientHomeHeader'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ClientHomeCategoryScroll } from '@/components/ClientHomeCategoryScroll';
import ClientServiceCard from '@/components/ClientServiceCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface ServiceData {
  id: number;
  provider_id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  delivery_time?: number;
  image_url?: string;
  rating?: number;
  reviews_count?: number;
  location?: string;
  service_level?: string;
}

interface UserData {
  id: number;
  name: string;
}

interface ClientServiceCardPropsData {
  id: string;
  title: string;
  description: string;
  price: number;
  providerName: string;
  rating: number;
  location: string;
  imageUrl?: string;
}

const ClientHomePage = () => {
  const { user } = useAuth(); // Get current user from auth context
  const CLIENT_ID = user?.id; // Use actual client ID

  const [services, setServices] = useState<ServiceData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!CLIENT_ID) {
      setLoading(false);
      setError('Client ID not available. Please log in as a seeker.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [servicesResponse, usersResponse] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/users'),
      ]);

      if (!servicesResponse.ok) {
        const errorData = await servicesResponse.json();
        throw new Error(errorData.message || 'فشل جلب الخدمات.');
      }
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين.');
      }

      const servicesResult = await servicesResponse.json();
      const usersResult = await usersResponse.json();

      setServices(servicesResult.data);
      setUsers(usersResult.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب الخدمات.');
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const mappedServices = useMemo(() => {
    return services
      .filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.location && service.location.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(service => {
        const provider = users.find(user => user.id === service.provider_id);
        return {
          id: service.id.toString(),
          title: service.title,
          description: service.description,
          price: service.price,
          providerName: provider?.name || 'مقدم خدمة غير معروف',
          rating: service.rating || 0,
          location: service.location || 'غير محدد',
          imageUrl: service.image_url || '/placeholder.svg',
        };
      });
  }, [services, users, searchTerm]);

  if (loading) {
    return (
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل الخدمات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-brand-danger font-ibm-plex-arabic">
        خطأ: {error}
      </div>
    );
  }

  return (
    <>
      {/* حقل البحث */}
      <section className="mb-8">
        <div className="relative max-w-3xl mx-auto">
          <Input
            type="text"
            placeholder="ابحث عن خدمات، مقدمي خدمات، أو طلبات..."
            className="w-full pr-12 pl-5 py-3 text-lg rounded-2xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          {mappedServices.length > 0 ? (
            mappedServices.map(service => (
              <ClientServiceCard key={service.id} service={service} />
            ))
          ) : (
            <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد خدمات متاحة حاليًا.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default ClientHomePage;