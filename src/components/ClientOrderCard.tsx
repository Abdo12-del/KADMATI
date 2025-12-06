import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ClientOrderCardProps {
  order: {
    id: string;
    serviceTitle: string;
    providerName: string;
    status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
    date: string;
    price: number;
  };
}

const ClientOrderCard = ({ order }: ClientOrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-platform-orange';
      case 'Accepted':
        return 'text-light-blue';
      case 'Completed':
        return 'text-platform-green';
      case 'Cancelled':
        return 'text-platform-red';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg font-montserrat text-dark-blue">{order.serviceTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-700">مقدم الخدمة: <span className="font-medium">{order.providerName}</span></p>
        <p className="text-sm text-gray-700">التاريخ: {order.date}</p>
        <div className="flex justify-between items-center pt-2">
          <span className={`font-semibold ${getStatusColor(order.status)}`}>الحالة: {order.status}</span>
          <span className="font-bold text-dark-blue">${order.price}</span>
        </div>
        <Link to={`/client-dashboard/orders/${order.id}`}>
          <Button variant="outline" className="w-full mt-4 border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
            عرض التفاصيل
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ClientOrderCard;