import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  // No dummy data needed here, cards will show 0 or empty state
  // Recent activities will be empty until fetched from API
  const latestActivities = []; // Placeholder for fetched activities

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">لوحة التحكم</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-montserrat">الخدمات المقدمة</CardTitle>
              {/* Icon placeholder */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div> {/* Placeholder for actual count */}
              <p className="text-xs text-muted-foreground">لديك 0 خدمات نشطة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-montserrat">الطلبات الجديدة</CardTitle>
              {/* Icon placeholder */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div> {/* Placeholder for actual count */}
              <p className="text-xs text-muted-foreground">0 طلب جديد في انتظار المراجعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-montserrat">التقييمات</CardTitle>
              {/* Icon placeholder */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.0</div> {/* Placeholder for actual rating */}
              <p className="text-xs text-muted-foreground">متوسط تقييماتك</p>
            </CardContent>
          </Card>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">إجراءات سريعة</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/add-service">
              <Button className="bg-sky-blue-light hover:bg-sky-blue-light/90 text-white">
                إضافة خدمة جديدة
              </Button>
            </Link>
            <Link to="/requests">
              <Button variant="outline" className="border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10">
                عرض طلباتي
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10">
                تعديل الملف الشخصي
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 font-montserrat text-gray-800">آخر الأنشطة</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ul className="space-y-4">
              {latestActivities.length > 0 ? (
                latestActivities.map((activity, index) => (
                  <li key={index} className="border-b pb-2 last:border-b-0">
                    <p className="font-semibold">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-600">لا توجد أنشطة حديثة.</li>
              )}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;