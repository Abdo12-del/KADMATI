"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface SubmitRatingDialogProps {
  serviceId: number;
  serviceTitle: string;
  onRatingSubmitted: () => void; // Callback to refresh reviews in parent
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const SubmitRatingDialog = ({ serviceId, serviceTitle, onRatingSubmitted }: SubmitRatingDialogProps) => {
  const { user } = useAuth();
  const CLIENT_ID = user?.id;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmitRating = async () => {
    if (!CLIENT_ID) {
      toast.error('الرجاء تسجيل الدخول كطالب خدمة لإضافة تقييم.');
      return;
    }
    if (rating === 0) {
      toast.error('الرجاء اختيار عدد النجوم للتقييم.');
      return;
    }

    const newRating = {
      service_id: serviceId,
      client_id: CLIENT_ID,
      rating: rating,
      comment: comment.trim() || undefined, // Send undefined if comment is empty
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRating),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إضافة التقييم.');
      }

      toast.success('تم إضافة تقييمك بنجاح!');
      setRating(0);
      setComment('');
      setIsOpen(false); // Close the dialog
      onRatingSubmitted(); // Refresh reviews in parent component
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إضافة التقييم.');
      console.error('Error submitting rating:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
          إضافة تقييم
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">تقييم خدمة: {serviceTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <Label htmlFor="rating-stars" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تقييمك</Label>
            <div className="flex rtl:flex-row-reverse space-x-1 rtl:space-x-reverse">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-8 w-8 cursor-pointer transition-colors ${
                    i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                  }`}
                  onClick={() => handleStarClick(i + 1)}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment" className="text-brand-text-dark font-ibm-plex-arabic">تعليق (اختياري)</Label>
            <Textarea
              id="comment"
              placeholder="اكتب تعليقك هنا..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-row-reverse justify-start gap-3">
          <Button type="submit" onClick={handleSubmitRating} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            إرسال التقييم
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};