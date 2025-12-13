"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ConfirmPaymentDialog } from '@/components/ConfirmPaymentDialog'; // Import ConfirmPaymentDialog

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled' | 'Payment Pending'; // Updated status
    paymentStatus?: 'Unpaid' | 'Pending Review' | 'Paid' | 'Rejected'; // New field
  };
  onDelete?: (id: string) => void;
  onConfirmPayment?: (id: string, paymentReference: string, receiptUrl: string) => Promise<void>; // New prop
}

const RequestCard = ({ request, onDelete, onConfirmPayment }: RequestCardProps) => {
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
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{request.title}</CardTitle>
        <p className={`text-sm font-ibm-plex-arabic ${getStatusColor(request.status)}`}>الحالة: {request.status}</p>
        {request.paymentStatus && (
          <p className="text-xs text-brand-text-muted font-ibm-plex-arabic">حالة الدفع: {request.paymentStatus}</p>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted line-clamp-2 font-ibm-plex-arabic">{request.description}</p>
        <div className="flex justify-end gap-2 mt-4">
          {request.status === 'Pending' && request.paymentStatus === 'Unpaid' && onConfirmPayment && (
            <ConfirmPaymentDialog requestId={request.id} onConfirmPayment={onConfirmPayment} />
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(request.id)}
              className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg shadow-soft font-ibm-plex-arabic"
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف الطلب
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;