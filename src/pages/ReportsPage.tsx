import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Line } from 'recharts';

const data = [
  { name: 'يناير', sales: 4000, orders: 2400 },
  { name: 'فبراير', sales: 3000, orders: 1398 },
  { name: 'مارس', sales: 2000, orders: 9800 },
  { name: 'أبريل', sales: 2780, orders: 3908 },
  { name: 'مايو', sales: 1890, orders: 4800 },
  { name: 'يونيو', sales: 2390, orders: 3800 },
  { name: 'يوليو', sales: 3490, orders: 4300 },
];

const ReportsPage = () => {
  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">التقارير</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-montserrat">ملخص الأرباح</CardTitle>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="آخر 30 يومًا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30-days">آخر 30 يومًا</SelectItem>
                <SelectItem value="90-days">آخر 90 يومًا</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">$12,345</div>
            <p className="text-sm text-muted-foreground">+15% عن الشهر الماضي</p>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Bar dataKey="sales" fill="#5BC0EB" name="المبيعات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-montserrat">عدد الطلبات</CardTitle>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="آخر 30 يومًا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30-days">آخر 30 يومًا</SelectItem>
                <SelectItem value="90-days">آخر 90 يومًا</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">250</div>
            <p className="text-sm text-muted-foreground">+8% عن الشهر الماضي</p>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="orders" stroke="#FF8C00" name="الطلبات" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-montserrat">أداء الخدمات</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li className="flex justify-between items-center border-b pb-2 last:border-b-0">
              <div>
                <p className="font-semibold">تصميم شعار احترافي</p>
                <p className="text-sm text-gray-600">50 طلب، متوسط تقييم 4.9</p>
              </div>
              <span className="font-bold text-sky-blue-light">$7,500</span>
            </li>
            <li className="flex justify-between items-center border-b pb-2 last:border-b-0">
              <div>
                <p className="font-semibold">تطوير موقع ويب شخصي</p>
                <p className="text-sm text-gray-600">20 طلب، متوسط تقييم 4.7</p>
              </div>
              <span className="font-bold text-sky-blue-light">$10,000</span>
            </li>
            <li className="flex justify-between items-center border-b pb-2 last:border-b-0">
              <div>
                <p className="font-semibold">كتابة محتوى تسويقي</p>
                <p className="text-sm text-gray-600">30 طلب، متوسط تقييم 4.8</p>
              </div>
              <span className="font-bold text-sky-blue-light">$3,000</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ReportsPage;