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
      avatarUrl: 'https://github.com/shadcn.png',
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
      <div className="flex">
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
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">التقييمات والمراجعات</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <Card key={review.id} className="shadow-sm rounded-xl">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.avatarUrl} alt={review.customerName} />
                  <AvatarFallback>{review.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-montserrat text-dark-blue">{review.customerName}</CardTitle>
                  <p className="text-sm text-gray-700 font-open-sans">خدمة: {review.serviceTitle}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {renderStars(review.rating)}
                <p className="text-gray-700 font-open-sans">{review.comment}</p>
                <p className="text-xs text-gray-600 mt-2 font-open-sans">بتاريخ: {review.date}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-600 col-span-full font-open-sans">لا توجد تقييمات أو مراجعات حتى الآن.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RatingsReviewsPage;