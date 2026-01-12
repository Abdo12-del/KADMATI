"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import ClientServiceCard from '@/components/ClientServiceCard';
import ProviderCard from '@/components/ProviderCard';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { ServiceData, UserData, ClientServiceCardPropsData, ProviderCardPropsData } from '@/types/app-types.ts';
import { mockServices, mockUsers } from '@/lib/mock-data'; // Import mock data

export const ClientFavoritesTab = () => {
  const { user } = useAuth(); // Removed updateUserFavorites as it's not directly used here
  const [favoriteServices, setFavoriteServices] = useState<ServiceData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [errorFavorites, setErrorFavorites] = useState<string | null>(null);

  const fetchFavoriteServices = useCallback(async () => {
    if (!user || !user.id || user.role !== 'seeker') {
      setLoadingFavorites(false);
      setErrorFavorites('User not logged in as a seeker.');
      return;
    }

    setLoadingFavorites(true);
    setErrorFavorites(null);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      setAllUsers(mockUsers);

      const userFavorites = user.favorite_service_ids || [];
      const fetchedFavoriteServices = mockServices.filter(service => userFavorites.includes(service.id!));
      setFavoriteServices(fetchedFavoriteServices);

    } catch (err: any) {
      setErrorFavorites(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب الخدمات المفضلة.');
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]); // Depend on user to update favorites

  useEffect(() => {
    fetchFavoriteServices();
  }, [fetchFavoriteServices]);

  const mappedFavoriteServices = useMemo(() => {
    return favoriteServices.map(service => {
      const provider = allUsers.find(u => u.id === service.provider_id);
      return {
        id: service.id.toString(),
        title: service.title,
        description: service.description,
        price: service.price,
        providerName: provider?.name || 'مقدم خدمة غير معروف',
        rating: service.rating || 0,
        location: service.location || 'غير محدد',
        imageUrl: service.image_url || '/placeholder.svg',
      } as ClientServiceCardPropsData;
    });
  }, [favoriteServices, allUsers]);

  // Placeholder for favorite providers (not implemented in backend yet)
  const favoriteProviders: ProviderCardPropsData[] = []; 

  return (
    <>
      <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الخدمات المفضلة</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {loadingFavorites ? (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">جاري تحميل الخدمات المفضلة...</p>
        ) : errorFavorites ? (
          <p className="text-brand-danger col-span-full font-ibm-plex-arabic text-right">خطأ: {errorFavorites}</p>
        ) : mappedFavoriteServices.length > 0 ? (
          mappedFavoriteServices.map(service => (
            <ClientServiceCard key={service.id} service={service} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد خدمات في قائمة المفضلة.</p>
        )}
      </div>

      <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">مقدمو الخدمات المفضلون</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favoriteProviders.length > 0 ? (
          favoriteProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا يوجد مقدمو خدمات في قائمة المفضلة.</p>
        )}
      </div>
    </>
  );
};