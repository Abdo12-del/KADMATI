"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ClientServiceCard from '@/components/ClientServiceCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { ServiceData, UserData } from '@/types/app-types';
import { formatNumberArabic } from '@/lib/number-formatter'; // Import formatter

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Map category IDs to Arabic names for display
const categoryNamesMap: { [key: string]: string } = {
  'cleaning': 'نظافة',
  'home_maintenance': 'صيانة منزلية',
  'electricity': 'كهرباء',
  'plumbing': 'سباكة',
  'carpentry': 'نجارة',
  'ac_repair': 'تكييف',
  'gardening': 'حدائق',
  'furniture_moving': 'نقل أثاث',
  'beauty': 'تجميل',
  'private_tutoring': 'تعليم خاص',
  'photography': 'تصوير',
  'event_planning': 'تنظيم فعاليات',
  'car_wash': 'غسيل سيارات',
  'legal_consulting': 'استشارات قانونية',
};

const ClientServicesListPage = () => {
  const { user } = useAuth();
  const CLIENT_ID = user?.id;
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

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
        fetch(`${API_BASE_URL}/api/services`),
        fetch(`${API_BASE_URL}/api/users`),
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
      .filter(service => {
        const matchesCategory = !categoryFilter || service.category === categoryFilter;
        const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (service.location && service.location.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
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
  }, [services, users, searchTerm, categoryFilter]);

  const displayCategoryName = categoryFilter ? categoryNamesMap[categoryFilter] || categoryFilter : 'جميع الخدمات';

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
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">
        {displayCategoryName}
      </h1>

      <section className="mb-8">
        <div className="relative max-w-3xl mx-auto">
          <Input
            type="text"
            placeholder="ابحث عن خدمات..."
            className="w-full pr-12 pl-5 py-3 text-lg rounded-2xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-text-muted" />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mappedServices.length > 0 ? (
            mappedServices.map(service => (
              <ClientServiceCard key={service.id} service={service} />
            ))
          ) : (
            <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد خدمات متاحة في هذه الفئة.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default ClientServicesListPage;