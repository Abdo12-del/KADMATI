"use client";

import React from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useParams } from 'react-router-dom';
import { Star, Clock, MapPin, User, LayoutList, Share2, Heart, MessageSquare, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner'; // For share functionality
import { useQuery } from '@tanstack/react-query';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  imageUrl?: string;
  rating: number;
  reviewsCount: number;
  providerId: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  bio?: string;
  avatarUrl?: string;
  phone?: string;
}

interface Rating {
  id: string;
  serviceId: string;
  clientId: string;
  rating: number;
  comment?: string;
  createdAt?: Date;
  clientName?: string; // Joined from user table
  clientAvatarUrl?: string; // Joined from user table
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

const fetchServiceDetails = async (serviceId: string): Promise<Service> => {
  const response = await fetch(`http://localhost:3000/api/services/${serviceId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch service details');
  }
  return response.json();
};

const fetchProviderDetails = async (providerId: string): Promise<UserProfile> => {
  const response = await fetch(`http://localhost:3000/api/users/${providerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch provider details');
  }
  return response.json();
};

const fetchServiceRatings = async (serviceId: string): Promise<Rating[]> => {
  const response = await fetch(`http://localhost:3000/api/ratings/service/${serviceId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch service ratings');
  }
  const ratings = await response.json();

  // Fetch client details for each rating
  const ratingsWithClientDetails = await Promise.all(ratings.map(async (rating: Rating) => {
    const clientResponse = await fetch(`http://localhost:3000/api/users/${rating.clientId}`);
    const client = clientResponse.ok ? await clientResponse.json() : null;
    return {
      ...rating,
      clientName: client?.name || 'مستخدم مجهول',
      clientAvatarUrl: client?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${client?.name || 'UU'}`,
    };
  }));
  return ratingsWithClientDetails;
};

const ClientServiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: service, isLoading: isLoadingService, error: serviceError } = useQuery<Service, Error>({
    queryKey: ['serviceDetails', id],
    queryFn: () => fetchServiceDetails(id!),
    enabled: !!id,
  });

  const { data: provider, isLoading: isLoadingProvider, error: providerError } = useQuery<UserProfile, Error>({
    queryKey: ['providerDetails', service?.providerId],
    queryFn: () => fetchProviderDetails(service!.providerId),
    enabled: !!service?.providerId,
  });

  const { data: reviews, isLoading: isLoadingReviews, error: reviewsError } = useQuery<Rating[], Error>({
    queryKey: ['serviceRatings', id],
    queryFn: () => fetchServiceRatings(id!),
    enabled: !!id,
  });

  // Placeholder for FAQs (can be fetched from API later)
  const faqs = [
    { question: 'هل يمكنني طلب تعديلات غير محدودة؟', answer: 'نعم، أقدم تعديلات غير محدودة حتى تكون راضيًا تمامًا عن التصميم النهائي.' },
    { question: 'ما هي صيغ الملفات التي سأستلمها؟', answer: 'ستستلم الملفات المصدرية بصيغ AI, EPS, SVG بالإضافة إلى JPG و PNG بجودة عالية.' },
    { question: 'هل تقدمون خدمة تصميم دليل استخدام الشعار؟', answer: 'نعم، يمكن طلب دليل استخدام الشعار كخيار إضافي.' },
  ];

  const handleShare = () => {
    if (!service) return;
    if (navigator.share) {
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
    toast.success('تمت إضافة الخدمة إلى المفضلة!');
    // Logic to add to favorites
  };

  if (isLoadingService || isLoadingProvider || isLoadingReviews) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل تفاصيل الخدمة...
      </main>
      <Footer />
    </div>
  );

  if (serviceError || providerError || reviewsError) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-danger font-ibm-plex-arabic">
        خطأ في تحميل البيانات: {serviceError?.message || providerError?.message || reviewsError?.message}
      </main>
      <Footer />
    </div>
  );

  if (!service || !provider) return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 text-center text-brand-text-muted font-ibm-plex-arabic">
        الخدمة غير موجودة.
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="bg-brand-card-bg mb-8 rounded-2xl shadow-soft p-6">
              <CardContent className="p-0">
                {/* Service Image/Carousel */}
                <img src={service.imageUrl || '/placeholder.svg'} alt={service.title} className="w-full h-96 object-cover rounded-xl mb-6" />
                
                {/* Service Title */}
                <h1 className="text-4xl font-cairo text-brand-text-dark mb-4 text-right">{service.title}</h1>
                
                {/* Quick Info Icons */}
                <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-2 mb-6 text-brand-text-dark font-ibm-plex-arabic text-right">
                  <div className="flex flex-row-reverse items-center">
                    <span className="font-semibold ml-2">المدة:</span>
                    <Clock className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.deliveryTime} أيام</span>
                  </div>
                  {/* <div className="flex flex-row-reverse items-center">
                    <span className="font-semibold ml-2">الموقع:</span>
                    <MapPin className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.location}</span>
                  </div> */}
                  <div className="flex flex-row-reverse items-center">
                    <span className="font-semibold ml-2">الفئة:</span>
                    <LayoutList className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.category}</span>
                  </div>
                </div>

                <Separator className="my-6 bg-border" />

                {/* Service Description */}
                <h2 className="text-2xl font-cairo text-brand-text-dark mb-4 text-right">وصف الخدمة</h2>
                <p className="text-brand-text-dark text-lg mb-6 font-ibm-plex-arabic text-right leading-relaxed">
                  {service.description}
                </p>

                {/* Service Features/Bullets (Placeholder, not in current service model) */}
                {/* <h3 className="text-xl font-cairo text-brand-text-dark mb-3 text-right">ما ستحصل عليه:</h3>
                <ul className="list-disc list-inside text-brand-text-dark space-y-2 font-ibm-plex-arabic text-right pr-5">
                  {service.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul> */}
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
                    <AvatarImage src={provider.avatarUrl} alt={provider.name} />
                    <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="font-cairo text-xl text-brand-text-dark font-semibold">{provider.name}</p>
                    <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
                      <span className="ml-1">({service.rating})</span>
                      {renderStars(service.rating)}
                    </div>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">
                      {service.reviewsCount} تقييم
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
                        <AvatarImage src={provider.avatarUrl} alt={provider.name} />
                        <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-2xl font-cairo text-brand-text-dark">{provider.name}</h3>
                      <div className="flex items-center mt-2">
                        {renderStars(service.rating)} {/* Using service rating for provider profile for now */}
                        <span className="mr-2 text-brand-text-muted font-ibm-plex-arabic">({service.reviewsCount} تقييم)</span>
                      </div>
                      {/* <p className="text-brand-text-muted font-ibm-plex-arabic mt-1">{provider.completedServices} خدمة مكتملة</p> */}
                    </div>
                    <Separator className="my-4 bg-border" />
                    <div className="space-y-4">
                      <p className="text-brand-text-dark font-ibm-plex-arabic leading-relaxed">{provider.bio || 'لا يوجد وصف.'}</p>
                      <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">البريد الإلكتروني: {provider.email}</p>
                      {provider.phone && <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">الهاتف: {provider.phone}</p>}
                    </div>
                    <div className="mt-6 text-center">
                      <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
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
                  <span className="text-4xl font-cairo text-brand-primary font-bold ml-3">{service.rating.toFixed(1)}</span>
                  <div className="flex flex-col items-end">
                    {renderStars(service.rating)}
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">بناءً على {service.reviewsCount} مراجعة</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews && reviews.length > 0 ? (
                    reviews.slice(0, 2).map(review => ( // Show first 2 reviews
                      <div key={review.id} className="border-b border-border pb-4 last:border-b-0 text-right">
                        <div className="flex flex-row-reverse items-center justify-end mb-2">
                          <Avatar className="h-10 w-10 ml-3">
                            <AvatarImage src={review.clientAvatarUrl} alt={review.clientName} />
                            <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.clientName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-brand-text-dark font-ibm-plex-arabic">{review.clientName}</span>
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-brand-text-dark font-ibm-plex-arabic leading-relaxed">{review.comment}</p>
                        <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {new Date(review.createdAt!).toLocaleDateString('ar-EG')}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد تقييمات لهذه الخدمة بعد.</p>
                  )}
                </div>
                {reviews && reviews.length > 2 && (
                  <div className="mt-6 text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-2 px-4">
                          قراءة كل المراجعات ({reviews.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                        <DialogHeader className="pb-4">
                          <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">جميع المراجعات</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="flex-grow pr-4">
                          <div className="space-y-6">
                            {reviews.map(review => (
                              <div key={review.id} className="border-b border-border pb-4 last:border-b-0">
                                <div className="flex flex-row-reverse items-center justify-end mb-2">
                                  <Avatar className="h-10 w-10 ml-3">
                                    <AvatarImage src={review.clientAvatarUrl} alt={review.clientName} />
                                    <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.clientName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col items-end">
                                    <span className="font-semibold text-brand-text-dark font-ibm-plex-arabic">{review.clientName}</span>
                                    {renderStars(review.rating)}
                                  </div>
                                </div>
                                <p className="text-brand-text-dark font-ibm-plex-arabic leading-relaxed">{review.comment}</p>
                                <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {new Date(review.createdAt!).toLocaleDateString('ar-EG')}</p>
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
                
                {/* service.options (Placeholder, not in current service model) */}
                {/* {service.options && service.options.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-cairo text-brand-text-dark">خيارات إضافية:</h3>
                    {service.options.map(option => (
                      <div key={option.id} className="flex justify-between items-center text-brand-text-dark font-ibm-plex-arabic">
                        <span>{option.name}</span>
                        <span>+${option.price}</span>
                      </div>
                    ))}
                  </div>
                )} */}

                <Button className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
                  اطلب الخدمة الآن
                </Button>
                <Button variant="outline" className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
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
                          {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border last:border-b-0">
                              <AccordionTrigger className="font-cairo text-brand-text-dark text-lg text-right hover:no-underline hover:text-brand-primary py-4">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-brand-text-muted font-ibm-plex-arabic text-right pb-4">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientServiceDetailsPage;