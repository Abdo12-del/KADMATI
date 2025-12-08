"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Clock, MapPin, LayoutList } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ServiceData {
  id: number;
  provider_id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  delivery_time?: number;
  image_url?: string;
  rating?: number;
  reviews_count?: number;
  location?: string;
  service_level?: string;
}

interface UserData {
  id: number;
  name: string;
}

const ClientOrderServicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceData | null>(null);
  const [provider, setProvider] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const CLIENT_ID = 2; // Hardcoded client ID for Laila Seeker

  const fetchServiceDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceResponse = await fetch(`http://localhost:3000/api/services/${id}`);
      if (!serviceResponse.ok) {
        const errorData = await serviceResponse.json();
        throw new Error(errorData.message || 'فشل جلب تفاصيل الخدمة.');
      }
      const serviceResult = await serviceResponse.json();
      const fetchedService: ServiceData = serviceResult.data;
      setService(fetchedService);

      const providerResponse = await fetch(`http://localhost:3000/api/users/${fetchedService.provider_id}`);
      if (!providerResponse.ok) {
        const errorData = await providerResponse.json();
        throw new Error(errorData.message || 'فشل جلب معلومات مقدم الخدمة.');
      }
      const providerResult = await providerResponse.json();
      setProvider(providerResult.data);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب تفاصيل الخدمة.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const handlePlaceOrder = async () => {
    if (!service) {
      toast.error('لا يمكن إتمام الطلب، بيانات الخدمة غير متوفرة.');
      return;
    }

    const newRequest = {
      client_id: CLIENT_ID,
      title: `طلب خدمة: ${service.title}`,
      description: `طلب العميل لخدمة: ${service.title} من مقدم الخدمة: ${provider?.name || 'غير معروف'}.`,
      category: service.category,
      location: service.location,
      // due_date and additional_options can be added if the form allows input
      status: 'pending', // Default status
    };

    try {
      const response = await fetch('http://localhost:3000/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إرسال الطلب.');
      }

      const result = await response.json();
      toast.success('تم إرسال طلبك بنجاح! سيتم مراجعته من قبل مقدم الخدمة.');
      console.log('Order placed:', result.data);
      navigate('/client-home'); // Redirect to client home after submission
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الطلب.');
      console.error('Error placing order:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-background">
        <ClientHomeHeader />
        <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-dark font-ibm-plex-arabic">
          جاري تحميل تفاصيل الخدمة للطلب...
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-background">
        <ClientHomeHeader />
        <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-danger font-ibm-plex-arabic">
          خطأ: {error}
        </main>
        <Footer />
      </div>
    );
  }

  if (!service || !provider) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-background">
        <ClientHomeHeader />
        <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-dark font-ibm-plex-arabic">
          الخدمة غير موجودة أو لا يمكن الوصول إليها.
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 flex items-center justify-center">
        <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-2xl text-right">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">تأكيد طلب الخدمة</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div className="flex flex-col items-center mb-6">
              <img src={service.image_url || '/placeholder.svg'} alt={service.title} className="w-full h-48 object-cover rounded-xl mb-4" />
              <h2 className="text-3xl font-cairo text-brand-text-dark text-center">{service.title}</h2>
              <p className="text-brand-text-muted font-ibm-plex-arabic text-center">بواسطة: {provider.name}</p>
            </div>

            <Separator className="my-6 bg-border" />

            <div className="space-y-4 text-brand-text-dark font-ibm-plex-arabic">
              <div className="flex justify-between items-center">
                <span className="font-semibold">السعر الأساسي:</span>
                <span className="text-brand-primary font-bold text-xl">${service.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">مدة التسليم المتوقعة:</span>
                <span>{service.delivery_time || 'غير محدد'} أيام</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">الموقع:</span>
                <span>{service.location || 'غير محدد'}</span>
              </div>
              <p className="text-sm text-brand-text-muted mt-4 leading-relaxed">
                {service.description}
              </p>
            </div>

            <Button
              onClick={handlePlaceOrder}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg mt-8"
            >
              تأكيد وطلب الخدمة
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)} // Go back to previous page
              className="w-full mt-4 border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg"
            >
              إلغاء
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ClientOrderServicePage;