import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const RatingsReviewsPage = () => {
  // Placeholder for ratings and reviews
  const reviews = [
    {
      id: 'rev1',
      customerName: 'أحمد محمد',
      serviceTitle: 'تصميم شعار احترافي',
      rating: 5,
      comment: 'خدمة ممتازة وشعار رائع، أنصح به بشدة!',
      date: '2023-10-20',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AM',
    },
    {
      id: 'rev2',
      customerName: 'سارة علي',
      serviceTitle: 'كتابة محتوى تسويقي',
      rating: 4,
      comment: 'محتوى جيد جداً وسرعة في التنفيذ، شكراً.',
      date: '2023-10-25',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA',
    },
    {
      id: 'rev3',
      customerName: 'خالد فهد',
      serviceTitle: 'تطوير موقع ويب شخصي',
      rating: 5,
      comment: 'عمل احترافي ودعم فني ممتاز بعد التسليم.',
      date: '2023-10-18',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=KF',
    },
  ];

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

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">التقييمات والمراجعات</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <Card key={review.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
              <CardHeader className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-0 pb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.avatarUrl} alt={review.customerName} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <CardTitle className="text-lg font-cairo text-brand-text-dark">{review.customerName}</CardTitle>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">خدمة: {review.serviceTitle}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-3 text-right">
                <div className="flex justify-end">{renderStars(review.rating)}</div>
                <p className="text-brand-text-dark font-ibm-plex-arabic">{review.comment}</p>
                <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {review.date}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد تقييمات أو مراجعات حتى الآن.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RatingsReviewsPage;