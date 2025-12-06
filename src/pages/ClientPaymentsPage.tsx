import React from 'react';
// تم إزالة استيراد ClientDashboardLayout
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ClientPaymentsPage = () => {
  // Placeholder for transactions
  const transactions = [
    { id: 't1', service: 'تنظيف منزلي عميق', amount: 250, date: '2023-11-01', status: 'Completed', method: 'بطاقة ائتمان' },
    { id: 't2', service: 'صيانة مكيفات سبليت', amount: 300, date: '2023-10-28', status: 'Completed', method: 'Apple Pay' },
    { id: 't3', service: 'تصميم داخلي لغرفة معيشة', amount: 1200, date: '2023-10-29', status: 'Pending', method: 'تحويل بنكي' },
    { id: 't4', service: 'دروس خصوصية في الرياضيات', amount: 100, date: '2023-10-25', status: 'Completed', method: 'بطاقة مدى' },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default'; // Assuming default is green/success
      case 'Pending':
        return 'secondary'; // Assuming secondary is orange/warning
      case 'Cancelled':
        return 'destructive'; // Assuming destructive is red/danger
      default:
        return 'outline';
    }
  };

  return (
    <div> {/* تم إزالة ClientDashboardLayout */}
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">الدفع والمعاملات</h1>

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
                    <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">${transaction.amount}</TableCell>
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
    </div>
  );
};

export default ClientPaymentsPage;