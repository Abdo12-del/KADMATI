"use client";

// import React from 'react'; // Removed
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TransactionData } from '@/types/app-types.ts';

// Placeholder data for transactions
const transactions: TransactionData[] = [
  { id: 't1', service: 'تصميم شعار احترافي', amount: 15000, date: '2023-11-01', status: 'Completed', method: 'بطاقة ائتمان' },
  { id: 't2', service: 'تطوير موقع ويب شخصي', amount: 50000, date: '2023-10-25', status: 'Pending', method: 'تحويل بنكي' },
  { id: 't3', service: 'كتابة محتوى تسويقي', amount: 10000, date: '2023-10-15', status: 'Cancelled', method: 'بطاقة ائتمان' },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const ClientPaymentsTab = () => {
  const handleAddPaymentMethod = () => {
    toast.info('وظيفة إضافة طريقة دفع جديدة قيد التطوير (وظيفة وهمية)!');
    console.log('Add payment method clicked');
  };

  return (
    <>
      <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6">
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
                  <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">طريقة الدفع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.service}</TableCell>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.amount} د.ج</TableCell>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.date}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="rounded-md font-ibm-plex-arabic">
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{transaction.method}</TableCell>
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
          <p className="text-brand-text-muted font-ibm-plex-arabic">لا توجد طرق دفع محفوظة حاليًا.</p>
          <Button onClick={handleAddPaymentMethod} variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            إضافة طريقة دفع جديدة
          </Button>
        </CardContent>
      </Card>
    </>
  );
};