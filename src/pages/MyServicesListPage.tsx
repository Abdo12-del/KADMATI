import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ServiceCard from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  imageUrl?: string;
  reviewsCount: number;
  providerId: string; // Assuming a providerId is available
  category: string; // Added category property
}

const fetchServices = async (): Promise<Service[]> => {
  // In a real app, you'd get the providerId from auth context
  const dummyProviderId = 'provider123'; // Placeholder for current provider
  const response = await fetch(`http://localhost:3000/api/services/provider/${dummyProviderId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
};

const MyServicesListPage = () => {
  const { data: services, isLoading, error } = useQuery<Service[], Error>({
    queryKey: ['providerServices'],
    queryFn: fetchServices,
  });

  // Placeholder for filtering/searching logic (can be implemented later)
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('active');

  const filteredServices = services?.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    // Status filtering would require a 'status' field in the service model
    // For now, we'll just return all fetched services if no status filter is applied
    return matchesSearch && matchesCategory;
  }) || [];


  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الخدمات...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل الخدمات: {error.message}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
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
        <Select onValueChange={setFilterStatus} defaultValue="active">
          <SelectTrigger className="w-full md:w-[200px] rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
            <SelectItem value="active">نشطة</SelectItem>
            <SelectItem value="paused">متوقفة</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg shadow-soft font-ibm-plex-arabic px-5 py-2">
          تطبيق الفلاتر
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لم تقم بإضافة أي خدمات بعد.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyServicesListPage;