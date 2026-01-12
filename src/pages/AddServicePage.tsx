"use client";

import React, { useState } from 'react';
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AddServicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user from auth context
  const PROVIDER_ID = user?.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [deliveryTime, setDeliveryTime] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState(''); // For simplicity, we'll use a text input for image URL

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
      provider_id: PROVIDER_ID, // Use actual provider ID from context
      title,
      description,
      category,
      price: Number(price),
      delivery_time: Number(deliveryTime),
      image_url: imageUrl || '/placeholder.svg', // Use placeholder if no image URL is provided
      location: 'الرياض', // Placeholder location
      service_level: 'مستوى احترافي', // Placeholder service level
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/services`, {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
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
                <SelectItem value="cleaning">نظافة</SelectItem>
                <SelectItem value="home_maintenance">صيانة منزلية</SelectItem>
                <SelectItem value="electricity">كهرباء</SelectItem>
                <SelectItem value="plumbing">سباكة</SelectItem>
                <SelectItem value="carpentry">نجارة</SelectItem>
                <SelectItem value="ac_repair">تكييف</SelectItem>
                <SelectItem value="gardening">حدائق</SelectItem>
                <SelectItem value="furniture_moving">نقل أثاث</SelectItem>
                <SelectItem value="beauty">تجميل</SelectItem>
                <SelectItem value="private_tutoring">تعليم خاص</SelectItem>
                <SelectItem value="photography">تصوير</SelectItem>
                <SelectItem value="event_planning">تنظيم فعاليات</SelectItem>
                <SelectItem value="car_wash">غسيل سيارات</SelectItem>
                <SelectItem value="legal_consulting">استشارات قانونية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="service-price" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">السعر (د.ج)</Label>
            <Input
              id="service-price"
              type="number"
              placeholder="مثال: 15000"
              required
              min="0"
              value={price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(Number(e.target.value))}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeliveryTime(Number(e.target.value))}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
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