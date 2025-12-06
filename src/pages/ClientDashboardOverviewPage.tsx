import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, MessageSquare, Star } from 'lucide-react';

const ClientDashboardOverviewPage = () => {
  return (
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">نظرة عامة على لوحة تحكم العميل</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الطلبات النشطة</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">3</div>
            <p className="text-xs text-gray-600 font-open-sans">لديك 3 طلبات قيد التنفيذ</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الخدمات المفضلة</CardTitle>
            <Heart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">7</div>
            <p className="text-xs text-gray-600 font-open-sans">7 خدمات في قائمة المفضلة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">رسائل جديدة</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">1</div>
            <p className="text-xs text-gray-600 font-open-sans">رسالة جديدة من مقدم خدمة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">التقييمات المعلقة</CardTitle>
            <Star className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">2</div>
            <p className="text-xs text-gray-600 font-open-sans">2 خدمة تنتظر تقييمك</p>
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/client-dashboard/services">
            <Button className="bg-light-blue hover:bg-light-blue/90 text-white rounded-lg">
              تصفح الخدمات
            </Button>
          </Link>
          <Link to="/client-dashboard/orders">
            <Button variant="outline" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
              عرض طلباتي
            </Button>
          </Link>
          <Link to="/client-dashboard/messages">
            <Button variant="outline" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
              مركز الرسائل
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">آخر الأنشطة</h2>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <ul className="space-y-4">
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold text-gray-800 font-open-sans">تم قبول طلبك لخدمة "تنظيف منزلي"</p>
              <p className="text-sm text-gray-600 font-open-sans">بواسطة: شركة النظافة السريعة - قبل 10 دقائق</p>
            </li>
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold text-gray-800 font-open-sans">رسالة جديدة من "مهندس الديكور أحمد"</p>
              <p className="text-sm text-gray-600 font-open-sans">بخصوص مشروع تصميم داخلي - قبل ساعة</p>
            </li>
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold text-gray-800 font-open-sans">تم إكمال خدمتك "صيانة مكيفات"</p>
              <p className="text-sm text-gray-600 font-open-sans">بواسطة: فني الصيانة ماهر - قبل يوم</p>
            </li>
          </ul>
        </div>
      </section>
    </ClientDashboardLayout>
  );
};

export default ClientDashboardOverviewPage;