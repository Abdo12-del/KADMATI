"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CalendarDays, MessageSquare, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface ProviderRequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    location?: string;
    dateAdded: string;
    dueDate?: string;
    additionalOptions?: string;
    clientName: string;
    clientId: number; // Added clientId
    status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'payment_pending'; // Added status
  };
  onAcceptRequest: (requestId: string, providerId: number, agreedPrice: number) => Promise<void>; // New prop
  onRefreshRequests: () => void; // Callback to refresh requests list
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProviderRequestCard = ({ request, onAcceptRequest, onRefreshRequests }: ProviderRequestCardProps) => {
  const { user } = useAuth();
  const PROVIDER_ID = user?.id;

  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactClient = () => {
    toast.info(`سيتم فتح نافذة محادثة مع ${request.clientName} (وظيفة وهمية)!`);
    console.log('Contact client clicked for request:', request.id);
  };

  const handleAcceptSubmit = async () => {
    if (!PROVIDER_ID) {
      toast.error('معرف مقدم الخدمة غير متاح. الرجاء تسجيل الدخول كمقدم خدمة.');
      return;
    }
    if (agreedPrice === '' || Number(agreedPrice) <= 0) {
      toast.error('الرجاء إدخال سعر متفق عليه صالح.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAcceptRequest(request.id, PROVIDER_ID, Number(agreedPrice));
      toast.success('تم قبول الطلب بنجاح!');
      setIsAcceptDialogOpen(false);
      setAgreedPrice('');
      onRefreshRequests(); // Refresh the list of requests
    } catch (error: any) {
      toast.error(error.message || 'فشل قبول الطلب.');
      console.error('Error accepting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <CardHeader className="p-4 pb-2 text-right">
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{request.title}</CardTitle>
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">تاريخ الإضافة: {request.dateAdded}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-dark line-clamp-2 font-ibm-plex-arabic">{request.description}</p>
        {request.location && (
          <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
            <span className="ml-1">{request.location}</span>
            <MapPin className="h-4 w-4 mr-1 text-brand-primary" />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 px-3 py-2 rounded-lg shadow-soft font-ibm-plex-arabic text-sm">
                عرض التفاصيل
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">{request.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-brand-text-dark font-ibm-plex-arabic">
                <p className="text-lg font-semibold">{request.description}</p>
                <Separator className="bg-border" />
                {request.location && (
                  <div className="flex flex-row-reverse items-center">
                    <MapPin className="ml-2 h-5 w-5 text-brand-primary" />
                    <span>الموقع: {request.location}</span>
                  </div>
                )}
                <div className="flex flex-row-reverse items-center">
                  <CalendarDays className="ml-2 h-5 w-5 text-brand-primary" />
                  <span>تاريخ الإضافة: {request.dateAdded}</span>
                </div>
                {request.dueDate && (
                  <div className="flex flex-row-reverse items-center">
                    <CalendarDays className="ml-2 h-5 w-5 text-brand-primary" />
                    <span>الموعد المتوقع: {request.dueDate}</span>
                  </div>
                )}
                {request.additionalOptions && (
                  <div>
                    <p className="font-semibold mt-4">خيارات إضافية:</p>
                    <p>{request.additionalOptions}</p>
                  </div>
                )}
                <p className="font-semibold mt-4">طالب الخدمة: {request.clientName}</p>
              </div>
              <div className="mt-6 text-center">
                <Button onClick={handleContactClient} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                  <MessageSquare className="ml-2 h-5 w-5" />
                  الاتصال بالطالب
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {request.status === 'pending' && (
            <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-success hover:bg-brand-success/90 text-white px-3 py-2 rounded-lg shadow-soft font-ibm-plex-arabic text-sm">
                  <CheckCircle className="ml-2 h-4 w-4" />
                  قبول الطلب
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">قبول الطلب</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <p className="text-brand-text-dark font-ibm-plex-arabic">
                    هل أنت متأكد أنك تريد قبول طلب "{request.title}" من {request.clientName}؟
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="agreed-price" className="text-brand-text-dark font-ibm-plex-arabic">السعر المتفق عليه (د.ج)</Label>
                    <Input
                      id="agreed-price"
                      type="number"
                      placeholder="ادخل السعر المتفق عليه"
                      required
                      min="0"
                      value={agreedPrice}
                      onChange={(e) => setAgreedPrice(Number(e.target.value))}
                      className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                    />
                  </div>
                </div>
                <DialogFooter className="flex flex-row-reverse justify-start gap-3">
                  <Button type="submit" onClick={handleAcceptSubmit} disabled={isSubmitting} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                    {isSubmitting ? 'جاري القبول...' : 'تأكيد القبول'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)} disabled={isSubmitting} className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                    إلغاء
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderRequestCard;