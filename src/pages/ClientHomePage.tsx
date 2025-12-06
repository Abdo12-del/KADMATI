"use client";

import React from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ClientHomeCategoryScroll } from '@/components/ClientHomeCategoryScroll';
import ClientServiceCard from '@/components/ClientServiceCard'; // إعادة استخدام البطاقة الموجودة

const ClientHomePage = () => {
  // بيانات وهمية للخدمات
  const services = [
    { id: 's1', title: 'تنظيف منزلي عميق', description: 'خدمة تنظيف شاملة للمنازل والشقق، تشمل جميع الغرف والمطابخ والحمامات.', price: 250, providerName: 'شركة النظافة السريعة', rating: 4.8, location: 'الرياض', imageUrl: '/placeholder.svg' },
    { id: 's2', title: 'تصميم داخلي للمنازل', description: 'تصميمات داخلية عصرية ومبتكرة لجميع مساحات منزلك، بأسعار تنافسية.', price: 1200, providerName: 'مهندس الديكور أحمد', rating: 4.9, location: 'جدة', imageUrl: '/placeholder.svg' },
    { id: 's3', title: 'صيانة مكيفات سبليت', description: 'صيانة دورية وإصلاح أعطال المكيفات، لضمان أداء مثالي وتبريد فعال.', price: 300, providerName: 'فني الصيانة ماهر', rating: 4.5, location: 'الدمام', imageUrl: '/placeholder.svg' },
    { id: 's4', title: 'دروس خصوصية في الرياضيات', description: 'دروس تقوية لجميع المراحل الدراسية، مع التركيز على فهم المفاهيم وحل المسائل.', price: 100, providerName: 'الأستاذة سارة', rating: 5.0, location: 'الرياض', imageUrl: '/placeholder.svg' },
    { id: 's5', title: 'تطوير موقع ويب شخصي', description: 'بناء وتطوير مواقع ويب مخصصة تلبي احتياجاتك وتطلعاتك، مع تصميم عصري ومتجاوب.', price: 500, providerName: 'شركة التقنية الحديثة', rating: 4.7, location: 'الخبر', imageUrl: '/placeholder.svg' },
    { id: 's6', title: 'تصميم شعار احترافي', description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعكس هويتك.', price: 150, providerName: 'استوديو الإبداع', rating: 4.9, location: 'مكة المكرمة', imageUrl: '/placeholder.svg' },
  ];

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

        {/* شريط الفئات الطائر */}
        <section className="mb-10">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-4 text-right">استكشف الفئات</h2>
          <ClientHomeCategoryScroll />
        </section>

        {/* قائمة الخدمات */}
        <section>
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الخدمات المتاحة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.length > 0 ? (
              services.map(service => (
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