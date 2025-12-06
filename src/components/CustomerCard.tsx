import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    totalOrders: number;
    lastOrderDate: string;
  };
}

const CustomerCard = ({ customer }: CustomerCardProps) => {
  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={customer.avatarUrl} alt={customer.name} />
          <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg font-montserrat text-dark-blue">{customer.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-700">البريد الإلكتروني: {customer.email}</p>
        <p className="text-sm text-gray-700">إجمالي الطلبات: <span className="font-medium">{customer.totalOrders}</span></p>
        <p className="text-sm text-gray-700">آخر طلب: {customer.lastOrderDate}</p>
        <Button className="w-full mt-4 bg-light-blue hover:bg-light-blue/90 text-white rounded-lg">
          <MessageSquare className="mr-2 h-4 w-4" />
          إرسال رسالة
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;