import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Heart, LayoutList, Sparkles, Wrench, BookOpen, Palette, Truck, Scissors } from 'lucide-react'; // تم تحديث الاستيراد هنا
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Placeholder data
const recentMessages = [
  { id: 'm1', sender: 'شركة النظافة السريعة', content: 'تم تأكيد موعد التنظيف لمنزلك.', time: 'منذ 5 دقائق', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS' },
  { id: 'm2', sender: 'مهندس الديكور أحمد', content: 'هل لديك أي تعديلات على التصميم المقترح؟', time: 'منذ ساعة', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MA' },
];

const recentlyViewedServices = [
  { id: 's1', title: 'تنظيف منزلي عميق', imageUrl: '/placeholder.svg' },
  { id: 's2', title: 'تصميم داخلي للمنازل', imageUrl: '/placeholder.svg' },
  { id: 's3', title: 'صيانة مكيفات سبليت', imageUrl: '/placeholder.svg' },
];

const serviceCategories = [
  { id: 'cat1', name: 'نظافة', icon: 'Sparkles' },
  { id: 'cat2', name: 'صيانة', icon: 'Wrench' },
  { id: 'cat3', name: 'تعليم', icon: 'BookOpen' },
  { id: 'cat4', name: 'تصميم', icon: 'Palette' },
  { id: 'cat5', name: 'نقل', icon: 'Truck' },
  { id: 'cat6', name: 'جمال', icon: 'Scissors' },
];

// Helper to get Lucide icon component
const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: React.ElementType } = {
    Sparkles: Sparkles, // تم التعديل هنا
    Wrench: Wrench,     // تم التعديل هنا
    BookOpen: BookOpen, // تم التعديل هنا
    Palette: Palette,   // تم التعديل هنا
    Truck: Truck,       // تم التعديل هنا
    Scissors: Scissors, // تم التعديل هنا
  };
  return icons[iconName] || LayoutList; // Default to LayoutList if not found
};


const ClientDashboardOverviewPage = () => {
  return (
    <ClientDashboardLayout>
      <div className="bg-light-gray p-8 rounded-2xl shadow-inner min-h-[calc(100vh-200px)]">
        <h1 className="text-4xl font-bold mb-10 font-montserrat text-dark-blue text-right">
          أهلاً بك، ليلى!
        </h1>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 font-montserrat text-dark-blue text-right">
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/client-dashboard/requests/create">
              <Button className="w-full h-24 bg-pastel-blue hover:bg-light-blue text-dark-blue hover:text-white text-lg font-semibold rounded-2xl shadow-soft-neumorphism transition-all duration-300 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-8 w-8" />
                <span>إنشاء طلب جديد</span>
              </Button>
            </Link>
            <Link to="/client-dashboard/services">
              <Button className="w-full h-24 bg-pastel-green hover:bg-platform-green text-dark-blue hover:text-white text-lg font-semibold rounded-2xl shadow-soft-neumorphism transition-all duration-300 flex flex-col items-center justify-center space-y-2">
                <Search className="h-8 w-8" />
                <span>تصفح الخدمات</span>
              </Button>
            </Link>
            <Link to="/client-dashboard/messages">
              <Button className="w-full h-24 bg-pastel-orange hover:bg-platform-orange text-dark-blue hover:text-white text-lg font-semibold rounded-2xl shadow-soft-neumorphism transition-all duration-300 flex flex-col items-center justify-center space-y-2 relative">
                <MessageSquare className="h-8 w-8" />
                <span>الرسائل</span>
                <span className="absolute top-3 right-3 h-4 w-4 bg-platform-red rounded-full flex items-center justify-center text-xs text-white">1</span>
              </Button>
            </Link>
            <Link to="/client-dashboard/favorites">
              <Button className="w-full h-24 bg-soft-white hover:bg-light-gray text-dark-blue text-lg font-semibold rounded-2xl shadow-soft-neumorphism transition-all duration-300 flex flex-col items-center justify-center space-y-2">
                <Heart className="h-8 w-8" />
                <span>المفضلة</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Recent Messages */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 font-montserrat text-dark-blue text-right">
            آخر الرسائل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentMessages.map(message => (
              <Card key={message.id} className="shadow-soft-neumorphism bg-soft-white rounded-2xl p-6 flex items-center space-x-4 rtl:space-x-reverse">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={message.avatarUrl} alt={message.sender} />
                  <AvatarFallback>{message.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-grow text-right">
                  <p className="font-semibold text-dark-blue font-montserrat">{message.sender}</p>
                  <p className="text-sm text-gray-700 font-inter line-clamp-1">{message.content}</p>
                  <p className="text-xs text-gray-500 font-inter mt-1">{message.time}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recently Viewed Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 font-montserrat text-dark-blue text-right">
            الخدمات التي تمت مشاهدتها مؤخرًا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewedServices.map(service => (
              <Card key={service.id} className="shadow-soft-neumorphism bg-soft-white rounded-2xl p-4">
                <img src={service.imageUrl} alt={service.title} className="w-full h-32 object-cover rounded-xl mb-4" />
                <h3 className="text-lg font-semibold font-montserrat text-dark-blue text-right">{service.title}</h3>
                <Link to={`/client-dashboard/services/${service.id}`}>
                  <Button variant="link" className="p-0 h-auto text-light-blue hover:text-dark-blue font-inter text-right">
                    عرض التفاصيل
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Service Categories Grid */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 font-montserrat text-dark-blue text-right">
            استكشف الفئات
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {serviceCategories.map(category => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <Link key={category.id} to={`/client-dashboard/services?category=${category.id}`}>
                  <Card className="shadow-soft-neumorphism bg-soft-white rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 hover:bg-light-gray transition-colors duration-300">
                    <IconComponent className="h-10 w-10 text-light-blue" />
                    <p className="font-semibold text-dark-blue font-montserrat">{category.name}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDashboardOverviewPage;