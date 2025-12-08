"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const AddServicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user from auth context
  const PROVIDER_ID = user?.id; // Use actual provider ID

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [deliveryTime, setDeliveryTime] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState(''); // Added state for location
  const [serviceLevel, setServiceLevel] = useState(''); // Added state for service level

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!PROVIDER_ID) {
      toast.error('معرف مقدم الخدمة غير متاح. الرجاء تسجيل الدخول كمقدم خدمة.');
      return;
    }

    if (!title || !description || !category || price === '' || deliveryTime === '') {
      toast.error('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    const newService = {
      provider_id: PROVIDER_ID,
      title,
      description,
      category,
      price: Number(price),
      delivery_time: Number(deliveryTime),
      image_url: imageUrl || '/placeholder.svg',
      location: location || 'غير محدد', // Use state for location
      service_level: serviceLevel || 'غير محدد', // Use state for service level
    };

    try {
      const response = await fetch('http://localhost:3000/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إضافة الخدمة.');
      }

      const result = await response.json();
      toast.success('تمت إضافة الخدمة بنجاح!');
      console.log('Service added:', result.data);
      navigate('/dashboard/services'); // Redirect to services list
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الخدمة.');
      console.error('Error adding service:', error);
    }
  };

  return (
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
            <Label htmlFor="service-image" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رابط صورة الخدمة (اختياري)</Label>
            <Input
              id="service-image"
              type="text"
              placeholder="مثال: https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <div>
            <Label htmlFor="service-location" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الموقع (اختياري)</Label>
            <Input
              id="service-location"
              type="text"
              placeholder="مثال: الرياض"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <div>
            <Label htmlFor="service-level" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">مستوى الخدمة (اختياري)</Label>
            <Input
              id="service-level"
              type="text"
              placeholder="مثال: مستوى احترافي"
              value={serviceLevel}
              onChange={(e) => setServiceLevel(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
            إضافة الخدمة
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddServicePage;