import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ClientOrderCardProps {
  order: {
    id: string;
    serviceTitle: string;
    providerName: string;
    status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled' | 'Payment Pending'; // Updated status
    date: string;
    price: number;
  };
}

const ClientOrderCard = ({ order }: ClientOrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-brand-warning';
      case 'Accepted':
        return 'text-brand-primary';
      case 'Completed':
        return 'text-brand-success';
      case 'Cancelled':
        return 'text-brand-danger';
      case 'Payment Pending':
        return 'text-brand-info'; // New color for payment pending
      default:
        return 'text-brand-text-muted';
    }
  };

  return (
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <CardHeader className="p-4 pb-2 text-right">
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{order.serviceTitle}</CardTitle>
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">مقدم الخدمة: <span className="font-semibold">{order.providerName}</span></p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">التاريخ: {order.date}</p>
        <div className="flex justify-between items-center pt-2">
          <span className={`font-semibold font-ibm-plex-arabic ${getStatusColor(order.status)}`}>الحالة: {order.status}</span>
          <span className="font-bold text-brand-primary text-xl font-cairo">{order.price} د.ج</span>
        </div>
        <Link to={`/client-dashboard/orders/${order.id}`}>
          <Button variant="outline" className="w-full mt-4 border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic">
            عرض التفاصيل
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ClientOrderCard;