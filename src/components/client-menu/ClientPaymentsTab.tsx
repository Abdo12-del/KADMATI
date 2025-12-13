"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TransactionData } from '@/types/app-types.ts';
import { ConfirmPaymentDialog } from '@/components/ConfirmPaymentDialog'; // Import ConfirmPaymentDialog
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

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
  const CLIENT_ID = user?.id; // Still useful for conditional rendering if needed, but not for fetching mock data

  // Mock data for transactions
  const [transactions, setTransactions] = useState<TransactionData[]>([
    {
      id: 'req-1',
      serviceTitle: 'تصميم شعار احترافي',
      amount: 15000,
      date: '2023-11-01',
      status: 'Pending',
      paymentStatus: 'Unpaid',
      method: 'تحويل بنكي',
      paymentReference: undefined,
      receiptUrl: undefined,
    },
    {
      id: 'req-2',
      serviceTitle: 'تطوير موقع ويب شخصي',
      amount: 50000,
      date: '2023-10-25',
      status: 'Payment Pending',
      paymentStatus: 'Pending Review',
      method: 'مرجع دفع',
      paymentReference: 'REF123456',
      receiptUrl: 'https://example.com/receipts/receipt-123.pdf',
    },
    {
      id: 'req-3',
      serviceTitle: 'كتابة محتوى تسويقي',
      amount: 10000,
      date: '2023-10-15',
      status: 'Completed',
      paymentStatus: 'Paid',
      method: 'بطاقة ائتمان',
      paymentReference: 'CARD7890',
      receiptUrl: 'https://example.com/receipts/receipt-456.jpg',
    },
    {
      id: 'req-4',
      serviceTitle: 'صيانة منزلية',
      amount: 7500,
      date: '2023-09-30',
      status: 'Cancelled',
      paymentStatus: 'Rejected',
      method: 'نقداً',
      paymentReference: undefined,
      receiptUrl: undefined,
    },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); // Sort by most recent

  // Mock handleConfirmPayment function
  const handleConfirmPayment = async (requestId: string, paymentReference: string, receiptUrl: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setTransactions(prevTransactions =>
      prevTransactions.map(transaction =>
        transaction.id === requestId
          ? {
              ...transaction,
              status: 'Payment Pending',
              paymentStatus: 'Pending Review',
              paymentReference: paymentReference,
              receiptUrl: receiptUrl,
            }
          : transaction
      )
    );
    toast.success('تم تأكيد الدفع بنجاح! سيتم مراجعة الوصل من قبل مقدم الخدمة (محاكاة).');
  };

  // No loading or error states needed for mock data
  const loading = false;
  const error = null;

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
                    <TableCell className="text-right">
                      {transaction.status === 'Pending' && transaction.paymentStatus === 'Unpaid' && (
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