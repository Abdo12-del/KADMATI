"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { ReviewCardPropsData, ServiceData, UserData, RatingData } from '@/types/app-types.ts';
import { formatNumberArabic } from '@/lib/number-formatter';
import { mockRatings, mockServices, mockUsers } from '@/lib/mock-data'; // Import mock data

// Helper for stars
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

export const ClientReviewsTab = () => {
  const { user } = useAuth();
  const CLIENT_ID = user?.id;

  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [providers, setProviders] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewsData = useCallback(async () => {
    if (!CLIENT_ID) {
      setLoading(false);
      setError('معرف العميل غير متاح. الرجاء تسجيل الدخول كطالب خدمة.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      const clientRatings = mockRatings.filter(r => r.client_id === CLIENT_ID);
      setRatings(clientRatings);
      setServices(mockServices);
      setProviders(mockUsers.filter(u => u.role === 'provider'));

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب تقييماتك.');
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID]);

  useEffect(() => {
    fetchReviewsData();
  }, [fetchReviewsData]);

  const mappedReviews = useMemo(() => {
    return ratings.map(rating => {
      const service = services.find(s => s.id === rating.service_id);
      const provider = providers.find(p => p.id === service?.provider_id);

      return {
        id: rating.id?.toString() || '',
        serviceTitle: service?.title || 'خدمة غير معروفة',
        providerName: provider?.name || 'مقدم خدمة غير معروف',
        providerAvatarUrl: provider?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${provider?.name.split(' ').map(n => n[0]).join('') || 'UN'}`,
        rating: rating.rating,
        comment: rating.comment,
        date: rating.created_at ? new Date(rating.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
      } as ReviewCardPropsData;
    });
  }, [ratings, services, providers]);

  const handleEditReview = (reviewId: string) => {
    toast.info(`تعديل التقييم ${reviewId} (وظيفة وهمية)!`);
    console.log('Edit review clicked for:', reviewId);
    // In a real app, this would open a dialog to edit the review
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      // Simulate API call for deletion
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      // Update mock data (in a real app, this would be a backend call)
      setRatings(prevRatings => prevRatings.filter(r => r.id?.toString() !== reviewId));

      toast.success('تم حذف التقييم بنجاح!');
      fetchReviewsData(); // Re-fetch reviews to update the list
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حذف التقييم.');
      console.error('Error deleting review:', error);
    }
  };

  if (loading) {
    return (
      <p className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل تقييماتك...</p>
    );
  }

  if (error) {
    return (
      <p className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</p>
    );
  }

  return (
    <>
      <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">تقييماتي</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mappedReviews.length > 0 ? (
          mappedReviews.map(review => (
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