"use client";

import React from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, User, LayoutList, Share2, Heart, MessageSquare, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner'; // For share functionality

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

// Placeholder data for a service
const service = {
  id: '1',
  title: 'تصميم شعار احترافي',
  description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعكس هويتك ويبرز علامتك التجارية في السوق. يشمل العمل البحث، تطوير المفاهيم، والتعديلات حتى الرضا التام.',
  features: [
    'تصميم شعار واحد بمفاهيم متعددة',
    'تعديلات غير محدودة حتى الرضا التام',
    'تسليم الملفات المصدرية (AI, EPS, SVG)',
    'دعم فني بعد التسليم لمدة 30 يومًا',
    'دليل استخدام الشعار (Brand Guidelines) اختياري',
  ],
  price: 150,
  options: [
    { id: 'opt1', name: 'دليل استخدام الشعار', price: 50 },
    { id: 'opt2', name: 'تصميم بطاقة عمل', price: 30 },
  ],
  provider: {
    id: 'prov1',
    name: 'مصمم جرافيك مبدع',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MG',
    rating: 4.9,
    reviewsCount: 250,
    completedServices: 120,
    bio: 'مصمم جرافيك بخبرة 5 سنوات في تصميم الشعارات والهويات البصرية، أهدف إلى تحويل أفكارك إلى تصاميم بصرية فريدة وجذابة.',
    contactEmail: 'creative.designer@example.com',
    phone: '+966501234567',
  },
  rating: 4.9,
  reviews: [
    { id: 'rev1', customerName: 'أحمد علي', customerAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AA', rating: 5, comment: 'خدمة ممتازة وشعار رائع، أنصح به بشدة!', date: '2023-10-20' },
    { id: 'rev2', customerName: 'فاطمة سعيد', customerAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=FS', rating: 4, comment: 'تصميم جيد جداً وسرعة في التنفيذ، شكراً.', date: '2023-10-25' },
    { id: 'rev3', customerName: 'خالد فهد', customerAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=KF', rating: 5, comment: 'عمل احترافي ودعم فني ممتاز بعد التسليم.', date: '2023-10-18' },
  ],
  deliveryTime: '3 أيام',
  location: 'الرياض',
  serviceLevel: 'مستوى احترافي',
  images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'], // Using existing placeholder
  faqs: [
    { question: 'هل يمكنني طلب تعديلات غير محدودة؟', answer: 'نعم، أقدم تعديلات غير محدودة حتى تكون راضيًا تمامًا عن التصميم النهائي.' },
    { question: 'ما هي صيغ الملفات التي سأستلمها؟', answer: 'ستستلم الملفات المصدرية بصيغ AI, EPS, SVG بالإضافة إلى JPG و PNG بجودة عالية.' },
    { question: 'هل تقدمون خدمة تصميم دليل استخدام الشعار؟', answer: 'نعم، يمكن طلب دليل استخدام الشعار كخيار إضافي.' },
  ]
};

const ClientServiceDetailsPage = () => {
  const handleShare = () => {
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
                <img src={service.images[0]} alt={service.title} className="w-full h-96 object-cover rounded-xl mb-6" />
                
                {/* Service Title */}
                <h1 className="text-4xl font-cairo text-brand-text-dark mb-4 text-right">{service.title}</h1>
                
                {/* Quick Info Icons */}
                <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-2 mb-6 text-brand-text-dark font-ibm-plex-arabic text-right">
                  <div className="flex flex-row-reverse items-center">
                    <span className="font-semibold ml-2">المدة:</span>
                    <Clock className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.deliveryTime}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center">
                    <span className="font-semibold ml-2">الموقع:</span>
                    <MapPin className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.location}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center">
                    <span className="font-semibold ml-2">المستوى:</span>
                    <LayoutList className="h-5 w-5 text-brand-primary" />
                    <span className="font-ibm-plex-arabic">{service.serviceLevel}</span>
                  </div>
                </div>

                <Separator className="my-6 bg-border" />

                {/* Service Description */}
                <h2 className="text-2xl font-cairo text-brand-text-dark mb-4 text-right">وصف الخدمة</h2>
                <p className="text-brand-text-dark text-lg mb-6 font-ibm-plex-arabic text-right leading-relaxed">
                  {service.description}
                </p>

                {/* Service Features/Bullets */}
                <h3 className="text-xl font-cairo text-brand-text-dark mb-3 text-right">ما ستحصل عليه:</h3>
                <ul className="list-disc list-inside text-brand-text-dark space-y-2 font-ibm-plex-arabic text-right pr-5">
                  {service.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
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
                    <AvatarImage src={service.provider.avatarUrl} alt={service.provider.name} />
                    <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{service.provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="font-cairo text-xl text-brand-text-dark font-semibold">{service.provider.name}</p>
                    <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
                      <span className="ml-1">({service.provider.rating})</span>
                      {renderStars(service.provider.rating)}
                    </div>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">
                      {service.provider.completedServices} خدمة مكتملة
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
                        <AvatarImage src={service.provider.avatarUrl} alt={service.provider.name} />
                        <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{service.provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-2xl font-cairo text-brand-text-dark">{service.provider.name}</h3>
                      <div className="flex items-center mt-2">
                        {renderStars(service.provider.rating)}
                        <span className="mr-2 text-brand-text-muted font-ibm-plex-arabic">({service.provider.reviewsCount} تقييم)</span>
                      </div>
                      <p className="text-brand-text-muted font-ibm-plex-arabic mt-1">{service.provider.completedServices} خدمة مكتملة</p>
                    </div>
                    <Separator className="my-4 bg-border" />
                    <div className="space-y-4">
                      <p className="text-brand-text-dark font-ibm-plex-arabic leading-relaxed">{service.provider.bio}</p>
                      <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">البريد الإلكتروني: {service.provider.contactEmail}</p>
                      <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">الهاتف: {service.provider.phone}</p>
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
                  <span className="text-4xl font-cairo text-brand-primary font-bold ml-3">{service.rating}</span>
                  <div className="flex flex-col items-end">
                    {renderStars(service.rating)}
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">بناءً على {service.reviews.length} مراجعة</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {service.reviews.slice(0, 2).map(review => ( // Show first 2 reviews
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
                {service.reviews.length > 2 && (
                  <div className="mt-6 text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-2 px-4">
                          قراءة كل المراجعات ({service.reviews.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                        <DialogHeader className="pb-4">
                          <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">جميع المراجعات</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="flex-grow pr-4">
                          <div className="space-y-6">
                            {service.reviews.map(review => (
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
                
                {service.options && service.options.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-cairo text-brand-text-dark">خيارات إضافية:</h3>
                    {service.options.map(option => (
                      <div key={option.id} className="flex justify-between items-center text-brand-text-dark font-ibm-plex-arabic">
                        <span>{option.name}</span>
                        <span>+${option.price}</span>
                      </div>
                    ))}
                  </div>
                )}

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
                          {service.faqs.map((faq, index) => (
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