import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Heart, Sparkles, Wrench, BookOpen, Palette, Truck, Scissors, LayoutList } from 'lucide-react';
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

const popularServices = [
  { id: 'ps1', title: 'تصميم شعار احترافي', imageUrl: '/placeholder.svg' },
  { id: 'ps2', title: 'تطوير تطبيقات الجوال', imageUrl: '/placeholder.svg' },
  { id: 'ps3', title: 'كتابة محتوى تسويقي', imageUrl: '/placeholder.svg' },
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
    Sparkles: Sparkles,
    Wrench: Wrench,
    BookOpen: BookOpen,
    Palette: Palette,
    Truck: Truck,
    Scissors: Scissors,
  };
  return icons[iconName] || LayoutList; // Default to LayoutList if not found
};

const ClientDashboardOverviewPage = () => {
  return (
    <ClientDashboardLayout>
      <div className="space-y-10">
        {/* Welcome Message */}
        <section className="bg-gradient-to-br from-brand-primary to-brand-primary-light text-white p-10 rounded-2xl shadow-soft-lg text-right">
          <h1 className="text-4xl font-cairo mb-3">أهلاً بك، ليلى!</h1>
          <p className="text-lg font-ibm-plex-arabic">نحن هنا لمساعدتك في العثور على أفضل الخدمات.</p>
        </section>

        {/* Large Search Bar */}
        <section>
          <div className="relative">
            <Input
              type="text"
              placeholder="ابحث عن خدمات، مقدمي خدمات، أو طلبات..."
              className="w-full pr-12 pl-5 py-3 text-lg rounded-2xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-text-muted" />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/client-dashboard/services">
              <Button className="w-full h-32 bg-brand-card-bg text-brand-text-dark rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col items-center justify-center space-y-3 group">
                <Search className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform" />
                <span className="text-lg font-cairo">تصفح الخدمات</span>
              </Button>
            </Link>
            <Link to="/client-dashboard/requests/create">
              <Button className="w-full h-32 bg-brand-card-bg text-brand-text-dark rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col items-center justify-center space-y-3 group">
                <Plus className="h-8 w-8 text-brand-success group-hover:scale-110 transition-transform" />
                <span className="text-lg font-cairo">إنشاء طلب جديد</span>
              </Button>
            </Link>
            <Link to="/client-dashboard/messages">
              <Button className="w-full h-32 bg-brand-card-bg text-brand-text-dark rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col items-center justify-center space-y-3 group relative">
                <MessageSquare className="h-8 w-8 text-brand-warning group-hover:scale-110 transition-transform" />
                <span className="text-lg font-cairo">الرسائل</span>
                <span className="absolute top-4 left-4 h-5 w-5 rounded-full bg-brand-danger flex items-center justify-center text-xs text-white font-ibm-plex-arabic">1</span>
              </Button>
            </Link>
            <Link to="/client-dashboard/favorites">
              <Button className="w-full h-32 bg-brand-card-bg text-brand-text-dark rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 flex flex-col items-center justify-center space-y-3 group">
                <Heart className="h-8 w-8 text-brand-danger group-hover:scale-110 transition-transform" />
                <span className="text-lg font-cairo">المفضلة</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Service Categories Grid */}
        <section>
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">استكشف الفئات</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {serviceCategories.map(category => {
              const IconComponent = getIconComponent(category.icon);
              return (
                <Link key={category.id} to={`/client-dashboard/services?category=${category.id}`}>
                  <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 flex flex-col items-center justify-center text-center space-y-3 group">
                    <IconComponent className="h-10 w-10 text-brand-primary group-hover:scale-110 transition-transform" />
                    <p className="font-cairo text-brand-text-dark text-lg">{category.name}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Popular Services */}
        <section>
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">خدمات شائعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularServices.map(service => (
              <Card key={service.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden">
                <img src={service.imageUrl} alt={service.title} className="w-full h-40 object-cover" />
                <CardContent className="p-4 text-right">
                  <h3 className="text-lg font-cairo text-brand-text-dark mb-2">{service.title}</h3>
                  <Link to={`/client-dashboard/services/${service.id}`}>
                    <Button variant="link" className="p-0 h-auto text-brand-primary hover:text-brand-primary-dark font-ibm-plex-arabic">
                      عرض التفاصيل
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recently Viewed Services */}
        <section>
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الخدمات التي تمت مشاهدتها مؤخرًا</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewedServices.map(service => (
              <Card key={service.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden">
                <img src={service.imageUrl} alt={service.title} className="w-full h-32 object-cover" />
                <CardContent className="p-4 text-right">
                  <h3 className="text-lg font-cairo text-brand-text-dark mb-2">{service.title}</h3>
                  <Link to={`/client-dashboard/services/${service.id}`}>
                    <Button variant="link" className="p-0 h-auto text-brand-primary hover:text-brand-primary-dark font-ibm-plex-arabic">
                      عرض التفاصيل
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Messages List */}
        <section>
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">آخر الرسائل</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentMessages.map(message => (
              <Card key={message.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={message.avatarUrl} alt={message.sender} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{message.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-grow text-right">
                  <p className="font-cairo text-brand-text-dark font-semibold">{message.sender}</p>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{message.content}</p>
                  <p className="text-xs text-brand-text-muted font-ibm-plex-arabic mt-1">{message.time}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientDashboardOverviewPage;