"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Star, MessageSquare, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { RequestData, RatingData, MessageData, UserData, ServiceData } from '@/types/app-types'; // Import all necessary types
import { formatNumberArabic, formatCurrencyArabic } from '@/lib/number-formatter'; // Import formatters

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DashboardOverviewPage = () => {
  const { user } = useAuth();
  const PROVIDER_ID = user?.id;

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  // Removed services state as it's only used for filtering and can be done directly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!PROVIDER_ID) {
      setLoading(false);
      setError('Provider ID not available.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [requestsResponse, ratingsResponse, messagesResponse, usersResponse, servicesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/requests`),
        fetch(`${API_BASE_URL}/api/ratings`),
        fetch(`${API_BASE_URL}/api/messages`),
        fetch(`${API_BASE_URL}/api/users`),
        fetch(`${API_BASE_URL}/api/services`),
      ]);

      if (!requestsResponse.ok) throw new Error('فشل جلب الطلبات.');
      if (!ratingsResponse.ok) throw new Error('فشل جلب التقييمات.');
      if (!messagesResponse.ok) throw new Error('فشل جلب الرسائل.');
      if (!usersResponse.ok) throw new Error('فشل جلب المستخدمين.');
      if (!servicesResponse.ok) throw new Error('فشل جلب الخدمات.');

      const requestsResult: { data: RequestData[] } = await requestsResponse.json();
      const ratingsResult: { data: RatingData[] } = await ratingsResponse.json();
      const messagesResult: { data: MessageData[] } = await messagesResponse.json();
      const usersResult: { data: UserData[] } = await usersResponse.json();
      const servicesResult: { data: ServiceData[] } = await servicesResponse.json();

      // Filter requests relevant to this provider
      const providerRequests = requestsResult.data.filter(req => req.assigned_provider_id === PROVIDER_ID);
      setRequests(providerRequests);

      // Filter ratings for services offered by this provider
      const providerServiceIds = servicesResult.data.filter(s => s.provider_id === PROVIDER_ID).map(s => s.id);
      const providerRatings = ratingsResult.data.filter(r => providerServiceIds.includes(r.service_id));
      setRatings(providerRatings);
      
      setMessages(messagesResult.data);
      setAllUsers(usersResult.data);
      // setServices(servicesResult.data); // Removed from state
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب بيانات لوحة التحكم.');
    } finally {
      setLoading(false);
    }
  }, [PROVIDER_ID]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Analytics Calculations ---
  const totalOrders = requests.length;
  const activeOrders = requests.filter(req => req.status === 'pending' || req.status === 'accepted' || req.status === 'payment_pending').length;
  // Removed completedOrders as it was unused

  const averageRating = useMemo(() => {
    if (ratings.length === 0) return '0.0';
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    return (totalRating / ratings.length).toFixed(1);
  }, [ratings]);

  const newMessagesCount = useMemo(() => {
    return messages.filter(msg => !msg.read && msg.receiver_id === PROVIDER_ID).length;
  }, [messages, PROVIDER_ID]);

  const totalEarnings = useMemo(() => {
    const earnings = requests.filter(req => req.status === 'completed' && req.agreed_price !== undefined)
                              .reduce((sum, req) => sum + (req.agreed_price || 0), 0);
    return formatCurrencyArabic(earnings); // Use formatter
  }, [requests]);

  // --- Dynamic Chart Data ---
  const getMonthlyData = (requests: RequestData[]) => {
    const monthlyDataMap = new Map<string, { sales: number; orders: number }>();
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 6; i++) { // Last 6 months
      const date = new Date(currentYear, new Date().getMonth() - i, 1);
      const monthName = date.toLocaleDateString('ar-EG', { month: 'short' });
      monthlyDataMap.set(monthName, { sales: 0, orders: 0 });
    }

    requests.forEach(req => {
      if (req.created_at) {
        const reqDate = new Date(req.created_at);
        const monthName = reqDate.toLocaleDateString('ar-EG', { month: 'short' });
        if (monthlyDataMap.has(monthName)) {
          const data = monthlyDataMap.get(monthName)!;
          data.orders += 1;
          if (req.status === 'completed' && req.agreed_price !== undefined) {
            data.sales += req.agreed_price;
          }
          monthlyDataMap.set(monthName, data);
        }
      }
    });

    return Array.from(monthlyDataMap.entries())
                .sort((a, b) => new Date(`2000 ${a[0]} 1`).getTime() - new Date(`2000 ${b[0]} 1`).getTime()) // Sort by month
                .map(([name, data]) => ({ name, ...data }));
  };

  const dynamicPerformanceData = useMemo(() => getMonthlyData(requests), [requests]);

  const dynamicOrdersBreakdownData = useMemo(() => {
    const pendingCount = requests.filter(req => req.status === 'pending').length;
    const acceptedCount = requests.filter(req => req.status === 'accepted').length;
    const completedCount = requests.filter(req => req.status === 'completed').length;
    const cancelledCount = requests.filter(req => req.status === 'cancelled').length;

    return [
      { name: 'معلقة', value: pendingCount, color: 'var(--brand-warning)' },
      { name: 'مقبولة', value: acceptedCount, color: 'var(--brand-primary)' },
      { name: 'مكتملة', value: completedCount, color: 'var(--brand-success)' },
      { name: 'ملغاة', value: cancelledCount, color: 'var(--brand-danger)' },
    ];
  }, [requests]);

  // --- Tasks List ---
  const recentTasks = useMemo(() => {
    return requests
      .filter(req => req.status === 'pending' || req.status === 'accepted' || req.status === 'payment_pending')
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 3)
      .map(req => ({
        id: req.id.toString(),
        title: `الرد على طلب خدمة: ${req.title}`,
        status: req.status === 'pending' ? 'Pending' : req.status === 'accepted' ? 'Accepted' : 'Payment Pending',
        dueDate: req.created_at ? new Date(new Date(req.created_at).setDate(new Date(req.created_at).getDate() + 7)).toLocaleDateString('ar-EG') : 'غير محدد',
      }));
  }, [requests]);

  // --- Customer Messages ---
  const customerMessages = useMemo(() => {
    const conversationsMap = new Map<number, MessageData>();
    messages.forEach(msg => {
      if (msg.receiver_id === PROVIDER_ID && msg.sender_id !== PROVIDER_ID) {
        const existingMsg = conversationsMap.get(msg.sender_id);
        if (!existingMsg || (msg.created_at && existingMsg.created_at && new Date(msg.created_at) > new Date(existingMsg.created_at))) {
          conversationsMap.set(msg.sender_id, msg);
        }
      }
    });

    return Array.from(conversationsMap.values())
      .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
      .slice(0, 2)
      .map(msg => {
        const customer = allUsers.find(u => u.id === msg.sender_id);
        return {
          id: msg.id.toString(),
          customerName: customer?.name || 'عميل غير معروف',
          message: msg.text,
          avatarUrl: customer?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${customer?.name?.split(' ').map((n: string) => n[0]).join('') || 'UN'}`,
        };
      });
  }, [messages, allUsers, PROVIDER_ID]);


  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل لوحة التحكم...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">نظرة عامة على لوحة التحكم</h1>

      {/* Overview Analytics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">إجمالي الطلبات</CardTitle>
            <Package className="h-6 w-6 text-brand-primary" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{formatNumberArabic(totalOrders)}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">الطلبات التي قبلتها</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الطلبات النشطة</CardTitle>
            <Clock className="h-6 w-6 text-brand-warning" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{formatNumberArabic(activeOrders)}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">معلقة أو مقبولة</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الأرباح</CardTitle>
            <DollarSign className="h-6 w-6 text-brand-success" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{totalEarnings}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">من الطلبات المكتملة</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">متوسط التقييم</CardTitle>
            <Star className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{formatNumberArabic(parseFloat(averageRating))}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">من {formatNumberArabic(ratings.length)} تقييم</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الرسائل الجديدة</CardTitle>
            <MessageSquare className="h-6 w-6 text-brand-info" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{formatNumberArabic(newMessagesCount)}</div>
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dynamicPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => formatNumberArabic(value)} tick={{ fill: 'var(--brand-text-muted)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number, name: string) => [name === 'المبيعات' ? formatCurrencyArabic(value) : formatNumberArabic(value), name]} contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', direction: 'rtl', right: 0 }} />
                <Line type="monotone" dataKey="sales" stroke="var(--brand-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="المبيعات" />
                <Line type="monotone" dataKey="orders" stroke="var(--brand-warning)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="الطلبات" />
              </LineChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicOrdersBreakdownData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--brand-text-dark)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} width={80} mirror />
                <Tooltip formatter={(value: number) => formatNumberArabic(value)} contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
                <Bar dataKey="value" fill="var(--color)" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                  <li key={task.id} className={cn("flex flex-row-reverse items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0")}>
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
                <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد مهام حاليًا.</p>
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
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{msg.customerName.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
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
                <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد رسائل عملاء جديدة.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Removed Recent Activity Module */}
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="text-2xl font-cairo text-brand-text-dark">آخر الأنشطة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد أنشطة حديثة لعرضها.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardOverviewPage;