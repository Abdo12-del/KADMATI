import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  };
}

const RequestCard = ({ request }: RequestCardProps) => {
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
      default:
        return 'text-brand-text-muted';
    }
  };

  return (
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <CardHeader className="p-4 pb-2 text-right">
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{request.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted line-clamp-2 font-ibm-plex-arabic">{request.description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className={`font-semibold font-ibm-plex-arabic ${getStatusColor(request.status)}`}>الحالة: {request.status}</span>
          <Link to={`/requests/${request.id}`}>
            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2 rounded-lg shadow-soft font-ibm-plex-arabic">
              عرض الطلب
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;