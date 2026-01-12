"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ConfirmPaymentDialogProps {
  requestId: string;
  onConfirmPayment: (requestId: string, paymentReference: string, receiptUrl: string) => Promise<void>;
}

export const ConfirmPaymentDialog = ({ requestId, onConfirmPayment }: ConfirmPaymentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreviewUrl(URL.createObjectURL(file));
    } else {
      setReceiptFile(null);
      setReceiptPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!paymentReference.trim()) {
      toast.error('الرجاء إدخال مرجع الدفع.');
      return;
    }
    if (!receiptFile) {
      toast.error('الرجاء رفع وصل الدفع.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate file upload to a storage service (e.g., S3, Cloudinary)
      // For this simulation, we'll just create a dummy URL
      const dummyReceiptUrl = `https://example.com/receipts/${requestId}-${Date.now()}-${receiptFile.name}`;

      await onConfirmPayment(requestId, paymentReference, dummyReceiptUrl);
      toast.success('تم تأكيد الدفع بنجاح! سيتم مراجعة الوصل.');
      setIsOpen(false);
      setPaymentReference('');
      setReceiptFile(null);
      setReceiptPreviewUrl(null);
    } catch (error: any) {
      toast.error(error.message || 'فشل تأكيد الدفع.');
      console.error('Error confirming payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg shadow-soft font-ibm-plex-arabic">
          دفعت
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">تأكيد الدفع</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="payment-reference" className="text-brand-text-dark font-ibm-plex-arabic">مرجع الدفع / رقم العملية</Label>
            <Input
              id="payment-reference"
              placeholder="ادخل مرجع الدفع الخاص بك"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="receipt-upload" className="text-brand-text-dark font-ibm-plex-arabic">وصل الدفع</Label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-brand-background hover:bg-brand-background/80 border-border">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-2 text-brand-primary" />
                  <p className="mb-2 text-sm text-brand-text-muted font-ibm-plex-arabic">
                    <span className="font-semibold">انقر للرفع</span> أو اسحب وأفلت
                  </p>
                  <p className="text-xs text-brand-text-muted font-ibm-plex-arabic">PNG, JPG, PDF (MAX. 5MB)</p>
                </div>
                <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
              </label>
            </div>
            {receiptPreviewUrl && (
              <div className="mt-2 text-center">
                {receiptFile?.type.startsWith('image/') ? (
                  <img src={receiptPreviewUrl} alt="وصل الدفع" className="max-h-40 mx-auto rounded-lg object-contain" />
                ) : (
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">تم رفع الملف: {receiptFile?.name}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex flex-row-reverse justify-start gap-3">
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الدفع'}
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};