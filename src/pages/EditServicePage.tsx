import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  imageUrl?: string;
}

const fetchServiceById = async (serviceId: string): Promise<Service> => {
  const response = await fetch(`http://localhost:3000/api/services/${serviceId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch service');
  }
  return response.json();
};

const EditServicePage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: service, isLoading, error } = useQuery<Service, Error>({
    queryKey: ['service', id],
    queryFn: () => fetchServiceById(id!),
    enabled: !!id, // Only run query if id is available
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الخدمة...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل الخدمة: {error.message}</div>
    </DashboardLayout>
  );
  if (!service) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-muted font-ibm-plex-arabic">الخدمة غير موجودة.</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">تعديل الخدمة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form className="space-y-6">
            <div>
              <Label htmlFor="service-title" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">عنوان الخدمة</Label>
              <Input id="service-title" type="text" defaultValue={service.title} required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="service-description" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وصف الخدمة</Label>
              <Textarea id="service-description" defaultValue={service.description} rows={5} required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="service-category" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الفئة</Label>
              <Select defaultValue={service.category}>
                <SelectTrigger id="service-category" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                  <SelectValue placeholder="اختر فئة الخدمة" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                  <SelectItem value="design">تصميم</SelectItem>
                  <SelectItem value="development">تطوير</SelectItem>
                  <SelectItem value="writing">كتابة ومحتوى</SelectItem>
                  <SelectItem value="marketing">تسويق</SelectItem>
                  <SelectItem value="consulting">استشارات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service-price" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">السعر ($)</Label>
              <Input id="service-price" type="number" defaultValue={service.price} required min="0" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="delivery-time" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وقت التسليم (أيام)</Label>
              <Input id="delivery-time" type="number" defaultValue={service.deliveryTime} required min="1" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="service-image" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">صورة الخدمة (اتركها فارغة للحفاظ على الصورة الحالية)</Label>
              <Input id="service-image" type="file" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
              حفظ التعديلات
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default EditServicePage;