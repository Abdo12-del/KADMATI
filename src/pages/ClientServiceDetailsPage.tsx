import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, User, LayoutList, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ClientServiceDetailsPage = () => {
  // Placeholder data for a service
  const service = {
    id: '1',
    title: 'تنظيف منزلي عميق',
    description: 'خدمة تنظيف شاملة للمنازل والشقق، تشمل جميع الغرف والمطابخ والحمامات. نستخدم أحدث المعدات ومنتجات التنظيف الصديقة للبيئة لضمان بيئة نظيفة وصحية. فريق عمل مدرب وذو خبرة عالية لتقديم أفضل النتائج.',
    price: 250,
    provider: {
      id: 'p1',
      name: 'شركة النظافة السريعة',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS',
      rating: 4.8,
      totalServices: 15,
    },
    rating: 4.8,
    reviewsCount: 55,
    deliveryTime: '4-6 ساعات',
    location: 'الرياض، حي النرجس',
    category: 'نظافة',
    images: ['/placeholder.svg', '/placeholder.svg'], // Using existing placeholder
    details: [
      'تنظيف وتطهير جميع الأسطح',
      'غسيل وتلميع الأرضيات',
      'تنظيف الحمامات والمطابخ بعمق',
      'إزالة الغبار من الأثاث والمفروشات',
      'تنظيف النوافذ من الداخل',
    ],
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex rtl:flex-row-reverse">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <ClientDashboardLayout>
      <main className="flex-grow container mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-brand-card-bg mb-8 rounded-2xl shadow-soft p-6">
              <CardContent className="p-0">
                <img src={service.images[0]} alt={service.title} className="w-full h-80 object-cover rounded-xl mb-6" />
                <h1 className="text-4xl font-cairo text-brand-text-dark mb-4 text-right">{service.title}</h1>
                <p className="text-brand-text-dark text-lg mb-6 font-ibm-plex-arabic text-right">{service.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-brand-text-dark text-right">
                  <div className="flex flex-row-reverse items-center justify-end md:justify-start">
                    <span className="font-semibold ml-2 font-ibm-plex-arabic">مقدم الخدمة:</span>
                    <User className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.provider.name}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end md:justify-start">
                    <span className="font-semibold ml-2 font-ibm-plex-arabic">التقييم:</span>
                    {renderStars(service.rating)}
                    <span className="font-ibm-plex-arabic ml-1">({service.reviewsCount} مراجعة)</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end md:justify-start">
                    <span className="font-semibold ml-2 font-ibm-plex-arabic">وقت التنفيذ:</span>
                    <Clock className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.deliveryTime}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end md:justify-start">
                    <span className="font-semibold ml-2 font-ibm-plex-arabic">الموقع:</span>
                    <MapPin className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.location}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end md:justify-start">
                    <span className="font-semibold ml-2 font-ibm-plex-arabic">الفئة:</span>
                    <LayoutList className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.category}</span>
                  </div>
                </div>

                <h2 className="text-2xl font-cairo text-brand-text-dark mb-4 text-right">ماذا تشمل الخدمة؟</h2>
                <ul className="list-disc list-inside text-brand-text-dark space-y-2 font-ibm-plex-arabic text-right pr-5">
                  {service.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-brand-card-bg mb-8 rounded-2xl shadow-soft p-6">
              <CardHeader className="p-0 pb-4 text-right">
                <CardTitle className="font-cairo text-brand-text-dark text-2xl">عن مقدم الخدمة</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-0">
                <Avatar className="h-16 w-16 ml-4">
                  <AvatarImage src={service.provider.avatarUrl} alt={service.provider.name} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{service.provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <h3 className="text-xl font-cairo text-brand-text-dark font-semibold">{service.provider.name}</h3>
                  <div className="flex flex-row-reverse items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
                    <span className="ml-1">({service.provider.rating})</span>
                    {renderStars(service.provider.rating)}
                  </div>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">عدد الخدمات المقدمة: {service.provider.totalServices}</p>
                  <Link to={`/provider/${service.provider.id}`} className="text-brand-primary hover:underline text-sm mt-1 block font-ibm-plex-arabic">
                    عرض ملف مقدم الخدمة
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6">
              <CardHeader className="p-0 pb-4 text-right">
                <CardTitle className="font-cairo text-brand-text-dark text-2xl">التقييمات والمراجعات</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div className="border-b border-border pb-4 last:border-b-0 text-right">
                    <div className="flex flex-row-reverse items-center justify-end mb-2">
                      <span className="font-semibold ml-2 text-brand-text-dark font-ibm-plex-arabic">سارة علي</span>
                      {renderStars(5)}
                    </div>
                    <p className="text-brand-text-dark font-ibm-plex-arabic">خدمة ممتازة وفريق عمل محترف، المنزل أصبح يلمع!</p>
                  </div>
                  <div className="border-b border-border pb-4 last:border-b-0 text-right">
                    <div className="flex flex-row-reverse items-center justify-end mb-2">
                      <span className="font-semibold ml-2 text-brand-text-dark font-ibm-plex-arabic">خالد فهد</span>
                      {renderStars(4)}
                    </div>
                    <p className="text-brand-text-dark font-ibm-plex-arabic">تنظيف جيد جداً وسرعة في الاستجابة، شكراً.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 text-right">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="font-cairo text-brand-text-dark text-2xl">اطلب هذه الخدمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <div className="flex justify-between items-center text-xl font-bold text-brand-text-dark font-cairo">
                  <span>السعر:</span>
                  <span className="text-brand-primary">${service.price}</span>
                </div>
                <Button className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
                  اطلب الخدمة الآن
                </Button>
                <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                  <MessageSquare className="ml-2 h-5 w-5" />
                  تواصل مع مقدم الخدمة
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ClientDashboardLayout>
  );
};

export default ClientServiceDetailsPage;