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
        return 'text-orange-button';
      case 'Accepted':
        return 'text-sky-blue-light';
      case 'Completed':
        return 'text-green-600';
      case 'Cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-montserrat">{order.serviceTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600">مقدم الخدمة: <span className="font-medium">{order.providerName}</span></p>
        <p className="text-sm text-gray-600">التاريخ: {order.date}</p>
        <div className="flex justify-between items-center pt-2">
          <span className={`font-semibold ${getStatusColor(order.status)}`}>الحالة: {order.status}</span>
          <span className="font-bold text-gray-800">${order.price}</span>
        </div>
        <Link to={`/client-dashboard/orders/${order.id}`}>
          <Button variant="outline" className="w-full mt-4 border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10">
            عرض التفاصيل
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ClientOrderCard;