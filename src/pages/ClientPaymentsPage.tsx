import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
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
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">الدفع والمعاملات</h1>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="font-montserrat text-dark-blue">سجل المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableCaption className="font-open-sans">قائمة بجميع معاملاتك السابقة.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-dark-blue font-semibold font-open-sans">الخدمة</TableHead>
                  <TableHead className="text-dark-blue font-semibold font-open-sans">المبلغ</TableHead>
                  <TableHead className="text-dark-blue font-semibold font-open-sans">التاريخ</TableHead>
                  <TableHead className="text-dark-blue font-semibold font-open-sans">الحالة</TableHead>
                  <TableHead className="text-dark-blue font-semibold font-open-sans">طريقة الدفع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-gray-800 font-open-sans">{transaction.service}</TableCell>
                    <TableCell className="text-gray-800 font-open-sans">${transaction.amount}</TableCell>
                    <TableCell className="text-gray-800 font-open-sans">{transaction.date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="rounded-md font-open-sans">
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-800 font-open-sans">{transaction.method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-600 font-open-sans">لا توجد معاملات سابقة.</p>
          )}
        </CardContent>
      </Card>
    </ClientDashboardLayout>
  );
};

export default ClientPaymentsPage;