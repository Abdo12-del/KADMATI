import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react'; // Import Trash2 icon
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // Import AlertDialog components

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  };
  onDelete?: (id: string) => void; // New prop for delete handler
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
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted line-clamp-2 font-ibm-plex-arabic">{request.description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className={`font-semibold font-ibm-plex-arabic ${getStatusColor(request.status)}`}>الحالة: {request.status}</span>
          <div className="flex gap-2">
            <Link to={`/requests/${request.id}`}>
              <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2 rounded-lg shadow-soft font-ibm-plex-arabic">
                عرض الطلب
              </Button>
            </Link>
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg shadow-soft">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">حذف الطلب</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-cairo text-brand-text-dark text-2xl">هل أنت متأكد تمامًا؟</AlertDialogTitle>
                    <AlertDialogDescription className="font-ibm-plex-arabic text-brand-text-muted">
                      سيؤدي هذا الإجراء إلى حذف طلبك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-row-reverse justify-start gap-3">
                    <AlertDialogAction onClick={() => onDelete(request.id)} className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-xl shadow-soft font-ibm-plex-arabic">
                      نعم، احذف الطلب
                    </AlertDialogAction>
                    <AlertDialogCancel className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic">
                      إلغاء
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;