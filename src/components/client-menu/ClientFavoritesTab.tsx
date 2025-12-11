"use client";

// import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Removed
import { useState, useEffect, useCallback, useMemo } from 'react';
import ClientServiceCard from '@/components/ClientServiceCard';
import ProviderCard from '@/components/ProviderCard';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Removed
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { ServiceData, UserData, ClientServiceCardPropsData, ProviderCardPropsData } from '@/types/app-types.ts';

interface ClientFavoritesTabProps {
  API_BASE_URL: string;
}

export const ClientFavoritesTab = ({ API_BASE_URL }: ClientFavoritesTabProps) => {
  const { user } = useAuth();
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
      const [servicesResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/services`),
        fetch(`${API_BASE_URL}/api/users`),
      ]);

      if (!servicesResponse.ok) throw new Error('فشل جلب الخدمات.');
      if (!usersResponse.ok) throw new Error('فشل جلب المستخدمين.');

      const servicesData: ServiceData[] = (await servicesResponse.json()).data;
      const usersData: UserData[] = (await usersResponse.json()).data;
      setAllUsers(usersData);

      const userFavorites = user.favorite_service_ids || [];
      const fetchedFavoriteServices = servicesData.filter(service => userFavorites.includes(service.id!));
      setFavoriteServices(fetchedFavoriteServices);

    } catch (err: any) {
      setErrorFavorites(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب الخدمات المفضلة.');
    } finally {
      setLoadingFavorites(false);
    }
  }, [user, API_BASE_URL]);

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