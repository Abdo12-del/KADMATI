"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TransactionData } from '@/types/app-types.ts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

// Placeholder data for transactions
const transactions: TransactionData[] = [
  { id: 't1', service: 'تصميم شعار احترافي', amount: 15000, date: '2023-11-01', status: 'Completed', method: 'بطاقة ائتمان' },
  { id: 't2', service: 'تطوير موقع ويب شخصي', amount: 50000, date: '2023-10-25', status: 'Pending', method: 'تحويل بنكي' },
  { id: 't3', service: 'كتابة محتوى تسويقي', amount: 10000, date: '2023-10-15', status: 'Cancelled', method: 'بطاقة ائتمان' },
];

interface PaymentMethod {
  id: string;
  type: string; // e.g., 'Credit Card', 'Bank Transfer'
  details: string; // e.g., '**** **** **** 1234', 'Bank ABC - Account 5678'
}

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAddMethodDialogOpen, setIsAddMethodDialogOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState('');
  const [newMethodDetails, setNewMethodDetails] = useState('');

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