"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, CalendarDays, MessageSquare, CheckCircle, XCircle, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { RequestData, UserData } from '@/types/app-types';
import { mockUsers } from '@/lib/mock-data'; // Keep mockUsers for client details if not fetched from backend
import { formatCurrencyArabic } from '@/lib/number-formatter';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProviderOrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const PROVIDER_ID = user?.id;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [client, setClient] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!PROVIDER_ID) {
      setLoading(false);
      setError('معرف مقدم الخدمة غير متاح. الرجاء تسجيل الدخول كمقدم خدمة.');
      return;
    }
    if (!id) {
      setLoading(false);
      setError('معرف الطلب غير متوفر.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch request details from the backend API
      const requestResponse = await fetch(`${API_BASE_URL}/api/requests/${id}`);
      if (!requestResponse.ok) {
        const errorData = await requestResponse.json();
        throw new Error(errorData.message || 'فشل جلب تفاصيل الطلب.');
      }
      const requestResult = await requestResponse.json();
      const fetchedRequest: RequestData = requestResult.data;

      // Verify if the fetched request is actually assigned to the current provider
      if (fetchedRequest.assigned_provider_id !== PROVIDER_ID) {
        throw new Error('الطلب غير موجود أو ليس مخصصًا لك.');
      }
      setRequest(fetchedRequest);

      // Fetch client details from the backend API
      const clientResponse = await fetch(`${API_BASE_URL}/api/users/${fetchedRequest.client_id}`);
      if (!clientResponse.ok) {
        const errorData = await clientResponse.json();
        throw new Error(errorData.message || 'فشل جلب معلومات العميل.');
      }
      const clientResult = await clientResponse.json();
      setClient(clientResult.data);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب تفاصيل الطلب.');
    } finally {
      setLoading(false);
    }
  }, [id, PROVIDER_ID]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleMarkAsCompleted = async () => {
    if (!request) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تحديث حالة الطلب.');
      }
      toast.success('تم وضع علامة "مكتمل" على الطلب بنجاح!');
      fetchOrderDetails(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحديث حالة الطلب.');
      console.error('Error marking as completed:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!request) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إلغاء الطلب.');
      }
      toast.success('تم إلغاء الطلب بنجاح!');
      fetchOrderDetails(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إلغاء الطلب.');
      console.error('Error cancelling order:', err);
    }
  };

  const handleReviewPayment = () => {
    toast.info('سيتم فتح نافذة لمراجعة الدفع (وظيفة وهمية)!');
    console.log('Review payment clicked for request:', request?.id);
  };

  const handleContactClient = () => {
    toast.info(`سيتم فتح نافذة محادثة مع ${client?.name || 'العميل'} (وظيفة وهمية)!`);
    console.log('Contact client clicked for request:', request?.id);
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل تفاصيل الطلب...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
    );
  }

  if (!request || !client) {
    return (
      <div className="text-center py-10 text-brand-text-muted font-ibm-plex-arabic">الطلب غير موجود أو لا تملك صلاحية الوصول إليه.</div>
    );
  }

  const getStatusColor = (status: RequestData['status']) => {
    switch (status) {
      case 'pending':
        return 'text-brand-warning';
      case 'accepted':
        return 'text-brand-primary';
      case 'completed':
        return 'text-brand-success';
      case 'cancelled':
        return 'text-brand-danger';
      case 'payment_pending':
        return 'text-brand-info';
      default:
        return 'text-brand-text-muted';
    }
  };

  const getPaymentStatusText = (status: RequestData['payment_status']) => {
    switch (status) {
      case 'unpaid': return 'غير مدفوع';
      case 'pending_review': return 'بانتظار المراجعة';
      case 'paid': return 'مدفوع';
      case 'rejected': return 'مرفوض';
      default: return 'غير محدد';
    }
  };

  return (
    <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-3xl mx-auto text-right">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">تفاصيل الطلب</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-3xl font-cairo text-brand-text-dark text-center">{request.title}</h2>
          <p className={`text-lg font-ibm-plex-arabic ${getStatusColor(request.status)}`}>الحالة: {request.status === 'pending' ? 'معلق' : request.status === 'accepted' ? 'مقبول' : request.status === 'completed' ? 'مكتمل' : request.status === 'cancelled' ? 'ملغى' : 'بانتظار الدفع'}</p>
        </div>

        <Separator className="my-6 bg-border" />

        <div className="space-y-4 text-brand-text-dark font-ibm-plex-arabic">
          <p className="text-lg leading-relaxed">{request.description}</p>
          {request.category && (
            <div className="flex flex-row-reverse items-center">
              <MapPin className="ml-2 h-5 w-5 text-brand-primary" />
              <span>الفئة: {request.category}</span>
            </div>
          )}
          {request.location && (
            <div className="flex flex-row-reverse items-center">
              <MapPin className="ml-2 h-5 w-5 text-brand-primary" />
              <span>الموقع: {request.location}</span>
            </div>
          )}
          {request.due_date && (
            <div className="flex flex-row-reverse items-center">
              <CalendarDays className="ml-2 h-5 w-5 text-brand-primary" />
              <span>الموعد المتوقع: {new Date(request.due_date).toLocaleDateString('ar-EG')}</span>
            </div>
          )}
          {request.additional_options && (
            <div>
              <p className="font-semibold mt-4">خيارات إضافية:</p>
              <p>{request.additional_options}</p>
            </div>
          )}
          {request.agreed_price !== undefined && (
            <div className="flex justify-between items-center mt-4">
              <span className="font-semibold">السعر المتفق عليه:</span>
              <span className="text-brand-primary font-bold text-xl">{formatCurrencyArabic(request.agreed_price)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="font-semibold">حالة الدفع:</span>
            <span className="text-brand-text-dark">{getPaymentStatusText(request.payment_status)}</span>
          </div>
          {request.payment_reference && (
            <div className="flex justify-between items-center">
              <span className="font-semibold">مرجع الدفع:</span>
              <span>{request.payment_reference}</span>
            </div>
          )}
          {request.receipt_url && (
            <div className="flex justify-between items-center">
              <span className="font-semibold">وصل الدفع:</span>
              <a href={request.receipt_url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline flex items-center">
                عرض الوصل <ReceiptText className="mr-1 h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        <Separator className="my-6 bg-border" />

        <div className="space-y-4 text-brand-text-dark font-ibm-plex-arabic">
          <h3 className="text-xl font-cairo text-brand-text-dark">معلومات العميل</h3>
          <div className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${client.name.split(' ').map(n => n[0]).join('')}`} alt={client.name} />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-cairo text-lg text-brand-text-dark font-semibold">{client.name}</p>
              <p className="text-sm text-brand-text-muted">{client.email}</p>
              <p className="text-sm text-brand-text-muted">{client.phone}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-4 mt-8">
          {request.status === 'accepted' && request.payment_status === 'pending_review' && (
            <Button onClick={handleReviewPayment} className="bg-brand-info hover:bg-brand-info/90 text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
              مراجعة الدفع
            </Button>
          )}
          {request.status === 'accepted' && request.payment_status === 'paid' && (
            <Button onClick={handleMarkAsCompleted} className="bg-brand-success hover:bg-brand-success/90 text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
              <CheckCircle className="ml-2 h-5 w-5" />
              وضع علامة "مكتمل"
            </Button>
          )}
          {(request.status === 'pending' || request.status === 'accepted') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-brand-danger hover:bg-brand-danger/90 text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
                  <XCircle className="ml-2 h-5 w-5" />
                  إلغاء الطلب
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-cairo text-brand-text-dark text-2xl">هل أنت متأكد من إلغاء الطلب؟</AlertDialogTitle>
                  <AlertDialogDescription className="font-ibm-plex-arabic text-brand-text-muted">
                    سيؤدي هذا الإجراء إلى إلغاء الطلب. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row-reverse justify-start gap-3">
                  <AlertDialogAction onClick={handleCancelOrder} className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-xl shadow-soft font-ibm-plex-arabic">
                    نعم، إلغاء الطلب
                  </AlertDialogAction>
                  <AlertDialogCancel className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic">
                    إلغاء
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handleContactClient} variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            <MessageSquare className="ml-2 h-5 w-5" />
            التواصل مع العميل
          </Button>
          <Button onClick={() => navigate(-1)} variant="secondary" className="bg-brand-background hover:bg-brand-background/80 text-brand-text-dark rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            العودة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderOrderDetailsPage;