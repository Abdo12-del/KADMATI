import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Rating {
  id: string;
  serviceId: string;
  clientId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  serviceTitle?: string; // Joined from service table
  customerName?: string; // Joined from user table
  customerAvatarUrl?: string; // Joined from user table
}

interface Service {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

const fetchProviderRatings = async (providerId: string): Promise<Rating[]> => {
  // First, fetch all services by this provider
  const servicesResponse = await fetch(`http://localhost:3000/api/services/provider/${providerId}`);
  if (!servicesResponse.ok) throw new Error('Failed to fetch provider services');
  const services: Service[] = await servicesResponse.json();

  if (services.length === 0) return [];

  // Then, fetch ratings for each service
  const allRatings: Rating[] = [];
  for (const service of services) {
    const ratingsResponse = await fetch(`http://localhost:3000/api/ratings/service/${service.id}`);
    if (!ratingsResponse.ok) throw new Error(`Failed to fetch ratings for service ${service.id}`);
    const serviceRatings: Rating[] = await ratingsResponse.json();

    // Enrich ratings with service title and client details
    const enrichedRatings = await Promise.all(serviceRatings.map(async (rating) => {
      const clientResponse = await fetch(`http://localhost:3000/api/users/${rating.clientId}`);
      const client: User = clientResponse.ok ? await clientResponse.json() : { id: rating.clientId, name: 'مستخدم مجهول' };
      return {
        ...rating,
        serviceTitle: service.title,
        customerName: client.name,
        customerAvatarUrl: client.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${client.name || 'UU'}`,
      };
    }));
    allRatings.push(...enrichedRatings);
  }
  return allRatings;
};

const RatingsReviewsPage = () => {
  // Placeholder for current provider ID - replace with actual auth context
  const currentProviderId = 'provider123';

  const { data: reviews = [], isLoading, error } = useQuery<Rating[], Error>({
    queryKey: ['providerReviews', currentProviderId],
    queryFn: () => fetchProviderRatings(currentProviderId),
    enabled: !!currentProviderId,
    refetchInterval: 10000, // Poll for new reviews
  });

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

  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل التقييمات...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل التقييمات: {error.message}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">التقييمات والمراجعات</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <Card key={review.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
              <CardHeader className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-0 pb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.customerAvatarUrl} alt={review.customerName} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.customerName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <CardTitle className="text-lg font-cairo text-brand-text-dark">{review.customerName}</CardTitle>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">خدمة: {review.serviceTitle}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-3 text-right">
                <div className="flex justify-end">{renderStars(review.rating)}</div>
                <p className="text-brand-text-dark font-ibm-plex-arabic">{review.comment}</p>
                <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {new Date(review.createdAt).toLocaleDateString('ar-EG')}</p>
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