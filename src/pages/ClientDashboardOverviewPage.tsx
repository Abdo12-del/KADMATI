import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, MessageSquare, Star, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const ordersTrendData = [
  { name: 'يناير', completed: 5, pending: 2 },
  { name: 'فبراير', completed: 7, pending: 3 },
  { name: 'مارس', completed: 6, pending: 1 },
  { name: 'أبريل', completed: 9, pending: 4 },
  { name: 'مايو', completed: 8, pending: 2 },
];

const ClientDashboardOverviewPage = () => {
  return (
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">نظرة عامة على لوحة تحكم العميل</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الطلبات النشطة</CardTitle>
            <div className="flex items-center">
              <ShoppingCart className="h-4 w-4 text-gray-500 mr-1" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-platform-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-platform-orange"></span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">3</div>
            <p className="text-xs text-gray-600 font-open-sans">لديك 3 طلبات قيد التنفيذ</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الخدمات المفضلة</CardTitle>
            <Heart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">7</div>
            <p className="text-xs text-gray-600 font-open-sans">7 خدمات في قائمة المفضلة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">رسائل جديدة</CardTitle>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 text-gray-500 mr-1" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-platform-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-platform-red"></span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">1</div>
            <p className="text-xs text-gray-600 font-open-sans">رسالة جديدة من مقدم خدمة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
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

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">تطور الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersTrendData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                <Line type="monotone" dataKey="completed" stroke="#7ED321" name="مكتملة" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pending" stroke="#F5A623" name="معلقة" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">الخدمات الأكثر طلبًا</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'تنظيف', count: 10 }, { name: 'صيانة', count: 7 }, { name: 'تصميم', count: 5 }]}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                <Bar dataKey="count" fill="#4A90E2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">آخر الأنشطة</h2>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <ul className="space-y-4">
            <li className="flex items-center border-b pb-2 last:border-b-0">
              <ShoppingCart className="h-5 w-5 text-light-blue mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 font-open-sans">تم قبول طلبك لخدمة "تنظيف منزلي"</p>
                <p className="text-sm text-gray-600 font-open-sans">بواسطة: شركة النظافة السريعة - قبل 10 دقائق</p>
              </div>
            </li>
            <li className="flex items-center border-b pb-2 last:border-b-0">
              <MessageSquare className="h-5 w-5 text-platform-orange mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 font-open-sans">رسالة جديدة من "مهندس الديكور أحمد"</p>
                <p className="text-sm text-gray-600 font-open-sans">بخصوص مشروع تصميم داخلي - قبل ساعة</p>
              </div>
            </li>
            <li className="flex items-center border-b pb-2 last:border-b-0">
              <TrendingUp className="h-5 w-5 text-platform-green mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 font-open-sans">تم إكمال خدمتك "صيانة مكيفات"</p>
                <p className="text-sm text-gray-600 font-open-sans">بواسطة: فني الصيانة ماهر - قبل يوم</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </ClientDashboardLayout>
  );
};

export default ClientDashboardOverviewPage;