import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, Package, Star, Users } from 'lucide-react';

const DashboardOverviewPage = () => {
  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">نظرة عامة على لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الخدمات المقدمة</CardTitle>
            <Briefcase className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">5</div>
            <p className="text-xs text-gray-600 font-open-sans">لديك 5 خدمات نشطة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">الطلبات الجديدة</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">2</div>
            <p className="text-xs text-gray-600 font-open-sans">2 طلب جديد في انتظار المراجعة</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat text-dark-blue">التقييمات</CardTitle>
            <Star className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-dark-blue">4.8</div>
            <p className="text-xs text-gray-600 font-open-sans">متوسط تقييماتك</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
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

      <section>
        <h2 className="text-2xl font-bold mb-4 font-montserrat text-dark-blue">آخر الأنشطة</h2>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <ul className="space-y-4">
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold text-gray-800 font-open-sans">طلب جديد لخدمة "تصميم شعار"</p>
              <p className="text-sm text-gray-600 font-open-sans">من العميل: أحمد محمد - قبل 5 دقائق</p>
            </li>
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold text-gray-800 font-open-sans">تم قبول خدمتك "تطوير موقع ويب"</p>
              <p className="text-sm text-gray-600 font-open-sans">من العميل: سارة علي - قبل ساعة</p>
            </li>
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold text-gray-800 font-open-sans">تقييم جديد لخدمة "كتابة محتوى"</p>
              <p className="text-sm text-gray-600 font-open-sans">بواسطة: خالد فهد - 5 نجوم</p>
            </li>
          </ul>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default DashboardOverviewPage;