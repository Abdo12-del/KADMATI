"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, MapPin, LayoutList, Share2, Heart, MessageSquare, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

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
  created_at?: string;
  updated_at?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  phone?: string;
  bio?: string;
  avatar_url?: string;
}

interface RatingData {
  id: number;
  service_id: number;
  client_id: number;
  rating: number;
  comment?: string;
  created_at?: string;
}

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

const ClientServiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceData | null>(null);
  const [provider, setProvider] = useState<UserData | null>(null);
  const [reviews, setReviews] = useState<RatingData[]>([]);
  const [reviewCustomers, setReviewCustomers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Fetch provider details
      const providerResponse = await fetch(`http://localhost:3000/api/users/${fetchedService.provider_id}`);
      if (!providerResponse.ok) {
        const errorData = await providerResponse.json();
        throw new Error(errorData.message || 'فشل جلب معلومات مقدم الخدمة.');
      }
      const providerResult = await providerResponse.json();
      setProvider(providerResult.data);

      // Fetch ratings for this service
      const ratingsResponse = await fetch(`http://localhost:3000/api/ratings`);
      if (!ratingsResponse.ok) {
        const errorData = await ratingsResponse.json();
        throw new Error(errorData.message || 'فشل جلب التقييمات.');
      }
      const ratingsResult = await ratingsResponse.json();
      const serviceReviews = ratingsResult.data.filter((r: RatingData) => r.service_id === fetchedService.id);
      setReviews(serviceReviews);

      // Fetch users for reviews
      const usersResponse = await fetch(`http://localhost:3000/api/users`);
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين للتقييمات.');
      }
      const usersResult = await usersResponse.json();
      setReviewCustomers(usersResult.data);

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

  const mappedReviews = useMemo(() => {
    return reviews.map(review => {
      const customer = reviewCustomers.find(u => u.id === review.client_id);
      return {
        id: review.id.toString(),
        customerName: customer?.name || 'عميل غير معروف',
        customerAvatar: customer?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${customer?.name.split(' ').map(n => n[0]).join('') || 'UN'}`,
        rating: review.rating,
        comment: review.comment,
        date: review.created_at ? new Date(review.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
      };
    });
  }, [reviews, reviewCustomers]);

  const handleShare = () => {
    if (navigator.share && service) {
      navigator.share({
        title: service.title,
        text: service.description,
        url: window.location.href,
      }).then(() => toast.success('تمت مشاركة الخدمة بنجاح!'))
        .catch((error) => toast.error('فشل في مشاركة الخدمة: ' + error.message));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ رابط الخدمة إلى الحافظة!');
    }
  };

  const handleAddToFavorites = () => {
    // Removed dummy toast message
    console.log('Add to favorites clicked');
    toast.success('تمت إضافة الخدمة إلى المفضلة!');
  };

  const handleContactProvider = () => {
    // Removed dummy toast message
    console.log('Contact provider clicked');
    toast.info('سيتم فتح نافذة محادثة مع مقدم الخدمة!');
  };

  // Removed placeholder service features and FAQs
  const serviceFeatures: string[] = [];
  const serviceFaqs: { question: string; answer: string; }[] = [];

  if (loading) {
    return (
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل تفاصيل الخدمة...
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
        الخدمة غير موجودة.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Card className="bg-brand-card-bg mb-8 rounded-2xl shadow-soft p-6">
            <CardContent className="p-0">
              {/* Service Image/Carousel */}
              <img src={service.image_url || '/placeholder.svg'} alt={service.title} className="w-full h-96 object-cover rounded-xl mb-6" />
              
              {/* Service Title */}
              <h1 className="text-4xl font-cairo text-brand-text-dark mb-4 text-right">{service.title}</h1>
              
              {/* Quick Info Icons */}
              <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-2 mb-6 text-brand-text-dark font-ibm-plex-arabic text-right">
                <div className="flex flex-row-reverse items-center">
                  <span className="font-semibold ml-2">المدة:</span>
                  <Clock className="h-5 w-5 text-brand-primary" />
                  <span className="font-ibm-plex-arabic">{service.delivery_time || 'غير محدد'} أيام</span>
                </div>
                <div className="flex flex-row-reverse items-center">
                  <span className="font-semibold ml-2">الموقع:</span>
                  <MapPin className="h-5 w-5 text-brand-primary" />
                  <span className="font-ibm-plex-arabic">{service.location || 'غير محدد'}</span>
                </div>
                <div className="flex flex-row-reverse items-center">
                  <span className="font-semibold ml-2">المستوى:</span>
                  <LayoutList className="h-5 w-5 text-brand-primary" />
                  <span className="font-ibm-plex-arabic">{service.service_level || 'غير محدد'}</span>
                </div>
              </div>

              <Separator className="my-6 bg-border" />

              {/* Service Description */}
              <h2 className="text-2xl font-cairo text-brand-text-dark mb-4 text-right">وصف الخدمة</h2>
              <p className="text-brand-text-dark text-lg mb-6 font-ibm-plex-arabic text-right leading-relaxed">
                {service.description}
              </p>

              {/* Service Features/Bullets */}
              {serviceFeatures.length > 0 && (
                <>
                  <h3 className="text-xl font-cairo text-brand-text-dark mb-3 text-right">ما ستحصل عليه:</h3>
                  <ul className="list-disc list-inside text-brand-text-dark space-y-2 font-ibm-plex-arabic text-right pr-5">
                    {serviceFeatures.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          {/* Service Provider Info */}
          <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 mb-8">
            <CardHeader className="p-0 pb-4 text-right">
              <CardTitle className="font-cairo text-brand-text-dark text-2xl">مقدم الخدمة</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-row-reverse items-center justify-between">
              <div className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={provider.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.name.split(' ').map(n => n[0]).join('')}`} alt={provider.name} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="font-cairo text-xl text-brand-text-dark font-semibold">{provider.name}</p>
                  <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
                    <span className="ml-1">({service.rating || 0})</span>
                    {renderStars(service.rating || 0)}
                  </div>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">
                    {service.reviews_count || 0} خدمة مكتملة
                  </p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-2 px-4">
                    عرض الملف الشخصي
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">ملف مقدم الخدمة</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center mb-6">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={provider.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.name.split(' ').map(n => n[0]).join('')}`} alt={provider.name} />
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-cairo text-brand-text-dark">{provider.name}</h3>
                    <div className="flex items-center mt-2">
                      {renderStars(service.rating || 0)}
                      <span className="mr-2 text-brand-text-muted font-ibm-plex-arabic">({service.reviews_count || 0} تقييم)</span>
                    </div>
                    <p className="text-brand-text-muted font-ibm-plex-arabic mt-1">{service.reviews_count || 0} خدمة مكتملة</p>
                  </div>
                  <Separator className="my-4 bg-border" />
                  <div className="space-y-4">
                    <p className="text-brand-text-dark font-ibm-plex-arabic leading-relaxed">{provider.bio || 'لا يوجد وصف.'}</p>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">البريد الإلكتروني: {provider.email}</p>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">الهاتف: {provider.phone || 'غير متوفر'}</p>
                  </div>
                  <div className="mt-6 text-center">
                    <Button onClick={handleContactProvider} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                      <MessageSquare className="ml-2 h-5 w-5" />
                      إرسال رسالة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Ratings and Reviews */}
          <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6">
            <CardHeader className="p-0 pb-4 text-right">
              <CardTitle className="font-cairo text-brand-text-dark text-2xl">التقييمات والمراجعات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center justify-end mb-4">
                <span className="text-4xl font-cairo text-brand-primary font-bold ml-3">{service.rating || 0}</span>
                <div className="flex flex-col items-end">
                  {renderStars(service.rating || 0)}
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">بناءً على {mappedReviews.length} مراجعة</p>
                </div>
              </div>
              <div className="space-y-4">
                {mappedReviews.slice(0, 2).map(review => ( // Show first 2 reviews
                  <div key={review.id} className="border-b border-border pb-4 last:border-b-0 text-right">
                    <div className="flex flex-row-reverse items-center justify-end mb-2">
                      <Avatar className="h-10 w-10 ml-3">
                        <AvatarImage src={review.customerAvatar} alt={review.customerName} />
                        <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-brand-text-dark font-ibm-plex-arabic">{review.customerName}</span>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-brand-text-dark font-ibm-plex-arabic leading-relaxed">{review.comment}</p>
                    <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {review.date}</p>
                  </div>
                ))}
              </div>
              {mappedReviews.length > 2 && (
                <div className="mt-6 text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-2 px-4">
                        قراءة كل المراجعات ({mappedReviews.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">جميع المراجعات</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="flex-grow pr-4">
                        <div className="space-y-6">
                          {mappedReviews.map(review => (
                            <div key={review.id} className="border-b border-border pb-4 last:border-b-0">
                              <div className="flex flex-row-reverse items-center justify-end mb-2">
                                <Avatar className="h-10 w-10 ml-3">
                                  <AvatarImage src={review.customerAvatar} alt={review.customerName} />
                                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-brand-text-dark font-ibm-plex-arabic">{review.customerName}</span>
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                              <p className="text-brand-text-dark font-ibm-plex-arabic leading-relaxed">{review.comment}</p>
                              <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {review.date}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar for Action (Pricing & Buttons) */}
        <div className="lg:col-span-1">
          <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 text-right sticky top-24">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-cairo text-brand-text-dark text-2xl">اطلب هذه الخدمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-0">
              <div className="flex justify-between items-center text-xl font-bold text-brand-text-dark font-cairo">
                <span>السعر الأساسي:</span>
                <span className="text-brand-primary">${service.price}</span>
              </div>
              
              {/* Removed placeholder for service options */}

              <Link to={`/client-home/order-service/${service.id}`}>
                <Button className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
                  اطلب الخدمة الآن
                </Button>
              </Link>
              <Button onClick={handleContactProvider} variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                <MessageSquare className="ml-2 h-5 w-5" />
                تواصل مع مقدم الخدمة
              </Button>

              <Separator className="my-6 bg-border" />

              {/* Interactive Buttons */}
              <div className="flex justify-around gap-4">
                <Button variant="outline" size="icon" onClick={handleShare} className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-full shadow-soft">
                  <Share2 className="h-5 w-5" />
                  <span className="sr-only">مشاركة</span>
                </Button>
                <Button variant="outline" size="icon" onClick={handleAddToFavorites} className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-full shadow-soft">
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">إضافة للمفضلة</span>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-full shadow-soft">
                      <HelpCircle className="h-5 w-5" />
                      <span className="sr-only">الأسئلة الشائعة</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">الأسئلة الشائعة</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <Accordion type="single" collapsible className="w-full">
                        {serviceFaqs.length > 0 ? (
                          serviceFaqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border last:border-b-0">
                              <AccordionTrigger className="font-cairo text-brand-text-dark text-lg text-right hover:no-underline hover:text-brand-primary py-4">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-brand-text-muted font-ibm-plex-arabic text-right pb-4">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))
                        ) : (
                          <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد أسئلة شائعة لهذه الخدمة.</p>
                        )}
                      </Accordion>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ClientServiceDetailsPage;