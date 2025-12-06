import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, User, LayoutList } from 'lucide-react';
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
      <div className="flex">
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
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-8 rounded-xl">
              <CardContent className="p-6">
                <img src={service.images[0]} alt={service.title} className="w-full h-80 object-cover rounded-xl mb-6" />
                <h1 className="text-4xl font-bold mb-4 font-montserrat text-dark-blue">{service.title}</h1>
                <p className="text-gray-700 text-lg mb-6 font-open-sans">{service.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-700">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-light-blue" />
                    <span className="font-semibold">مقدم الخدمة:</span> {service.provider.name}
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">التقييم:</span> {service.rating} ({service.reviewsCount} مراجعة)
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-light-blue" />
                    <span className="font-semibold">وقت التنفيذ:</span> {service.deliveryTime}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-light-blue" />
                    <span className="font-semibold">الموقع:</span> {service.location}
                  </div>
                  <div className="flex items-center">
                    <LayoutList className="h-5 w-5 mr-2 text-light-blue" />
                    <span className="font-semibold">الفئة:</span> {service.category}
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">ماذا تشمل الخدمة؟</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 font-open-sans">
                  {service.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8 rounded-xl">
              <CardHeader>
                <CardTitle className="font-montserrat text-dark-blue">عن مقدم الخدمة</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={service.provider.avatarUrl} alt={service.provider.name} />
                  <AvatarFallback>{service.provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold font-montserrat text-dark-blue">{service.provider.name}</h3>
                  <div className="flex items-center text-sm text-gray-700">
                    {renderStars(service.provider.rating)}
                    <span className="ml-1">({service.provider.rating})</span>
                  </div>
                  <p className="text-sm text-gray-700 font-open-sans">عدد الخدمات المقدمة: {service.provider.totalServices}</p>
                  <Link to={`/provider/${service.provider.id}`} className="text-light-blue hover:underline text-sm mt-1 block">
                    عرض ملف مقدم الخدمة
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="font-montserrat text-dark-blue">التقييمات والمراجعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold mr-2 text-gray-800 font-open-sans">سارة علي</span>
                      {renderStars(5)}
                    </div>
                    <p className="text-gray-700 font-open-sans">خدمة ممتازة وفريق عمل محترف، المنزل أصبح يلمع!</p>
                  </div>
                  <div className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold mr-2 text-gray-800 font-open-sans">خالد فهد</span>
                      {renderStars(4)}
                    </div>
                    <p className="text-gray-700 font-open-sans">تنظيف جيد جداً وسرعة في الاستجابة، شكراً.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="font-montserrat text-dark-blue">اطلب هذه الخدمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-xl font-bold text-dark-blue">
                  <span>السعر:</span>
                  <span className="text-light-blue">${service.price}</span>
                </div>
                <Button className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-2 rounded-lg">
                  اطلب الخدمة الآن
                </Button>
                <Button variant="outline" className="w-full border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
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