import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClientReviewsRatingsPage = () => {
  // Placeholder for client's reviews
  const myReviews = [
    {
      id: 'rev1',
      serviceTitle: 'تنظيف منزلي عميق',
      providerName: 'شركة النظافة السريعة',
      rating: 5,
      comment: 'خدمة ممتازة وفريق عمل محترف، المنزل أصبح يلمع!',
      date: '2023-11-01',
      providerAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NS',
    },
    {
      id: 'rev2',
      serviceTitle: 'صيانة مكيفات سبليت',
      providerName: 'فني الصيانة ماهر',
      rating: 4,
      comment: 'تنظيف جيد جداً وسرعة في الاستجابة، شكراً.',
      date: '2023-10-28',
      providerAvatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FM',
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
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue text-right">تقييماتي</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myReviews.length > 0 ? (
          myReviews.map(review => (
            <Card key={review.id} className="shadow-soft-neumorphism bg-soft-white rounded-2xl p-4">
              <CardHeader className="flex flex-row items-center space-x-4 rtl:space-x-reverse pb-2 p-0 mb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.providerAvatarUrl} alt={review.providerName} />
                  <AvatarFallback>{review.providerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <CardTitle className="text-lg font-montserrat text-dark-blue">{review.serviceTitle}</CardTitle>
                  <p className="text-sm text-gray-700 font-inter">مقدم الخدمة: {review.providerName}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-2 text-right">
                <div className="flex justify-end">{renderStars(review.rating)}</div>
                <p className="text-gray-700 font-inter">{review.comment}</p>
                <p className="text-xs text-gray-600 mt-2 font-inter">بتاريخ: {review.date}</p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg shadow-md">
                    <Edit className="h-4 w-4 ml-2 rtl:mr-2" />
                    تعديل
                  </Button>
                  <Button variant="destructive" size="sm" className="bg-platform-red hover:bg-platform-red/90 text-white rounded-lg shadow-md">
                    <Trash2 className="h-4 w-4 ml-2 rtl:mr-2" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-600 col-span-full font-inter text-right">لم تقم بتقييم أي خدمات بعد.</p>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientReviewsRatingsPage;