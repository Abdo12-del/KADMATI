"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, Package, Star, Users, MessageSquare, DollarSign, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface RequestData {
  id: number;
  client_id: number;
  title: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at?: string;
}

interface RatingData {
  id: number;
  service_id: number;
  client_id: number;
  rating: number;
}

interface MessageData {
  id: number;
  sender_id: number;
  receiver_id: number;
  conversation_id: string;
  text: string;
  read?: boolean;
  created_at?: string;
}

interface UserData {
  id: number;
  name: string;
  avatar_url?: string;
  role: 'seeker' | 'provider';
}

const performanceData = [
  { name: 'يناير', sales: 4000, orders: 2400 },
  { name: 'فبراير', sales: 3000, orders: 1398 },
  { name: 'مارس', sales: 2000, orders: 9800 },
  { name: 'أبريل', sales: 2780, orders: 3908 },
  { name: 'مايو', sales: 1890, orders: 4800 },
  { name: 'يونيو', sales: 2390, orders: 3800 },
];

const ordersBreakdownData = [
  { name: 'معلقة', value: 15, color: 'var(--brand-warning)' },
  { name: 'مقبولة', value: 30, color: 'var(--brand-primary)' },
  { name: 'مكتملة', value: 55, color: 'var(--brand-success)' },
  { name: 'ملغاة', value: 10, color: 'var(--brand-danger)' },
];

const DashboardOverviewPage = () => {
  const { user } = useAuth(); // Get current user from auth context
  const PROVIDER_ID = user?.id; // Use actual provider ID

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]); // Renamed to avoid conflict with 'user' from auth context
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
      const [requestsResponse, ratingsResponse, messagesResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:3000/api/requests'),
        fetch('http://localhost:3000/api/ratings'),
        fetch('http://localhost:3000/api/messages'),
        fetch('http://localhost:3000/api/users'),
      ]);

      if (!requestsResponse.ok) throw new Error('فشل جلب الطلبات.');
      if (!ratingsResponse.ok) throw new Error('فشل جلب التقييمات.');
      if (!messagesResponse.ok) throw new Error('فشل جلب الرسائل.');
      if (!usersResponse.ok) throw new Error('فشل جلب المستخدمين.');

      const requestsResult = await requestsResponse.json();
      const ratingsResult = await ratingsResponse.json();
      const messagesResult = await messagesResponse.json();
      const usersResult = await usersResponse.json();

      setRequests(requestsResult.data);
      setRatings(ratingsResult.data);
      setMessages(messagesResult.data);
      setAllUsers(usersResult.data);

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
  const activeOrders = requests.filter(req => req.status === 'pending' || req.status === 'accepted').length;
  const completedOrders = requests.filter(req => req.status === 'completed').length;

  const averageRating = useMemo(() => {
    if (ratings.length === 0) return 0;
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    return (totalRating / ratings.length).toFixed(1);
  }, [ratings]);

  const newMessagesCount = useMemo(() => {
    return messages.filter(msg => !msg.read && msg.receiver_id === PROVIDER_ID).length;
  }, [messages, PROVIDER_ID]);

  // Placeholder for earnings, as request model doesn't have price
  const totalEarnings = useMemo(() => {
    // In a real app, this would sum prices of completed services/requests
    return (completedOrders * 150).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); // Assuming avg $150 per completed order
  }, [completedOrders]);

  // --- Tasks List ---
  const recentTasks = useMemo(() => {
    return requests
      .filter(req => req.status === 'pending' || req.status === 'accepted')
      .slice(0, 3) // Show up to 3 recent tasks
      .map(req => ({
        id: req.id.toString(),
        title: `الرد على طلب خدمة: ${req.title}`,
        status: req.status === 'pending' ? 'Pending' : 'Accepted',
        dueDate: req.created_at ? new Date(new Date(req.created_at).setDate(new Date(req.created_at).getDate() + 7)).toLocaleDateString('ar-EG') : 'غير محدد', // Due in 7 days from creation
      }));
  }, [requests]);

  // --- Customer Messages ---
  const customerMessages = useMemo(() => {
    const conversationsMap = new Map<number, MessageData>(); // Map client_id to latest message
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
      .slice(0, 2) // Show up to 2 recent messages
      .map(msg => {
        const customer = allUsers.find(u => u.id === msg.sender_id);
        return {
          id: msg.id.toString(),
          customerName: customer?.name || 'عميل غير معروف',
          message: msg.text,
          avatarUrl: customer?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${customer?.name.split(' ').map(n => n[0]).join('') || 'UN'}`,
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
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{totalOrders}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">+10% عن الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الطلبات النشطة</CardTitle>
            <Clock className="h-6 w-6 text-brand-warning" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{activeOrders}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">3 طلبات جديدة</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الأرباح</CardTitle>
            <DollarSign className="h-6 w-6 text-brand-success" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{totalEarnings}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">+5% هذا الشهر</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">متوسط التقييم</CardTitle>
            <Star className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{averageRating}</div>
            <p className="text-sm text-brand-text-muted font-ibm-plex-arabic mt-1">من {ratings.length} تقييم</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6 text-right">
          <CardHeader className="flex flex-row-reverse items-center justify-between p-0 pb-3">
            <CardTitle className="text-lg font-cairo text-brand-text-dark">الرسائل الجديدة</CardTitle>
            <MessageSquare className="h-6 w-6 text-brand-info" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-cairo text-brand-text-dark font-bold">{newMessagesCount}</div>
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
              <BarChart data={ordersBreakdownData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--brand-text-dark)', fontFamily: 'var(--font-ibm-plex-arabic)' }} axisLine={false} tickLine={false} width={80} mirror />
                <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card-bg)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-soft)' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-arabic)', color: 'var(--brand-text-dark)' }} labelStyle={{ fontFamily: 'var(--font-cairo)', color: 'var(--brand-primary)' }} />
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