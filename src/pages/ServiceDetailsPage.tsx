import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Star, Clock, User, LayoutList, MessageSquare } from 'lucide-react';

const ServiceDetailsPage = () => {
  // Placeholder data for a service
  const service = {
    id: '1',
    title: 'تصميم شعار احترافي',
    description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعكس هويتك.',
    price: 150,
    provider: 'مصمم جرافيك',
    rating: 4.9,
    reviews: 25,
    deliveryTime: '3 أيام',
    category: 'تصميم',
    images: ['/placeholder.svg', '/placeholder.svg'], // Using existing placeholder
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
    <div className="min-h-screen flex flex-col bg-brand-background">
      <Header />
      <main className="flex-grow container mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-brand-card-bg mb-8 rounded-2xl shadow-soft p-6">
              <CardContent className="p-0">
                <img src={service.images[0]} alt={service.title} className="w-full h-80 object-cover rounded-xl mb-6" />
                <h1 className="text-4xl font-cairo text-brand-text-dark mb-4 text-right">{service.title}</h1>
                <p className="text-brand-text-dark text-lg mb-6 font-ibm-plex-arabic text-right">{service.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6 text-brand-text-dark font-ibm-plex-arabic text-right">
                  <div className="flex flex-row-reverse items-center justify-end">
                    <span className="font-semibold ml-2">مقدم الخدمة:</span>
                    <User className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.provider}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end">
                    <span className="font-semibold ml-2">التقييم:</span>
                    {renderStars(service.rating)}
                    <span className="font-ibm-plex-arabic ml-1">({service.reviews} مراجعة)</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end">
                    <span className="font-semibold ml-2">وقت التسليم:</span>
                    <Clock className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.deliveryTime}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-end">
                    <span className="font-semibold ml-2">الفئة:</span>
                    <LayoutList className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.category}</span>
                  </div>
                </div>

                <h2 className="text-2xl font-cairo text-brand-text-dark mb-4 text-right">تفاصيل إضافية</h2>
                <ul className="list-disc list-inside text-brand-text-dark space-y-2 font-ibm-plex-arabic text-right pr-5">
                  <li>تصميم شعار واحد بمفاهيم متعددة.</li>
                  <li>تعديلات غير محدودة حتى الرضا التام.</li>
                  <li>تسليم الملفات المصدرية (AI, EPS, SVG).</li>
                  <li>دعم فني بعد التسليم.</li>
                </ul>
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
                      <span className="font-semibold ml-2 text-brand-text-dark font-ibm-plex-arabic">أحمد علي</span>
                      {renderStars(5)}
                    </div>
                    <p className="text-brand-text-dark font-ibm-plex-arabic">خدمة ممتازة وشعار رائع، أنصح به بشدة!</p>
                  </div>
                  <div className="border-b border-border pb-4 last:border-b-0 text-right">
                    <div className="flex flex-row-reverse items-center justify-end mb-2">
                      <span className="font-semibold ml-2 text-brand-text-dark font-ibm-plex-arabic">فاطمة سعيد</span>
                      {renderStars(4)}
                    </div>
                    <p className="text-brand-text-dark font-ibm-plex-arabic">تصميم جيد جداً وسرعة في التنفيذ، شكراً.</p>
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
      <Footer />
    </div>
  );
};

export default ServiceDetailsPage;