"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  };
  onDelete?: (id: string) => void;
}

const RequestCard = ({ request, onDelete }: RequestCardProps) => {
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
        <p className={`text-sm font-ibm-plex-arabic ${getStatusColor(request.status)}`}>الحالة: {request.status}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted line-clamp-2 font-ibm-plex-arabic">{request.description}</p>
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(request.id)}
            className="w-full mt-4 bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg shadow-soft font-ibm-plex-arabic"
          >
            <Trash2 className="ml-2 h-4 w-4" />
            حذف الطلب
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestCard;