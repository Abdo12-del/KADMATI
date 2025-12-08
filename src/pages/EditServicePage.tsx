"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Import useEffect, useCallback
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams, useNavigate

const EditServicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [deliveryTime, setDeliveryTime] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/services/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل جلب تفاصيل الخدمة.');
      }
      const serviceData = await response.json();
      const service = serviceData.data;
      setTitle(service.title);
      setDescription(service.description);
      setCategory(service.category);
      setPrice(service.price);
      setDeliveryTime(service.delivery_time);
      setImageUrl(service.image_url || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || price === '' || deliveryTime === '') {
      toast.error('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    const updatedService = {
      title,
      description,
      category,
      price: Number(price),
      delivery_time: Number(deliveryTime),
      image_url: imageUrl,
    };

    try {
      const response = await fetch(`http://localhost:3000/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedService),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تحديث الخدمة.');
      }

      const result = await response.json();
      toast.success('تم حفظ تعديلات الخدمة بنجاح!');
      console.log('Service updated:', result.data);
      navigate('/dashboard/services'); // Redirect to services list
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حفظ تعديلات الخدمة.');
      console.error('Error updating service:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل تفاصيل الخدمة...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">تعديل الخدمة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="service-title" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">عنوان الخدمة</Label>
              <Input id="service-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="service-description" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وصف الخدمة</Label>
              <Textarea id="service-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="service-category" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الفئة</Label>
              <Select value={category} onValueChange={setCategory} required>
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
              <Input id="service-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required min="0" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="delivery-time" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وقت التسليم (أيام)</Label>
              <Input id="delivery-time" type="number" value={deliveryTime} onChange={(e) => setDeliveryTime(Number(e.target.value))} required min="1" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="service-image" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رابط صورة الخدمة (اختياري)</Label>
              <Input id="service-image" type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="مثال: https://example.com/image.jpg" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
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