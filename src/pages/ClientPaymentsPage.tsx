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
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">الدفع والمعاملات</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-montserrat">سجل المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableCaption>قائمة بجميع معاملاتك السابقة.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.service}</TableCell>
                    <TableCell>${transaction.amount}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
                    </TableCell>
                    <TableCell>{transaction.method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-600">لا توجد معاملات سابقة.</p>
          )}
        </CardContent>
      </Card>
    </ClientDashboardLayout>
  );
};

export default ClientPaymentsPage;