import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ServiceCard from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const MyServicesListPage = () => {
  // Placeholder for services
  const services = [
    { id: '1', title: 'تصميم شعار احترافي', description: 'وصف قصير للخدمة...', price: 150 },
    { id: '2', title: 'تطوير موقع ويب شخصي', description: 'وصف قصير للخدمة...', price: 500 },
    { id: '3', title: 'كتابة محتوى تسويقي', description: 'وصف قصير للخدمة...', price: 100 },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold font-montserrat text-dark-blue">خدماتي</h1>
        <Link to="/dashboard/services/add">
          <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg">
            إضافة خدمة جديدة
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length > 0 ? (
          services.map(service => (
            <ServiceCard key={service.id} /> // Using the existing ServiceCard
          ))
        ) : (
          <p className="text-gray-600 col-span-full font-open-sans">لم تقم بإضافة أي خدمات بعد.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyServicesListPage;