"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
// import ClientHomeHeader from '@/components/ClientHomeHeader'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, Link } from 'react-router-dom'; // Import Link
import { Star, Clock, MapPin, LayoutList, Share2, Heart, MessageSquare, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { SubmitRatingDialog } from '@/components/SubmitRatingDialog'; // Import SubmitRatingDialog
import { formatNumberArabic, formatCurrencyArabic } from '@/lib/number-formatter'; // Import formatters

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
  favorite_service_ids?: number[];
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ClientServiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoggedIn, updateUserFavorites } = useAuth(); // Get user and updateUserFavorites from auth context
  const [service, setService] = useState<ServiceData | null>(null);
  const [provider, setProvider] = useState<UserData | null>(null);
  const [reviews, setReviews] = useState<RatingData[]>([]);
  const [reviewCustomers, setReviewCustomers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

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

      // Fetch provider details
      const providerResponse = await fetch(`${API_BASE_URL}/api/users/${fetchedService.provider_id}`);
      if (!providerResponse.ok) {
        const errorData = await providerResponse.json();
        throw new Error(errorData.message || 'فشل جلب معلومات مقدم الخدمة.');
      }
      const providerResult = await providerResponse.json();
      setProvider(providerResult.data);

      // Fetch ratings for this service
      const ratingsResponse = await fetch(`${API_BASE_URL}/api/ratings`);
      if (!ratingsResponse.ok) {
        const errorData = await ratingsResponse.json();
        throw new Error(errorData.message || 'فشل جلب التقييمات.');
      }
      const ratingsResult = await ratingsResponse.json();
      const serviceReviews = ratingsResult.data.filter((r: RatingData) => r.service_id === fetchedService.id);
      setReviews(serviceReviews);

      // Fetch users for reviews
      const usersResponse = await fetch(`${API_BASE_URL}/api/users`);
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين للتقييمات.');
      }
      const usersResult = await usersResponse.json();
      setReviewCustomers(usersResult.data);

      // Check if service is in user's favorites
      if (user && user.favorite_service_ids && fetchedService.id) {
        setIsFavorite(user.favorite_service_ids.includes(fetchedService.id));
      }

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب تفاصيل الخدمة.');
    } finally {
      setLoading(false);
    }
  }, [id, user]); // Depend on user to re-check favorites

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

  const handleToggleFavorite = async () => {
    if (!isLoggedIn || !user || !service) {
      toast.error('الرجاء تسجيل الدخول لإدارة المفضلة.');
      return;
    }
    try {
      if (isFavorite) {
        await updateUserFavorites(service.id, 'remove');
        setIsFavorite(false);
      } else {
        await updateUserFavorites(service.id, 'add');
        setIsFavorite(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحديث المفضلة.');
    }
  };

  const handleContactProvider = () => {
    toast.info('سيتم فتح نافذة محادثة مع مقدم الخدمة (وظيفة وهمية)!');
    console.log('Contact provider clicked');
  };

  // Dynamic service features based on category
  const getServiceFeatures = (category: string) => {
    switch (category) {
      case 'cleaning':
        return [
          'تنظيف شامل للمنزل/المكتب',
          'استخدام مواد تنظيف صديقة للبيئة',
          'تنظيف النوافذ والأرضيات',
          'تعقيم وتطهير الحمامات والمطابخ',
        ];
      case 'home_maintenance':
        return [
          'فحص عام للمنزل',
          'إصلاحات خفيفة (أبواب، شبابيك، أثاث)',
          'صيانة وقائية للأجهزة',
          'خدمة سريعة وفعالة',
        ];
      case 'electricity':
        return [
          'إصلاح الأعطال الكهربائية',
          'تركيب وصيانة الإضاءة',
          'تمديد وتركيب الدوائر الكهربائية',
          'فحص السلامة الكهربائية',
        ];
      case 'plumbing':
        return [
          'إصلاح تسربات المياه',
          'تركيب وصيانة الأدوات الصحية',
          'تسليك المجاري',
          'فحص شبكات المياه والصرف',
        ];
      case 'carpentry':
        return [
          'تصنيع وتركيب الأثاث الخشبي',
          'إصلاح الأبواب والنوافذ الخشبية',
          'تصميم ديكورات خشبية مخصصة',
          'خدمة تفصيل حسب الطلب',
        ];
      case 'ac_repair':
        return [
          'صيانة وتنظيف مكيفات الهواء',
          'إصلاح أعطال التبريد والتسخين',
          'إعادة تعبئة غاز الفريون',
          'تركيب وفك المكيفات',
        ];
      case 'gardening':
        return [
          'تصميم وتنسيق الحدائق',
          'زراعة وصيانة النباتات والأشجار',
          'تقليم الأشجار والشجيرات',
          'تركيب أنظمة الري',
        ];
      case 'furniture_moving':
        return [
          'تغليف ونقل الأثاث بأمان',
          'فك وتركيب الأثاث',
          'توفير عمالة مدربة',
          'خدمة نقل داخل وخارج المدينة',
        ];
      case 'beauty':
        return [
          'خدمات العناية بالشعر (قص، صبغ، تسريحات)',
          'خدمات العناية بالأظافر (مانيكير، باديكير)',
          'مكياج احترافي للمناسبات',
          'جلسات عناية بالبشرة',
        ];
      case 'private_tutoring':
        return [
          'دروس خصوصية لجميع المراحل الدراسية',
          'مراجعة للمناهج الدراسية',
          'تحضير للاختبارات والامتحانات',
          'متابعة أكاديمية مستمرة',
        ];
      case 'photography':
        return [
          'جلسات تصوير احترافية (شخصية، منتجات، فعاليات)',
          'معالجة وتعديل الصور',
          'تسليم الصور بجودة عالية',
          'إمكانية توفير ألبومات مطبوعة',
        ];
      case 'event_planning':
        return [
          'تخطيط وتنظيم الحفلات والمناسبات',
          'توفير الديكورات والمستلزمات',
          'تنسيق مع الموردين (طعام، موسيقى)',
          'إدارة الحدث من البداية للنهاية',
        ];
      case 'car_wash':
        return [
          'غسيل خارجي وداخلي للسيارات',
          'تلميع وتشميع الهيكل الخارجي',
          'تنظيف وتطهير المقاعد',
          'خدمة غسيل متنقلة (حسب التوفر)',
        ];
      case 'legal_consulting':
        return [
          'استشارات قانونية في مختلف المجالات',
          'صياغة ومراجعة العقود',
          'تمثيل قانوني (حسب الاتفاق)',
          'تقديم المشورة في القضايا الشخصية والتجارية',
        ];
      default:
        return ['لا توجد ميزات محددة لهذه الفئة.'];
    }
  };

  // Dynamic service FAQs based on category
  const getServiceFaqs = (category: string) => {
    switch (category) {
      case 'cleaning':
        return [
          { question: 'هل يمكنني طلب تنظيف عميق؟', answer: 'نعم، نقدم خدمة التنظيف العميق بالإضافة إلى التنظيف العادي.' },
          { question: 'هل تشمل الخدمة مواد التنظيف؟', answer: 'نعم، جميع مواد التنظيف يتم توفيرها من قبلنا.' },
        ];
      case 'home_maintenance':
        return [
          { question: 'ما هو وقت الاستجابة للطوارئ؟', answer: 'نحاول الاستجابة لطلبات الطوارئ في أقرب وقت ممكن، عادة خلال ساعتين.' },
          { question: 'هل تقدمون ضمانًا على الإصلاحات؟', answer: 'نعم، نقدم ضمانًا على جميع أعمال الصيانة والإصلاح.' },
        ];
      case 'electricity':
        return [
          { question: 'هل يمكنكم تركيب عداد كهرباء جديد؟', answer: 'نعم، نقدم خدمات تركيب العدادات الجديدة وتحديث القديمة.' },
          { question: 'هل لديكم فنيون معتمدون؟', answer: 'نعم، جميع فنيينا معتمدون وذوي خبرة.' },
        ];
      case 'plumbing':
        return [
          { question: 'هل يمكنكم إصلاح تسربات المياه المخفية؟', answer: 'نعم، لدينا أجهزة كشف التسربات الحديثة لإصلاح التسربات المخفية.' },
          { question: 'هل تعملون في أيام العطل؟', answer: 'نعم، نقدم خدمات طوارئ السباكة على مدار الساعة وطوال أيام الأسبوع.' },
        ];
      case 'carpentry':
        return [
          { question: 'هل يمكنني طلب تصميم أثاث مخصص؟', answer: 'نعم، نقدم خدمة تصميم وتصنيع الأثاث حسب طلب العميل.' },
          { question: 'ما هي أنواع الخشب التي تستخدمونها؟', answer: 'نستخدم مجموعة متنوعة من الأخشاب عالية الجودة مثل الزان، البلوط، والماهوجني.' },
        ];
      case 'ac_repair':
        return [
          { question: 'كم يستغرق تنظيف المكيف؟', answer: 'عادة ما يستغرق تنظيف المكيف حوالي ساعة إلى ساعتين حسب نوع المكيف وحالته.' },
          { question: 'هل تقدمون خدمة صيانة دورية؟', answer: 'نعم، نقدم عقود صيانة دورية للمكيفات لضمان عملها بكفاءة.' },
        ];
      case 'gardening':
        return [
          { question: 'هل يمكنكم تصميم حديقة صغيرة؟', answer: 'نعم، نقدم خدمات تصميم الحدائق بجميع الأحجام، بما في ذلك الحدائق الصغيرة.' },
          { question: 'هل تشمل الخدمة توريد النباتات؟', answer: 'نعم، يمكننا توريد النباتات والأشجار المطلوبة ضمن الخدمة.' },
        ];
      case 'furniture_moving':
        return [
          { question: 'هل توفرون مواد تغليف للأثاث؟', answer: 'نعم، نوفر جميع مواد التغليف اللازمة لحماية الأثاث أثناء النقل.' },
          { question: 'هل يمكنكم نقل الأثاث بين المدن؟', answer: 'نعم، نقدم خدمات نقل الأثاث داخل وخارج المدينة.' },
        ];
      case 'beauty':
        return [
          { question: 'هل يمكنني حجز موعد في المنزل؟', answer: 'نعم، نقدم خدمات التجميل المنزلية حسب الموعد.' },
          { question: 'هل تستخدمون منتجات عضوية؟', answer: 'نعم، يمكننا استخدام منتجات عضوية بناءً على طلب العميل.' },
        ];
      case 'private_tutoring':
        return [
          { question: 'هل يمكنني اختيار المدرس؟', answer: 'نعم، يمكنك اختيار المدرس المناسب من قائمة المدرسين المتاحين.' },
          { question: 'هل تقدمون دروسًا عبر الإنترنت؟', answer: 'نعم، نقدم دروسًا خصوصية حضورية وعبر الإنترنت.' },
        ];
      case 'photography':
        return [
          { question: 'كم عدد الصور التي سأستلمها؟', answer: 'يعتمد عدد الصور على باقة التصوير المختارة، ولكن عادة ما تكون عشرات الصور عالية الجودة.' },
          { question: 'هل يمكنني طلب طباعة الصور؟', answer: 'نعم، نقدم خدمات طباعة الصور وتصميم الألبومات كخدمة إضافية.' },
        ];
      case 'event_planning':
        return [
          { question: 'هل يمكنكم تنظيم حفلات أعياد الميلاد؟', answer: 'نعم، لدينا خبرة في تنظيم جميع أنواع الحفلات والمناسبات، بما في ذلك أعياد الميلاد.' },
          { question: 'هل تقدمون خدمات الترفيه؟', answer: 'نعم، يمكننا توفير خدمات الترفيه مثل الدي جي، الفرق الموسيقية، وعروض الأطفال.' },
        ];
      case 'car_wash':
        return [
          { question: 'هل خدمة الغسيل المتنقل متاحة في جميع المناطق؟', answer: 'تعتمد خدمة الغسيل المتنقل على المنطقة، يرجى التحقق من التوفر عند الحجز.' },
          { question: 'كم يستغرق غسيل السيارة؟', answer: 'عادة ما يستغرق غسيل السيارة حوالي 30-60 دقيقة حسب نوع الخدمة المطلوبة.' },
        ];
      case 'legal_consulting':
        return [
          { question: 'هل يمكنني الحصول على استشارة مجانية؟', answer: 'نقدم استشارة أولية مجانية لتقييم حالتك.' },
          { question: 'هل يمكنكم تمثيلي في المحكمة؟', answer: 'نعم، يمكننا تقديم التمثيل القانوني في المحكمة بعد الاتفاق على التفاصيل.' },
        ];
      default:
        return [{ question: 'لا توجد أسئلة شائعة محددة لهذه الفئة.', answer: 'يرجى التواصل معنا مباشرة لأي استفسارات.' }];
    }
  };

  const serviceFeatures = service ? getServiceFeatures(service.category) : [];
  const serviceFaqs = service ? getServiceFaqs(service.category) : [];

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
                  <span className="font-ibm-plex-arabic">{formatNumberArabic(service.delivery_time)} أيام</span>
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
              <h3 className="text-xl font-cairo text-brand-text-dark mb-3 text-right">ما ستحصل عليه:</h3>
              <ul className="list-disc list-inside text-brand-text-dark space-y-2 font-ibm-plex-arabic text-right pr-5">
                {serviceFeatures.map((feature, index) => ( // Using placeholder features
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
                  <AvatarImage src={provider.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.name.split(' ').map(n => n[0]).join('')}`} alt={provider.name} />
                  <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="font-cairo text-xl text-brand-text-dark font-semibold">{provider.name}</p>
                  <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
                    <span className="ml-1">({formatNumberArabic(service.rating)})</span>
                    {renderStars(service.rating || 0)}
                  </div>
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">
                    {formatNumberArabic(service.reviews_count)} خدمة مكتملة
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
                      <span className="mr-2 text-brand-text-muted font-ibm-plex-arabic">({formatNumberArabic(service.reviews_count)} تقييم)</span>
                    </div>
                    <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">
                      {formatNumberArabic(service.reviews_count)} خدمة مكتملة
                    </p>
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
                <span className="text-4xl font-cairo text-brand-primary font-bold ml-3">{formatNumberArabic(parseFloat(service.rating?.toFixed(1) || '0.0'))}</span>
                <div className="flex flex-col items-end">
                  {renderStars(service.rating || 0)}
                  <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">بناءً على {formatNumberArabic(mappedReviews.length)} مراجعة</p>
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
                        قراءة كل المراجعات ({formatNumberArabic(mappedReviews.length)})
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
                <span className="text-brand-primary">{formatCurrencyArabic(service.price)}</span>
              </div>
              
              {/* Placeholder for service options */}
              {/* {service.options && service.options.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-cairo text-brand-text-dark">خيارات إضافية:</h3>
                  {service.options.map(option => (
                    <div key={option.id} className="flex justify-between items-center text-brand-text-dark font-ibm-plex-arabic">
                      <span>{option.name}</span>
                      <span>+{option.price} د.ج</span>
                    </div>
                  ))}
                </div>
              )} */}

              <Link to={`/client-home/order-service/${service.id}`}> {/* Updated link */}
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className={`border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-full shadow-soft ${isFavorite ? 'bg-brand-primary text-white hover:bg-brand-primary-dark' : ''}`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-white' : ''}`} />
                  <span className="sr-only">{isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}</span>
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
                        {serviceFaqs.map((faq, index) => ( // Using placeholder FAQs
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
              {isLoggedIn && user?.role === 'seeker' && service.id && service.title && (
                <SubmitRatingDialog
                  serviceId={service.id}
                  serviceTitle={service.title}
                  onRatingSubmitted={fetchServiceDetails} // Refresh reviews after submission
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ClientServiceDetailsPage;