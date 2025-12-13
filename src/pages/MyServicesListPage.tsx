"use client";

import { useState, useEffect, useCallback } from 'react';
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import ServiceCard from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner'; // Import toast for notifications
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  imageUrl?: string;
  category: string; // Added category for filtering
  status: 'active' | 'paused' | 'draft'; // Added status for filtering
  provider_id: number; // Ensure provider_id is present
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MyServicesListPage = () => {
  const { user } = useAuth(); // Get current user from auth context
  const PROVIDER_ID = user?.id; // Use actual provider ID

  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!PROVIDER_ID) {
      setLoading(false);
      setError('Provider ID not available. Please log in as a provider.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/services`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل جلب الخدمات.');
      }
      const result = await response.json();
      // Filter services by the current provider's ID
      const providerServices = result.data.filter((service: any) => service.provider_id === PROVIDER_ID);

      setServices(providerServices.map((service: any) => ({
        ...service,
        id: service.id.toString(), // Ensure ID is string for key prop
        imageUrl: service.image_url || '/placeholder.svg',
        rating: service.rating || 0,
        status: 'active', // Assuming all fetched services are active for now
      })));
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب الخدمات.');
    } finally {
      setLoading(false);
    }
  }, [PROVIDER_ID]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || service.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الخدمات...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 rtl:space-x-reverse">
        <h1 className="text-4xl font-cairo text-brand-text-dark">خدماتي</h1>
        <Link to="/dashboard/services/add">
          <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg shadow-soft font-ibm-plex-arabic px-5 py-2">
            <Plus className="ml-2 h-5 w-5" />
            إضافة خدمة جديدة
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 rtl:space-x-reverse">
        <div className="relative flex-grow">
          <Input
            placeholder="بحث عن خدمة..."
            className="w-full pr-10 rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
        </div>
        <Select onValueChange={setFilterCategory} defaultValue="all">
          <SelectTrigger className="w-full md:w-[200px] rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
            <SelectItem value="all">كل الفئات</SelectItem>
            <SelectItem value="design">تصميم</SelectItem>
            <SelectItem value="development">تطوير</SelectItem>
            <SelectItem value="writing">كتابة ومحتوى</SelectItem>
            <SelectItem value="marketing">تسويق</SelectItem>
            <SelectItem value="consulting">استشارات</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={setFilterStatus} defaultValue="all">
          <SelectTrigger className="w-full md:w-[200px] rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="active">نشطة</SelectItem>
            <SelectItem value="paused">متوقفة</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
          </SelectContent>
        </Select>
        {/* Removed "تطبيق الفلاتر" button as filters apply on change */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد خدمات مطابقة.</p>
        )}
      </div>
    </>
  );
};

export default MyServicesListPage;