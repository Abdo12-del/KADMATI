"use client";

import React, { useState, useEffect, useCallback } from 'react';
// import ClientHomeHeader from '@/components/ClientHomeHeader'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Clock, MapPin, LayoutList } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ClientOrderServicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user from auth context
  const CLIENT_ID = user?.id; // Use actual client ID

  const [service, setService] = useState<ServiceData | null>(null);
  const [provider, setProvider] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceResponse = await fetch(`${API_BASE_URL}/api/services/${id}`);
      if (!serviceResponse.ok) {
        const errorData = await serviceResponse.json();
        throw new Error(errorData.message || 'فشل جلب تفاصيل الخدمة.');
      }
      const serviceResult = await serviceResponse.json();
      const fetchedService: ServiceData = serviceResult.data;
      setService(fetchedService);

      const providerResponse = await fetch(`${API_BASE_URL}/api/users/${fetchedService.provider_id}`);
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
    if (!CLIENT_ID) {
      toast.error('معرف العميل غير متاح. الرجاء تسجيل الدخول كطالب خدمة.');
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
      const response = await fetch(`${API_BASE_URL}/api/requests`, {
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
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل تفاصيل الخدمة للطلب...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-brand-danger font-ibm-plex-arabic">
        خطأ: {error}
      </div>
    );
  }

  if (!service || !provider) {
    return (
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">
        الخدمة غير موجودة أو لا يمكن الوصول إليها.
      </div>
    );
  }

  return (
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
  );
};

export default ClientOrderServicePage;