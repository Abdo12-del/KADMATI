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
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">التقارير</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">ملخص الأرباح</CardTitle>
            <Select>
              <SelectTrigger className="w-[180px] rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                <SelectValue placeholder="آخر 30 يومًا" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                <SelectItem value="30-days">آخر 30 يومًا</SelectItem>
                <SelectItem value="90-days">آخر 90 يومًا</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-cairo text-brand-text-dark font-bold mb-2">$12,345</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">+15% عن الشهر الماضي</p>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', direction: 'rtl', right: 0 }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <Bar dataKey="sales" fill="var(--brand-primary)" name="المبيعات" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">عدد الطلبات</CardTitle>
            <Select>
              <SelectTrigger className="w-[180px] rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                <SelectValue placeholder="آخر 30 يومًا" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                <SelectItem value="30-days">آخر 30 يومًا</SelectItem>
                <SelectItem value="90-days">آخر 90 يومًا</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-cairo text-brand-text-dark font-bold mb-2">250</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">+8% عن الشهر الماضي</p>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', direction: 'rtl', right: 0 }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <Line type="monotone" dataKey="orders" stroke="var(--brand-warning)" name="الطلبات" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
        <CardHeader className="p-0 pb-4 text-right">
          <CardTitle className="font-cairo text-brand-text-dark text-2xl">أداء الخدمات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="space-y-4">
            <li className="flex flex-row-reverse justify-between items-center border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="text-right">
                <p className="font-cairo text-brand-text-dark font-semibold">تصميم شعار احترافي</p>
                <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">50 طلب، متوسط تقييم 4.9</p>
              </div>
              <span className="font-bold text-brand-primary text-lg font-cairo">$7,500</span>
            </li>
            <li className="flex flex-row-reverse justify-between items-center border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="text-right">
                <p className="font-cairo text-brand-text-dark font-semibold">تطوير موقع ويب شخصي</p>
                <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">20 طلب، متوسط تقييم 4.7</p>
              </div>
              <span className="font-bold text-brand-primary text-lg font-cairo">$10,000</span>
            </li>
            <li className="flex flex-row-reverse justify-between items-center border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="text-right">
                <p className="font-cairo text-brand-text-dark font-semibold">كتابة محتوى تسويقي</p>
                <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">30 طلب، متوسط تقييم 4.8</p>
              </div>
              <span className="font-bold text-brand-primary text-lg font-cairo">$3,000</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ReportsPage;