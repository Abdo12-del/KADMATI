import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface NewService {
  providerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  imageUrl?: string;
}

const createService = async (service: NewService): Promise<Response> => {
  const response = await fetch('http://localhost:3000/api/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(service),
  });
  if (!response.ok) {
    throw new Error('Failed to create service');
  }
  return response.json();
};

const AddServicePage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [deliveryTime, setDeliveryTime] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState(''); // For simplicity, direct URL input

  const addServiceMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerServices'] });
      toast.success('تمت إضافة الخدمة بنجاح!');
      navigate('/dashboard/services');
    },
    onError: (error) => {
      toast.error(`فشل في إضافة الخدمة: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || price === '' || deliveryTime === '') {
      toast.error('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    // In a real app, you'd get the providerId from auth context
    const dummyProviderId = 'provider123'; // Placeholder for current provider

    addServiceMutation.mutate({
      providerId: dummyProviderId,
      title,
      description,
      category,
      price: Number(price),
      deliveryTime: Number(deliveryTime),
      imageUrl: imageUrl || undefined,
    });
  };

  return (
    <DashboardLayout>
      <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">إضافة خدمة جديدة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="service-title" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">عنوان الخدمة</Label>
              <Input
                id="service-title"
                type="text"
                placeholder="مثال: تصميم شعار احترافي"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              />
            </div>
            <div>
              <Label htmlFor="service-description" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وصف الخدمة</Label>
              <Textarea
                id="service-description"
                placeholder="صف خدمتك بالتفصيل..."
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              />
            </div>
            <div>
              <Label htmlFor="service-category" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
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
              <Input
                id="service-price"
                type="number"
                placeholder="مثال: 150"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              />
            </div>
            <div>
              <Label htmlFor="delivery-time" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وقت التسليم (أيام)</Label>
              <Input
                id="delivery-time"
                type="number"
                placeholder="مثال: 3"
                required
                min="1"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(Number(e.target.value))}
                className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              />
            </div>
            <div>
              <Label htmlFor="service-image-url" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رابط صورة الخدمة (اختياري)</Label>
              <Input
                id="service-image-url"
                type="text"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              />
            </div>
            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg" disabled={addServiceMutation.isPending}>
              {addServiceMutation.isPending ? 'جاري الإضافة...' : 'إضافة الخدمة'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AddServicePage;