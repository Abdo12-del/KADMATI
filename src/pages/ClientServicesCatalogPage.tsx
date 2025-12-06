import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import ClientServiceCard from '@/components/ClientServiceCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const ClientServicesCatalogPage = () => {
  // Placeholder for services
  const services = [
    { id: 's1', title: 'تنظيف منزلي عميق', description: 'خدمة تنظيف شاملة للمنازل والشقق، تشمل جميع الغرف والمطابخ والحمامات.', price: 250, providerName: 'شركة النظافة السريعة', rating: 4.8, location: 'الرياض', imageUrl: '/placeholder.svg' },
    { id: 's2', title: 'تصميم داخلي للمنازل', description: 'تصميمات داخلية عصرية ومبتكرة لجميع مساحات منزلك، بأسعار تنافسية.', price: 1200, providerName: 'مهندس الديكور أحمد', rating: 4.9, location: 'جدة', imageUrl: '/placeholder.svg' },
    { id: 's3', title: 'صيانة مكيفات سبليت', description: 'صيانة دورية وإصلاح أعطال المكيفات، لضمان أداء مثالي وتبريد فعال.', price: 300, providerName: 'فني الصيانة ماهر', rating: 4.5, location: 'الدمام', imageUrl: '/placeholder.svg' },
    { id: 's4', title: 'دروس خصوصية في الرياضيات', description: 'دروس تقوية لجميع المراحل الدراسية، مع التركيز على فهم المفاهيم وحل المسائل.', price: 100, providerName: 'الأستاذة سارة', rating: 5.0, location: 'الرياض', imageUrl: '/placeholder.svg' },
  ];

  return (
    <ClientDashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">كتالوج الخدمات</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8 rtl:space-x-reverse">
        <div className="relative flex-grow">
          <Input placeholder="ابحث عن خدمة..." className="w-full pr-10 rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-[200px] rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
            <SelectItem value="cleaning">نظافة</SelectItem>
            <SelectItem value="maintenance">صيانة</SelectItem>
            <SelectItem value="education">تعليم</SelectItem>
            <SelectItem value="design">تصميم</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full md:w-[200px] rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
            <SelectValue placeholder="الموقع" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
            <SelectItem value="riyadh">الرياض</SelectItem>
            <SelectItem value="jeddah">جدة</SelectItem>
            <SelectItem value="dammam">الدمام</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg shadow-soft font-ibm-plex-arabic px-5 py-2">
          تطبيق الفلاتر
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length > 0 ? (
          services.map(service => (
            <ClientServiceCard key={service.id} service={service} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد خدمات متاحة حاليًا.</p>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientServicesCatalogPage;