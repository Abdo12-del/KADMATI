"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface RatingData {
  id: number;
  service_id: number;
  client_id: number;
  rating: number;
  comment?: string;
  created_at?: string;
}

interface ServiceData {
  id: number;
  title: string;
  provider_id: number; // Added provider_id to filter services
}

interface UserData {
  id: number;
  name: string;
  avatar_url?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RatingsReviewsPage = () => {
  const { user } = useAuth(); // Get current user from auth context
  const PROVIDER_ID = user?.id;

  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!PROVIDER_ID) {
      setLoading(false);
      setError('Provider ID not available. Please log in as a provider.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [ratingsResponse, servicesResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ratings`),
        fetch(`${API_BASE_URL}/api/services`),
        fetch(`${API_BASE_URL}/api/users`),
      ]);

      if (!ratingsResponse.ok) {
        const errorData = await ratingsResponse.json();
        throw new Error(errorData.message || 'فشل جلب التقييمات.');
      }
      if (!servicesResponse.ok) {
        const errorData = await servicesResponse.json();
        throw new Error(errorData.message || 'فشل جلب الخدمات.');
      }
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين.');
      }

      const ratingsResult = await ratingsResponse.json();
      const servicesResult = await servicesResponse.json();
      const usersResult = await usersResponse.json();

      // Filter services to only include those belonging to the current provider
      const providerServices = servicesResult.data.filter((s: ServiceData) => s.provider_id === PROVIDER_ID);
      setServices(providerServices);

      // Filter ratings to only include those for the current provider's services
      const providerServiceIds = providerServices.map((s: ServiceData) => s.id);
      const providerRatings = ratingsResult.data.filter((r: RatingData) => providerServiceIds.includes(r.service_id));
      setRatings(providerRatings);
      
      setUsers(usersResult.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب البيانات.');
    } finally {
      setLoading(false);
    }
  }, [PROVIDER_ID]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const mappedReviews = useMemo(() => {
    return ratings.map(rating => {
      const service = services.find(s => s.id === rating.service_id);
      const customer = users.find(u => u.id === rating.client_id);
      return {
        id: rating.id.toString(),
        customerName: customer?.name || 'عميل غير معروف',
        serviceTitle: service?.title || 'خدمة غير معروفة',
        rating: rating.rating,
        comment: rating.comment,
        date: rating.created_at ? new Date(rating.created_at).toLocaleDateString('en-US') : 'غير محدد',
        avatarUrl: customer?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${customer?.name?.split(' ').map((n: string) => n[0]).join('') || 'UN'}`,
      };
    });
  }, [ratings, services, users]);

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

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل التقييمات...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">التقييمات والمراجعات</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mappedReviews.length > 0 ? (
          mappedReviews.map(review => (
            <Card key={review.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
              <CardHeader className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-0 pb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.avatarUrl} alt={review.customerName} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.customerName?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
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
    </>
  );
};

export default RatingsReviewsPage;