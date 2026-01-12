"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TransactionData, RequestData } from '@/types/app-types';
import { ConfirmPaymentDialog } from '@/components/ConfirmPaymentDialog';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrencyArabic } from '@/lib/number-formatter';
import { mockRequests } from '@/lib/mock-data'; // Import mock data

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
      return 'outline';
    default:
      return 'outline';
  }
};

export const ClientPaymentsTab = () => {
  const { user } = useAuth();
  const CLIENT_ID = user?.id;

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!CLIENT_ID) {
      setLoading(false);
      setError('معرف العميل غير متاح. الرجاء تسجيل الدخول كطالب خدمة.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      const clientRequests = mockRequests.filter((req: RequestData) => req.client_id === CLIENT_ID);
      setRequests(clientRequests);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب معاملاتك.');
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleConfirmPayment = async (requestId: string, paymentReference: string, receiptUrl: string) => {
    try {
      // Simulate API call for payment confirmation
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      // Update mock data (in a real app, this would be a backend call)
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id.toString() === requestId
            ? {
                ...req,
                payment_status: 'pending_review',
                payment_reference: paymentReference,
                receipt_url: receiptUrl,
                status: 'payment_pending', // Update request status as well
              }
            : req
        )
      );

      toast.success('تم تأكيد الدفع بنجاح! سيتم مراجعة الوصل من قبل مقدم الخدمة.');
      fetchTransactions(); // Re-fetch to update the list
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تأكيد الدفع.');
      console.error('Error confirming payment:', error);
      throw error;
    }
  };

  const transactions = useMemo(() => {
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

    return requests
      .map(req => ({
        id: req.id?.toString() || '',
        serviceTitle: req.title,
        amount: req.agreed_price || 0,
        date: req.created_at ? new Date(req.created_at).toLocaleDateString('en-US') : 'غير محدد',
        status: statusMap[req.status || 'pending'] as TransactionData['status'],
        paymentStatus: paymentStatusMap[req.payment_status || 'unpaid'] as TransactionData['paymentStatus'],
        method: req.payment_reference ? 'مرجع دفع' : 'غير محدد',
        paymentReference: req.payment_reference,
        receiptUrl: req.receipt_url,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [requests]);

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
          {transactions.length > 0 ? (
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
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">الإجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.serviceTitle}</TableCell>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{formatCurrencyArabic(transaction.amount)}</TableCell>
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
                    <TableCell className="text-right">
                      {transaction.status === 'Accepted' && transaction.paymentStatus === 'Unpaid' && (
                        <ConfirmPaymentDialog requestId={transaction.id} onConfirmPayment={handleConfirmPayment} />
                      )}
                      {transaction.receiptUrl && (transaction.paymentStatus === 'Pending Review' || transaction.paymentStatus === 'Paid') && (
                        <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic">
                            عرض الوصل
                          </Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد معاملات سابقة.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};