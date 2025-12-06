import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, Package, Star, Users } from 'lucide-react';

const DashboardOverviewPage = () => {
  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">نظرة عامة على لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat">الخدمات المقدمة</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">لديك 5 خدمات نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat">الطلبات الجديدة</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">2 طلب جديد في انتظار المراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat">التقييمات</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">متوسط تقييماتك</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-montserrat">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-muted-foreground">إجمالي العملاء الذين تعاملت معهم</p>
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/dashboard/services/add">
            <Button className="bg-sky-blue-light hover:bg-sky-blue-light/90 text-white">
              إضافة خدمة جديدة
            </Button>
          </Link>
          <Link to="/dashboard/orders">
            <Button variant="outline" className="border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10">
              عرض الطلبات
            </Button>
          </Link>
          <Link to="/dashboard/messages">
            <Button variant="outline" className="border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10">
              مركز الرسائل
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">آخر الأنشطة</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ul className="space-y-4">
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold">طلب جديد لخدمة "تصميم شعار"</p>
              <p className="text-sm text-gray-600">من العميل: أحمد محمد - قبل 5 دقائق</p>
            </li>
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold">تم قبول خدمتك "تطوير موقع ويب"</p>
              <p className="text-sm text-gray-600">من العميل: سارة علي - قبل ساعة</p>
            </li>
            <li className="border-b pb-2 last:border-b-0">
              <p className="font-semibold">تقييم جديد لخدمة "كتابة محتوى"</p>
              <p className="text-sm text-gray-600">بواسطة: خالد فهد - 5 نجوم</p>
            </li>
          </ul>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default DashboardOverviewPage;