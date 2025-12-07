import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, Package, Star, Users, MessageSquare, DollarSign, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

// Interfaces for fetched data
interface Service { id: string; providerId: string; title: string; rating: number; reviewsCount: number; }
interface Order { id: string; providerId: string; status: string; price: number; }
interface Message { id: string; conversationId: string; senderId: string; text: string; read: boolean; timestamp: string; }
interface Conversation { id: string; participant1Id: string; participant2Id: string; }
interface User { id: string; name: string; avatarUrl?: string; role: string; }

// Fetching functions
const fetchProviderServices = async (providerId: string): Promise<Service[]> => {
  const response = await fetch(`http://localhost:3000/api/services/provider/${providerId}`);
  if (!response.ok) throw new Error('Failed to fetch services');
  return response.json();
};

const fetchProviderOrders = async (providerId: string): Promise<Order[]> => {
  const response = await fetch(`http://localhost:3000/api/orders/provider/${providerId}`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

const fetchProviderConversations = async (userId: string): Promise<Conversation[]> => {
  const response = await fetch(`http://localhost:3000/api/conversations/user/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
};

const fetchUnreadMessagesCount = async (userId: string): Promise<{ unreadCount: number }> => {
  const response = await fetch(`http://localhost:3000/api/messages/unread/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch unread messages count');
  return response.json();
};

const fetchClients = async (): Promise<User[]> => {
  const response = await fetch('http://localhost:3000/api/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  const users: User[] = await response.json();
  return users.filter(user => user.role === 'seeker');
};


const DashboardOverviewPage = () => {
  // Placeholder for current provider ID - replace with actual auth context
  const currentProviderId = 'provider123';

  const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[], Error>({
    queryKey: ['providerServices', currentProviderId],
    queryFn: () => fetchProviderServices(currentProviderId),
    enabled: !!currentProviderId,
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[], Error>({
    queryKey: ['providerOrders', currentProviderId],
    queryFn: () => fetchProviderOrders(currentProviderId),
    enabled: !!currentProviderId,
  });

  const { data: unreadMessagesData, isLoading: isLoadingUnreadMessages } = useQuery<{ unreadCount: number }, Error>({
    queryKey: ['unreadMessagesCount', currentProviderId],
    queryFn: () => fetchUnreadMessagesCount(currentProviderId),
    enabled: !!currentProviderId,
    refetchInterval: 5000,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<User[], Error>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const totalServices = services.length;
  const totalOrders = orders.length;
  const activeOrders = orders.filter(order => order.status === 'Pending' || order.status === 'Accepted').length;
  const totalEarnings = orders.filter(order => order.status === 'Completed').reduce((sum, order) => sum + order.price, 0);
  const averageRating = totalServices > 0
    ? services.reduce((sum, service) => sum + service.rating, 0) / totalServices
    : 0;
  const totalReviews = services.reduce((sum, service) => sum + service.reviewsCount, 0);
  const unreadMessages = unreadMessagesData?.unreadCount || 0;

  // Placeholder for actual data fetching for charts and recent activity
  // In a real app, these would be fetched from dedicated API endpoints
  const performanceData = []; // Example: [{ name: 'يناير', sales: 4000, orders: 2400 }]
  const ordersBreakdownData = []; // Example: [{ name: 'معلقة', value: 5, color: 'var(--brand-warning)' }]
  const recentTasks = []; // Example: [{ id: 't1', title: 'إكمال تصميم شعار', dueDate: '2024-12-01', status: 'Pending' }]
  const customerMessages = []; // Example: [{ id: 'm1', customerName: 'أحمد', avatarUrl: '', message: 'متى يمكننا البدء؟' }]
  const recentActivity = []; // Example: [{ id: 'a1', description: 'تم قبول طلب جديد', time: 'منذ 5 دقائق', icon: CheckCircle, iconColor: 'text-brand-success' }]

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">نظرة عامة على لوحة التحكم</h1>

      {/* Overview Analytics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">إجمالي الطلبات</CardTitle>
            <Package className="h-6 w-6 text-brand-primary" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{totalOrders}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">+0% عن الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الطلبات النشطة</CardTitle>
            <Clock className="h-6 w-6 text-brand-warning" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{activeOrders}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">0 طلب جديد</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الأرباح</CardTitle>
            <DollarSign className="h-6 w-6 text-brand-success" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">+0% هذا الشهر</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">متوسط التقييم</CardTitle>
            <Star className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{averageRating.toFixed(1)}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">من {totalReviews} تقييم</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الرسائل الجديدة</CardTitle>
            <MessageSquare className="h-6 w-6 text-brand-info" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{unreadMessages}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">في انتظار الرد</p>
          </CardContent>
        </Card>
      </section>

      {/* Performance Line Chart */}
      <section className="mb-10">
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="text-2xl font-cairo text-brand-text-dark">أداء المبيعات والطلبات</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-0">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', direction: 'rtl', right: 0 }} />
                  <Line type="monotone" dataKey="sales" stroke="var(--brand-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="المبيعات" />
                  <Line type="monotone" dataKey="orders" stroke="var(--brand-warning)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="الطلبات" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-brand-text-muted font-ibm-plex-arabic">لا توجد بيانات أداء لعرضها.</div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Orders Status Breakdown */}
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="text-2xl font-cairo text-brand-text-dark">توزيع حالة الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-0">
            {ordersBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersBreakdownData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--brand-text-dark)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} width={80} mirror />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                  <Bar dataKey="value" fill="var(--color)" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-brand-text-muted font-ibm-plex-arabic">لا توجد بيانات لتوزيع الطلبات.</div>
            )}
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="text-2xl font-cairo text-brand-text-dark">المهام</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map(task => (
                  <li key={task.id} className="flex flex-row-reverse items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <div className="flex flex-row-reverse items-center">
                      {task.status === 'Completed' ? (
                        <CheckCircle className="h-5 w-5 text-brand-success ml-3" />
                      ) : (
                        <Clock className="h-5 w-5 text-brand-warning ml-3" />
                      )}
                      <div>
                        <p className="font-cairo text-brand-text-dark font-semibold">{task.title}</p>
                        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">تاريخ الاستحقاق: {task.dueDate}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-brand-primary hover:bg-brand-primary-light/20 rounded-lg font-ibm-plex-arabic">
                      عرض
                    </Button>
                  </li>
                ))
              ) : (
                <li className="text-sm text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد مهام حالية.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Customer Messages Center & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Messages Center */}
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="text-2xl font-cairo text-brand-text-dark">رسائل العملاء</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="space-y-4">
              {customerMessages.length > 0 ? (
                customerMessages.map(msg => (
                  <li key={msg.id} className="flex flex-row-reverse items-center border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <Avatar className="h-10 w-10 ml-3">
                      <AvatarImage src={msg.avatarUrl} alt={msg.customerName} />
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{msg.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow text-right">
                      <p className="font-cairo text-brand-text-dark font-semibold">{msg.customerName}</p>
                      <p className="text-sm text-brand-text-muted font-ibm-plex-arabic line-clamp-1">{msg.message}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-brand-primary hover:bg-brand-primary-light/20 rounded-lg font-ibm-plex-arabic">
                      رد
                    </Button>
                  </li>
                ))
              ) : (
                <li className="text-sm text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد رسائل عملاء جديدة.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity Module */}
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="text-2xl font-cairo text-brand-text-dark">آخر الأنشطة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => {
                  const IconComponent = activity.icon;
                  return (
                    <li key={activity.id} className="flex flex-row-reverse items-center border-b border-border pb-3 last:border-b-0 last:pb-0">
                      <IconComponent className={cn("h-5 w-5 ml-3", activity.iconColor)} />
                      <div className="flex-grow text-right">
                        <p className="font-cairo text-brand-text-dark font-semibold">{activity.description}</p>
                        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">{activity.time}</p>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد أنشطة حديثة.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOverviewPage;