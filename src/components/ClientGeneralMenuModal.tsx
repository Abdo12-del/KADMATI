"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ClientServiceCard from '@/components/ClientServiceCard';
import ProviderCard from '@/components/ProviderCard';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star, Edit, Trash2, Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

// Interfaces for fetched data
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  providerId: string;
  rating: number;
  imageUrl?: string;
  reviewsCount: number;
}

interface ProviderProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  // rating: number; // Will be aggregated
  // serviceCount: number; // Will be aggregated
}

interface Rating {
  id: string;
  serviceId: string;
  clientId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  serviceTitle?: string;
  providerName?: string;
  providerAvatarUrl?: string;
}

interface Order {
  id: string;
  serviceId: string;
  clientId: string;
  providerId: string;
  price: number;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  createdAt: string;
  serviceTitle: string;
  providerName: string;
}

// Fetching functions
const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`http://localhost:3000/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

const fetchClientFavoriteServices = async (clientId: string): Promise<Service[]> => {
  // Placeholder: In a real app, this would fetch services marked as favorite by the client
  // For now, returning all services for demonstration
  const response = await fetch('http://localhost:3000/api/services');
  if (!response.ok) throw new Error('Failed to fetch services');
  const services: Service[] = await response.json();

  const servicesWithProviderNames = await Promise.all(
    services.map(async (service) => {
      const providerResponse = await fetch(`http://localhost:3000/api/users/${service.providerId}`);
      const provider = providerResponse.ok ? await providerResponse.json() : null;
      return {
        ...service,
        providerName: provider?.name || 'مقدم خدمة مجهول',
        location: 'غير محدد', // Placeholder as location is not in service model
      };
    })
  );
  return servicesWithProviderNames;
};

const fetchClientFavoriteProviders = async (clientId: string): Promise<ProviderProfile[]> => {
  // Placeholder: In a real app, this would fetch providers marked as favorite by the client
  // For now, returning all providers for demonstration
  const response = await fetch('http://localhost:3000/api/users');
  if (!response.ok) throw new Error('Failed to fetch providers');
  const users: UserProfile[] = await response.json();
  const providers = users.filter(user => user.role === 'provider');

  // For each provider, fetch their services to get rating and count
  const providersWithDetails = await Promise.all(providers.map(async (provider) => {
    const servicesResponse = await fetch(`http://localhost:3000/api/services/provider/${provider.id}`);
    const services: Service[] = servicesResponse.ok ? await servicesResponse.json() : [];
    const totalRating = services.reduce((sum, s) => sum + s.rating, 0);
    const averageRating = services.length > 0 ? totalRating / services.length : 0;

    return {
      id: provider.id,
      name: provider.name,
      avatarUrl: provider.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.name || 'UU'}`,
      rating: averageRating,
      serviceCount: services.length,
    };
  }));
  return providersWithDetails;
};

const fetchClientOrders = async (clientId: string): Promise<Order[]> => {
  const response = await fetch(`http://localhost:3000/api/orders/client/${clientId}`);
  if (!response.ok) throw new Error('Failed to fetch client orders');
  return response.json();
};

const fetchClientRatings = async (clientId: string): Promise<Rating[]> => {
  const response = await fetch(`http://localhost:3000/api/ratings/client/${clientId}`);
  if (!response.ok) throw new Error('Failed to fetch client ratings');
  const ratings: Rating[] = await response.json();

  const ratingsWithDetails = await Promise.all(ratings.map(async (rating) => {
    const serviceResponse = await fetch(`http://localhost:3000/api/services/${rating.serviceId}`);
    const service: Service = serviceResponse.ok ? await serviceResponse.json() : { id: rating.serviceId, title: 'Unknown Service', providerId: '', description: '', category: '', price: 0, deliveryTime: 0, rating: 0, reviewsCount: 0 };
    const providerResponse = await fetch(`http://localhost:3000/api/users/${service.providerId}`);
    const provider: UserProfile = providerResponse.ok ? await providerResponse.json() : { id: service.providerId, name: 'Unknown Provider', email: '' };
    return {
      ...rating,
      serviceTitle: service.title,
      providerName: provider.name,
      providerAvatarUrl: provider.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.name || 'UU'}`,
    };
  }));
  return ratingsWithDetails;
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const ClientGeneralMenuModal = () => {
  const queryClient = useQueryClient();
  // Placeholder for current client ID - replace with actual auth context
  const currentClientId = 'client456';

  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useQuery<UserProfile, Error>({
    queryKey: ['clientProfile', currentClientId],
    queryFn: () => fetchUserProfile(currentClientId),
    enabled: !!currentClientId,
  });

  const { data: favoriteServices = [], isLoading: isLoadingFavServices } = useQuery<Service[], Error>({
    queryKey: ['favoriteServices', currentClientId],
    queryFn: () => fetchClientFavoriteServices(currentClientId),
    enabled: !!currentClientId,
  });

  const { data: favoriteProviders = [], isLoading: isLoadingFavProviders } = useQuery<ProviderProfile[], Error>({
    queryKey: ['favoriteProviders', currentClientId],
    queryFn: () => fetchClientFavoriteProviders(currentClientId),
    enabled: !!currentClientId,
  });

  const { data: clientOrders = [], isLoading: isLoadingClientOrders } = useQuery<Order[], Error>({
    queryKey: ['clientOrdersForMenu', currentClientId],
    queryFn: () => fetchClientOrders(currentClientId),
    enabled: !!currentClientId,
  });

  const { data: myReviews = [], isLoading: isLoadingMyReviews } = useQuery<Rating[], Error>({
    queryKey: ['clientReviews', currentClientId],
    queryFn: () => fetchClientRatings(currentClientId),
    enabled: !!currentClientId,
  });

  // Placeholder for FAQs (can be fetched from API later)
  const faqs = [
    {
      question: 'كيف يمكنني طلب خدمة جديدة؟',
      answer: 'يمكنك تصفح كتالوج الخدمات، اختيار الخدمة التي تناسبك، ثم النقر على زر "اطلب الخدمة الآن" واتباع الخطوات.',
    },
    {
      question: 'كيف أتواصل مع مقدم الخدمة بعد الطلب؟',
      answer: 'بعد تأكيد الطلب، ستتمكن من التواصل مباشرة مع مقدم الخدمة عبر مركز الرسائل الخاص بك.',
    },
  ];

  // Mutations for profile updates (example)
  const updateUserProfileMutation = useMutation({
    mutationFn: (updates: Partial<UserProfile>) => fetch(`http://localhost:3000/api/users/${currentClientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile', currentClientId] });
      toast.success('تم تحديث الملف الشخصي بنجاح!');
    },
    onError: (err) => {
      toast.error(`فشل في تحديث الملف الشخصي: ${err.message}`);
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('profile-name') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('profile-phone') as HTMLInputElement).value;
    updateUserProfileMutation.mutate({ name, phone });
  };

  if (isLoadingProfile) return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">القائمة العامة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل البيانات...</div>
      </DialogContent>
    </Dialog>
  );

  if (profileError) return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">القائمة العامة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل البيانات: {profileError.message}</div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">القائمة العامة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <DialogHeader className="text-right pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark">القائمة العامة</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="profile" className="flex-grow flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-6 bg-brand-background rounded-xl shadow-soft p-2 mb-4 flex-shrink-0">
            <TabsTrigger value="profile" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الإعدادات</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">المفضلة</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الدفع</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">تقييماتي</TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الدعم</TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto pr-2"> {/* This div handles the scrolling for all tab contents */}
            {/* Profile Tab Content */}
            <TabsContent value="profile" className="mt-0">
              <Card className="bg-brand-card-bg p-6 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="font-cairo text-brand-text-dark text-2xl">الملف الشخصي</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="flex flex-col items-center mb-4">
                    <Avatar className="h-20 w-20 mb-3">
                      <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.name} />
                      <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{userProfile?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic">تغيير الصورة</Button>
                  </div>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="profile-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الاسم الكامل</Label>
                      <Input id="profile-name" type="text" defaultValue={userProfile?.name} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                    </div>
                    <div>
                      <Label htmlFor="profile-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
                      <Input id="profile-email" type="email" defaultValue={userProfile?.email} disabled className="rounded-xl shadow-soft bg-brand-background border-none font-ibm-plex-arabic text-right" />
                    </div>
                    <div>
                      <Label htmlFor="profile-phone" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رقم الهاتف</Label>
                      <Input id="profile-phone" type="tel" defaultValue={userProfile?.phone || ''} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                    </div>
                    <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg" disabled={updateUserProfileMutation.isPending}>
                      {updateUserProfileMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab Content */}
            <TabsContent value="settings" className="mt-0">
              <Card className="bg-brand-card-bg p-6 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="font-cairo text-brand-text-dark text-2xl">الإعدادات</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-cairo text-brand-text-dark">تغيير كلمة المرور</h3>
                    <div>
                      <Label htmlFor="current-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الحالية</Label>
                      <Input id="current-password" type="password" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                    </div>
                    <div>
                      <Label htmlFor="new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الجديدة</Label>
                      <Input id="new-password" type="password" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                    </div>
                    <div>
                      <Label htmlFor="confirm-new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">تأكيد كلمة المرور الجديدة</Label>
                      <Input id="confirm-new-password" type="password" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                    </div>
                    <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                      تغيير كلمة المرور
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-cairo text-brand-text-dark">إعدادات الإشعارات</h3>
                    <div className="flex flex-row-reverse items-center justify-between">
                      <Label htmlFor="email-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات عبر البريد الإلكتروني</Label>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex flex-row-reverse items-center justify-between">
                      <Label htmlFor="push-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات فورية</Label>
                      <Switch id="push-notifications" defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-cairo text-brand-text-dark">اللغة</h3>
                    <div>
                      <Label htmlFor="language-select" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">لغة الواجهة</Label>
                      <Select defaultValue="ar">
                        <SelectTrigger id="language-select" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                          <SelectValue placeholder="اختر اللغة" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                      حفظ إعدادات اللغة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab Content */}
            <TabsContent value="favorites" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الخدمات المفضلة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {isLoadingFavServices ? (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">جاري تحميل الخدمات المفضلة...</p>
                ) : favoriteServices.length > 0 ? (
                  favoriteServices.map(service => (
                    <ClientServiceCard key={service.id} service={{
                      ...service,
                      providerName: (service as any).providerName, // Cast to any to access providerName
                      location: (service as any).location, // Cast to any to access location
                    }} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد خدمات في قائمة المفضلة.</p>
                )}
              </div>

              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">مقدمو الخدمات المفضلون</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingFavProviders ? (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">جاري تحميل مقدمي الخدمات المفضلين...</p>
                ) : favoriteProviders.length > 0 ? (
                  favoriteProviders.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا يوجد مقدمو خدمات في قائمة المفضلة.</p>
                )}
              </div>
            </TabsContent>

            {/* Payments Tab Content */}
            <TabsContent value="payments" className="mt-0">
              <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6">
                <CardHeader className="p-0 pb-4 text-right">
                  <CardTitle className="font-cairo text-brand-text-dark text-2xl">سجل المعاملات</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingClientOrders ? (
                    <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">جاري تحميل سجل المعاملات...</p>
                  ) : clientOrders.length > 0 ? (
                    <Table className="text-right">
                      <TableCaption className="font-ibm-plex-arabic text-right">قائمة بجميع معاملاتك السابقة.</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">الخدمة</TableHead>
                          <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">المبلغ</TableHead>
                          <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">التاريخ</TableHead>
                          <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">الحالة</TableHead>
                          <TableHead className="text-brand-text-dark font-semibold font-cairo text-right">مقدم الخدمة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientOrders.map(order => (
                          <TableRow key={order.id}>
                            <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{order.serviceTitle}</TableCell>
                            <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">${order.price.toFixed(2)}</TableCell>
                            <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={getStatusBadgeVariant(order.status)} className="rounded-md font-ibm-plex-arabic">
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-ibm-plex-arabic text-brand-text-dark text-right">{order.providerName}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-brand-text-muted font-ibm-plex-arabic text-right">لا توجد معاملات سابقة.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-soft bg-brand-background p-6 mt-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="font-cairo text-brand-text-dark text-2xl">طرق الدفع</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <p className="text-brand-text-muted font-ibm-plex-arabic">لا توجد طرق دفع محفوظة حاليًا.</p>
                  <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                    إضافة طريقة دفع جديدة
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab Content */}
            <TabsContent value="reviews" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">تقييماتي</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingMyReviews ? (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">جاري تحميل تقييماتك...</p>
                ) : myReviews.length > 0 ? (
                  myReviews.map(review => (
                    <Card key={review.id} className="bg-brand-card-bg rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 p-6">
                      <CardHeader className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-0 pb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={review.providerAvatarUrl} alt={review.providerName} />
                          <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{review.providerName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="text-right">
                          <CardTitle className="text-lg font-cairo text-brand-text-dark">{review.serviceTitle}</CardTitle>
                          <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">مقدم الخدمة: {review.providerName}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 space-y-3 text-right">
                        <div className="flex justify-end">{renderStars(review.rating)}</div>
                        <p className="text-brand-text-dark font-ibm-plex-arabic">{review.comment}</p>
                        <p className="text-xs text-brand-text-muted mt-2 font-ibm-plex-arabic">بتاريخ: {new Date(review.createdAt).toLocaleDateString('ar-EG')}</p>
                        <div className="flex justify-end gap-3 mt-4">
                          <Button variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic">
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </Button>
                          <Button variant="destructive" size="sm" className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg shadow-soft font-ibm-plex-arabic">
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لم تقم بتقييم أي خدمات بعد.</p>
                )}
              </div>
            </TabsContent>

            {/* Support Tab Content */}
            <TabsContent value="support" className="mt-0">
              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">الأسئلة الشائعة</h2>
              <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 mb-6">
                <CardContent className="p-0">
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
                </CardContent>
              </Card>

              <h2 className="text-xl font-cairo text-brand-text-dark mb-4 text-right">تواصل مع الدعم الفني</h2>
              <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 text-right">
                <CardContent className="p-0 space-y-4">
                  <div>
                    <Label htmlFor="support-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">اسمك الكامل</Label>
                    <Input id="support-name" type="text" placeholder="ادخل اسمك" required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                  </div>
                  <div>
                    <Label htmlFor="support-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">بريدك الإلكتروني</Label>
                    <Input id="support-email" type="email" placeholder="ادخل بريدك الإلكتروني" required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                  </div>
                  <div>
                    <Label htmlFor="support-subject" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الموضوع</Label>
                    <Input id="support-subject" type="text" placeholder="موضوع رسالتك" required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                  </div>
                  <div>
                    <Label htmlFor="support-message" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رسالتك</Label>
                    <Textarea id="support-message" placeholder="اكتب رسالتك هنا بالتفصيل..." rows={5} required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                  </div>
                  <Button className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                    إرسال الرسالة
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
          <div className="mt-6 border-t border-border pt-4 text-center flex-shrink-0">
            <Button asChild variant="destructive" className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              <Link to="/login">
                <LogOut className="ml-2 h-5 w-5" />
                تسجيل الخروج
              </Link>
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};