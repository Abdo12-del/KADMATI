import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ServiceCard from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const MyServicesListPage = () => {
  // Placeholder for services
  const services = [
    { id: '1', title: 'تصميم شعار احترافي', description: 'وصف قصير للخدمة...', price: 150 },
    { id: '2', title: 'تطوير موقع ويب شخصي', description: 'وصف قصير للخدمة...', price: 500 },
    { id: '3', title: 'كتابة محتوى تسويقي', description: 'وصف قصير للخدمة...', price: 100 },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold font-montserrat text-dark-blue">خدماتي</h1>
        <Link to="/dashboard/services/add">
          <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg">
            إضافة خدمة جديدة
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Input placeholder="بحث عن خدمة..." className="w-full pl-10 rounded-lg" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-[200px] rounded-lg">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="design">تصميم</SelectItem>
            <SelectItem value="development">تطوير</SelectItem>
            <SelectItem value="writing">كتابة ومحتوى</SelectItem>
            <SelectItem value="marketing">تسويق</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full md:w-[200px] rounded-lg">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">نشطة</SelectItem>
            <SelectItem value="paused">متوقفة</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-light-blue hover:bg-light-blue/90 text-white rounded-lg">
          تطبيق الفلاتر
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length > 0 ? (
          services.map(service => (
            <ServiceCard key={service.id} />
          ))
        ) : (
          <p className="text-gray-600 col-span-full font-open-sans">لم تقم بإضافة أي خدمات بعد.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyServicesListPage;