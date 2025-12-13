"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ReviewCardPropsData } from '@/types/app-types.ts';

// Helper for stars (moved here for modularity, or could be imported from a utils file)
const renderStars = (rating: number) => {
  return (
    <div className="flex rtl:flex-row-reverse">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

// Placeholder data for reviews
const myReviews: ReviewCardPropsData[] = [
  {
    id: 'r1',
    serviceTitle: 'تصميم شعار احترافي',
    providerName: 'أحمد مقدم',
    providerAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AP',
    rating: 5,
    comment: 'خدمة ممتازة وشعار رائع، أنصح به بشدة!',
    date: '2023-11-05',
  },
  {
    id: 'r2',
    serviceTitle: 'كتابة محتوى تسويقي',
    providerName: 'فاطمة كاتبة',
    providerAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FK',
    rating: 4,
    comment: 'محتوى جيد جداً وسرعة في التنفيذ، شكراً.',
    date: '2023-10-20',
  },
];

export const ClientReviewsTab = () => {
  const handleEditReview = (reviewId: string) => {
    toast.info(`تعديل التقييم ${reviewId} (وظيفة وهمية)!`);
    console.log('Edit review clicked for:', reviewId);
  };

  const handleDeleteReview = (reviewId: string) => {
    toast.error(`حذف التقييم ${reviewId} (وظيفة وهمية)!`);
    console.log('Delete review clicked for:', reviewId);
  };

  return (
    <>
      <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">تقييماتي</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myReviews.length > 0 ? (
          myReviews.map(review => (
            <Card key={review.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
              <CardHeader className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-0 pb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.providerAvatarUrl} alt={review.providerName} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.providerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <CardTitle className="text-lg font-cairo text-brand-text-dark">{review.serviceTitle}</CardTitle>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">مقدم الخدمة: {review.providerName}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-3 text-right">
                <div className="flex justify-end">{renderStars(review.rating)}</div>
                <p className="text-brand-text-dark font-ibm-plex-arabic">{review.comment}</p>
                <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {review.date}</p>
                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={() => handleEditReview(review.id)} variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic">
                    <Edit className="ml-2 h-4 w-4" />
                    تعديل
                  </Button>
                  <Button onClick={() => handleDeleteReview(review.id)} variant="destructive" size="sm" className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg shadow-soft font-ibm-plex-arabic">
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لم تقم بتقييم أي خدمات بعد.</p>
        )}
      </div>
    </>
  );
};