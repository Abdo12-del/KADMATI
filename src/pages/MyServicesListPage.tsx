import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ServiceCard from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';

const MyServicesListPage = () => {
  // Placeholder for services
  const services = [
    { id: '1', title: 'تصميم شعار احترافي', description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعكس هويتك.', price: 150, rating: 4.9, imageUrl: '/placeholder.svg' },
    { id: '2', title: 'تطوير موقع ويب شخصي', description: 'بناء وتطوير مواقع ويب مخصصة تلبي احتياجاتك وتطلعاتك، مع تصميم عصري ومتجاوب.', price: 500, rating: 4.7, imageUrl: '/placeholder.svg' },
    { id: '3', title: 'كتابة محتوى تسويقي', description: 'كتابة محتوى جذاب ومقنع لمدوناتك، مواقعك، أو حملاتك التسويقية، لزيادة تفاعل الجمهور.', price: 100, rating: 4.8, imageUrl: '/placeholder.svg' },
  ];

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
          <Input placeholder="بحث عن خدمة..." className="w-full pr-10 rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-[200px] rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
            <SelectItem value="design">تصميم</SelectItem>
            <SelectItem value="development">تطوير</SelectItem>
            <SelectItem value="writing">كتابة ومحتوى</SelectItem>
            <SelectItem value="marketing">تسويق</SelectItem>
          </SelectContent>
        </Select>
        <Select>
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
        {services.length > 0 ? (
          services.map(service => (
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