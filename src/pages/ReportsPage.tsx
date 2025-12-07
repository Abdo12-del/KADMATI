import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface Order { id: string; providerId: string; status: string; price: number; createdAt: string; }
interface Service { id: string; providerId: string; title: string; rating: number; reviewsCount: number; }

const fetchProviderOrders = async (providerId: string): Promise<Order[]> => {
  const response = await fetch(`http://localhost:3000/api/orders/provider/${providerId}`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

const fetchProviderServices = async (providerId: string): Promise<Service[]> => {
  const response = await fetch(`http://localhost:3000/api/services/provider/${providerId}`);
  if (!response.ok) throw new Error('Failed to fetch services');
  return response.json();
};

const ReportsPage = () => {
  // Placeholder for current provider ID - replace with actual auth context
  const currentProviderId = 'provider123';

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[], Error>({
    queryKey: ['providerOrdersForReports', currentProviderId],
    queryFn: () => fetchProviderOrders(currentProviderId),
    enabled: !!currentProviderId,
  });

  const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[], Error>({
    queryKey: ['providerServicesForReports', currentProviderId],
    queryFn: () => fetchProviderServices(currentProviderId),
    enabled: !!currentProviderId,
  });

  // Calculate total earnings and orders
  const totalEarnings = orders.filter(order => order.status === 'Completed').reduce((sum, order) => sum + order.price, 0);
  const totalOrders = orders.length;

  // Placeholder for actual data fetching for charts (complex aggregation needed on backend)
  const earningsData = []; // Example: [{ name: 'يناير', sales: 4000 }]
  const ordersCountData = []; // Example: [{ name: 'يناير', orders: 20 }]

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
            <div className="text-4xl font-cairo text-brand-text-dark font-bold mb-2">${totalEarnings.toFixed(2)}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">+0% عن الشهر الماضي</p>
            <div className="h-[200px] mt-4">
              {earningsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsData}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                    <Legend wrapperStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', direction: 'rtl', right: 0 }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <Bar dataKey="sales" fill="var(--brand-primary)" name="المبيعات" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-brand-text-muted font-ibm-plex-arabic">لا توجد بيانات أرباح لعرضها.</div>
              )}
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
            <div className="text-4xl font-cairo text-brand-text-dark font-bold">{totalOrders}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">+0% عن الشهر الماضي</p>
            <div className="h-[200px] mt-4">
              {ordersCountData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersCountData}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                    <Legend wrapperStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', direction: 'rtl', right: 0 }} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <Line type="monotone" dataKey="orders" stroke="var(--brand-warning)" name="الطلبات" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-brand-text-muted font-ibm-plex-arabic">لا توجد بيانات طلبات لعرضها.</div>
              )}
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
            {isLoadingServices ? (
              <li className="text-sm text-brand-text-muted font-ibm-plex-arabic text-right">جاري تحميل أداء الخدمات...</li>
            ) : services.length > 0 ? (
              services.map((service) => (
                <li key={service.id} className="flex flex-row-reverse justify-between items-center border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <div className="text-right">
                    <p className="font-cairo text-brand-text-dark font-semibold">{service.title}</p>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">
                      {orders.filter(order => order.serviceId === service.id && order.status === 'Completed').length} طلب مكتمل،
                      متوسط تقييم {service.rating.toFixed(1)}
                    </p>
                  </div>
                  <span className="font-bold text-brand-primary text-lg font-cairo">
                    ${orders.filter(order => order.serviceId === service.id && order.status === 'Completed').reduce((sum, order) => sum + order.price, 0).toFixed(2)}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد بيانات أداء للخدمات.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ReportsPage;