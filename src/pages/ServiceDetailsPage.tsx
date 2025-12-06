import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-8 rounded-2xl shadow-soft-neumorphism bg-soft-white">
              <CardContent className="p-6">
                <img src={service.images[0]} alt={service.title} className="w-full h-80 object-cover rounded-xl mb-6" />
                <h1 className="text-4xl font-bold mb-4 font-montserrat text-dark-blue text-right">{service.title}</h1>
                <p className="text-gray-700 text-lg mb-6 font-inter text-right">{service.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6 text-gray-700 font-inter text-right">
                  <div>
                    <span className="font-semibold">مقدم الخدمة:</span> {service.provider}
                  </div>
                  <div>
                    <span className="font-semibold">التقييم:</span> {service.rating} ({service.reviews} مراجعة)
                  </div>
                  <div>
                    <span className="font-semibold">وقت التسليم:</span> {service.deliveryTime}
                  </div>
                  <div>
                    <span className="font-semibold">الفئة:</span> {service.category}
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue text-right">تفاصيل إضافية</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 font-inter text-right pr-5">
                  <li>تصميم شعار واحد بمفاهيم متعددة.</li>
                  <li>تعديلات غير محدودة حتى الرضا التام.</li>
                  <li>تسليم الملفات المصدرية (AI, EPS, SVG).</li>
                  <li>دعم فني بعد التسليم.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-soft-neumorphism bg-soft-white">
              <CardHeader className="text-right">
                <CardTitle className="font-montserrat text-dark-blue">التقييمات والمراجعات</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="border-b pb-4 last:border-b-0 text-right">
                    <div className="flex items-center justify-end mb-2">
                      <span className="font-semibold ml-2 text-gray-800 font-inter">أحمد علي</span>
                      <span className="text-yellow-500">★★★★★</span>
                    </div>
                    <p className="text-gray-700 font-inter">خدمة ممتازة وشعار رائع، أنصح به بشدة!</p>
                  </div>
                  <div className="border-b pb-4 last:border-b-0 text-right">
                    <div className="flex items-center justify-end mb-2">
                      <span className="font-semibold ml-2 text-gray-800 font-inter">فاطمة سعيد</span>
                      <span className="text-yellow-500">★★★★☆</span>
                    </div>
                    <p className="text-gray-700 font-inter">تصميم جيد جداً وسرعة في التنفيذ، شكراً.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-soft-neumorphism bg-soft-white">
              <CardHeader className="text-right">
                <CardTitle className="font-montserrat text-dark-blue">اطلب هذه الخدمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between items-center text-xl font-bold text-dark-blue font-inter">
                  <span>السعر:</span>
                  <span className="text-light-blue">${service.price}</span>
                </div>
                <Button className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-2 rounded-lg shadow-md">
                  اطلب الخدمة الآن
                </Button>
                <Button variant="outline" className="w-full border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg shadow-md">
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