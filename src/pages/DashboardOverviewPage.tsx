import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, Package, Star, Users, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const salesData = [
  { name: 'يناير', sales: 400 },
  { name: 'فبراير', sales: 300 },
  { name: 'مارس', sales: 500 },
  { name: 'أبريل', sales: 450 },
  { name: 'مايو', sales: 600 },
];

const ordersData = [
  { name: 'يناير', orders: 20 },
  { name: 'فبراير', orders: 15 },
  { name: 'مارس', orders: 25 },
  { name: 'أبريل', orders: 22 },
  { name: 'مايو', orders: 30 },
];

const DashboardOverviewPage = () => {
  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">نظرة عامة على لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الخدمات المقدمة</CardTitle>
            <Briefcase className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">5</div>
            <p className="text-xs text-gray-600 font-open-sans">لديك 5 خدمات نشطة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الطلبات الجديدة</CardTitle>
            <div className="flex items-center">
              <Package className="h-4 w-4 text-gray-500 mr-1" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-platform-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-platform-orange"></span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">2</div>
            <p className="text-xs text-gray-600 font-open-sans">2 طلب جديد في انتظار المراجعة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">التقييمات</CardTitle>
            <Star className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">4.8</div>
            <p className="text-xs text-gray-600 font-open-sans">متوسط تقييماتك</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">120</div>
            <p className="text-xs text-gray-600 font-open-sans">إجمالي العملاء الذين تعاملت معهم</p>
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/dashboard/services/add">
            <Button className="bg-light-blue hover:bg-light-blue/90 text-white rounded-lg">
              إضافة خدمة جديدة
            </Button>
          </Link>
          <Link to="/dashboard/orders">
            <Button variant="outline" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
              عرض الطلبات
            </Button>
          </Link>
          <Link to="/dashboard/messages">
            <Button variant="outline" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
              مركز الرسائل
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">ملخص المبيعات</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                <Line type="monotone" dataKey="sales" stroke="#4A90E2" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">عدد الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200" />
                <Bar dataKey="orders" fill="#F5A623" radius={[4, 4, 0, 0]} />
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
              <Package className="h-5 w-5 text-light-blue mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 font-open-sans">طلب جديد لخدمة "تصميم شعار"</p>
                <p className="text-sm text-gray-600 font-open-sans">من العميل: أحمد محمد - قبل 5 دقائق</p>
              </div>
            </li>
            <li className="flex items-center border-b pb-2 last:border-b-0">
              <Briefcase className="h-5 w-5 text-platform-green mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 font-open-sans">تم قبول خدمتك "تطوير موقع ويب"</p>
                <p className="text-sm text-gray-600 font-open-sans">من العميل: سارة علي - قبل ساعة</p>
              </div>
            </li>
            <li className="flex items-center border-b pb-2 last:border-b-0">
              <Star className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 font-open-sans">تقييم جديد لخدمة "كتابة محتوى"</p>
                <p className="text-sm text-gray-600 font-open-sans">بواسطة: خالد فهد - 5 نجوم</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default DashboardOverviewPage;