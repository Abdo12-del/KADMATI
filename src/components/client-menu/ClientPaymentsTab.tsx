"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TransactionData, RequestData, ServiceData } from '@/types/app-types.ts'; // Import RequestData and ServiceData
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface PaymentMethod {
  id: string;
  type: string; // e.g., 'Credit Card', 'Bank Transfer'
  details: string; // e.g., '**** **** **** 1234', 'Bank ABC - Account 5678'
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Paid':
      return 'default';
    case 'Pending':
    case 'Pending Review':
    case 'Payment Pending':
      return 'secondary';
    case 'Cancelled':
    case 'Rejected':
      return 'destructive';
    case 'Accepted':
      return 'outline'; // Or another suitable variant
    default:
      return 'outline';
  }
};

export const ClientPaymentsTab = () => {
  const { user } = useAuth();
  const CLIENT_ID = user?.id;

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAddMethodDialogOpen, setIsAddMethodDialogOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState('');
  const [newMethodDetails, setNewMethodDetails] = useState('');

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchTransactionsData = useCallback(async () => {
    if (!CLIENT_ID) {
      setLoading(false);
      setError('معرف العميل غير متاح. الرجاء تسجيل الدخول كطالب خدمة.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [requestsResponse, servicesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/requests`),
        fetch(`${API_BASE_URL}/api/services`),
      ]);

      if (!requestsResponse.ok) {
        const errorData = await requestsResponse.json();
        throw new Error(errorData.message || 'فشل جلب الطلبات.');
      }
      if (!servicesResponse.ok) {
        const errorData = await servicesResponse.json();
        throw new Error(errorData.message || 'فشل جلب الخدمات.');
      }

      const requestsResult: { data: RequestData[] } = await requestsResponse.json();
      const servicesResult: { data: ServiceData[] } = await servicesResponse.json();

      setRequests(requestsResult.data.filter(req => req.client_id === CLIENT_ID));
      setServices(servicesResult.data);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب بيانات المعاملات.');
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID, API_BASE_URL]);

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  const mappedTransactions: TransactionData[] = useMemo(() => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'payment_pending': 'Payment Pending',
    };
    const paymentStatusMap = {
      'unpaid': 'Unpaid',
      'pending_review': 'Pending Review',
      'paid': 'Paid',
      'rejected': 'Rejected',
    };

    return requests.map(req => {
      // Find the service associated with the request to get its price and title
      // For now, assuming request title is service title and a dummy price if not found
      const service = services.find(s => s.title === req.title); // This is a weak link, ideally requests would have service_id
      const amount = service?.price || 0; // Use service price, or 0 if not found

      return {
        id: req.id?.toString() || '',
        serviceTitle: req.title,
        amount: amount,
        date: req.created_at ? new Date(req.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
        status: statusMap[req.status || 'pending'] as TransactionData['status'],
        paymentStatus: paymentStatusMap[req.payment_status || 'unpaid'] as TransactionData['paymentStatus'],
        method: req.payment_reference ? 'مرجع دفع' : 'غير محدد', // Placeholder for method
        paymentReference: req.payment_reference,
        receiptUrl: req.receipt_url,
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent
  }, [requests, services]);


  const handleAddPaymentMethod = () => {
    if (!newMethodType || !newMethodDetails) {
      toast.error('الرجاء إدخال نوع وتفاصيل طريقة الدفع.');
      return;
    }

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: newMethodType,
      details: newMethodDetails,
    };

    setPaymentMethods(prev => [...prev, newMethod]);
    toast.success('تم إضافة طريقة الدفع بنجاح (محاكاة)!');
    setNewMethodType('');
    setNewMethodDetails('');
    setIsAddMethodDialogOpen(false);
  };

  if (loading) {
    return (
      <p className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل بيانات الدفع...</p>
    );
  }

  if (error) {
    return (
      <p className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</p>
    );
  }

  return (
    <>
      <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 mb-6">
        <CardHeader className="p-0 pb-4 text-right">
          <CardTitle className="font-cairo text-brand-text-dark text-2xl">سجل المعاملات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {mappedTransactions.length > 0 ? (
            <Table className="text-right">
              <TableCaption className="font-ibm-plex-arabic text-right">قائمة بجميع معاملاتك السابقة.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">الخدمة</TableHead>
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">المبلغ</TableHead>
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">التاريخ</TableHead>
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">الحالة</TableHead>
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">حالة الدفع</TableHead>
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">مرجع الدفع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedTransactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.serviceTitle}</TableCell>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.amount} د.ج</TableCell>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.date}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="rounded-md font-ibm-plex-arabic">
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusBadgeVariant(transaction.paymentStatus)} className="rounded-md font-ibm-plex-arabic">
                        {transaction.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.paymentReference || 'لا يوجد'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد معاملات سابقة.</p>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-soft bg-brand-background p-6 mt-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="font-cairo text-brand-text-dark text-2xl">طرق الدفع</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          {paymentMethods.length > 0 ? (
            <ul className="space-y-2">
              {paymentMethods.map(method => (
                <li key={method.id} className="flex justify-between items-center text-brand-text-dark font-ibm-plex-arabic border-b border-border pb-2 last:border-b-0">
                  <span>{method.type}</span>
                  <span>{method.details}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-brand-text-muted font-ibm-plex-arabic">لا توجد طرق دفع محفوظة حاليًا.</p>
          )}
          <Dialog open={isAddMethodDialogOpen} onOpenChange={setIsAddMethodDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                <Plus className="ml-2 h-4 w-4" />
                إضافة طريقة دفع جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">إضافة طريقة دفع</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="method-type" className="text-brand-text-dark font-ibm-plex-arabic">نوع الطريقة</Label>
                  <Input
                    id="method-type"
                    placeholder="مثال: بطاقة ائتمان، تحويل بنكي"
                    value={newMethodType}
                    onChange={(e) => setNewMethodType(e.target.value)}
                    className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="method-details" className="text-brand-text-dark font-ibm-plex-arabic">التفاصيل</Label>
                  <Input
                    id="method-details"
                    placeholder="مثال: **** **** **** 1234"
                    value={newMethodDetails}
                    onChange={(e) => setNewMethodDetails(e.target.value)}
                    className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-row-reverse justify-start gap-3">
                <Button type="submit" onClick={handleAddPaymentMethod} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                  إضافة
                </Button>
                <Button variant="outline" onClick={() => setIsAddMethodDialogOpen(false)} className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                  إلغاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
};