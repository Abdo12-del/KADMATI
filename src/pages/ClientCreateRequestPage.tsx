"use client";

import React, { useState } from 'react';
// import ClientHomeHeader from '@/components/ClientHomeHeader'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const ClientCreateRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user from auth context
  const CLIENT_ID = user?.id; // Use actual client ID

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [additionalOptions, setAdditionalOptions] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!CLIENT_ID) {
      toast.error('معرف العميل غير متاح. الرجاء تسجيل الدخول كطالب خدمة.');
      return;
    }

    // Here you would typically send this data to a backend API
    console.log({ title, description, location, dueDate, additionalOptions });

    const newRequest = {
      client_id: CLIENT_ID,
      title,
      description,
      location,
      due_date: dueDate,
      additional_options: additionalOptions,
      status: 'pending', // Default status
    };

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل إرسال الطلب.');
      }

      const result = await response.json();
      toast.success('تم إرسال طلبك بنجاح! سيتم مراجعته من قبل مقدمي الخدمات.');
      console.log('Request added:', result.data);
      navigate('/client-home'); // Redirect to client home after submission
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الطلب.');
      console.error('Error adding request:', error);
    }
  };

  return (
    <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-2xl text-right">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">إضافة طلب خدمة جديد</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="request-title" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">عنوان الطلب</Label>
            <Input
              id="request-title"
              type="text"
              placeholder="مثال: أحتاج شخصًا لصيانة الحديقة"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <div>
            <Label htmlFor="request-description" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وصف تفصيلي</Label>
            <Textarea
              id="request-description"
              placeholder="صف طلبك بالتفصيل، ما هي المهام المطلوبة، وأي تفاصيل أخرى مهمة."
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <div>
            <Label htmlFor="request-location" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الموقع (اختياري)</Label>
            <Input
              id="request-location"
              type="text"
              placeholder="مثال: الرياض، حي النرجس"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <div>
            <Label htmlFor="request-due-date" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">المدة أو الموعد المتوقع (اختياري)</Label>
            <Input
              id="request-due-date"
              type="text" // Can be changed to 'date' or a date picker component later
              placeholder="مثال: خلال أسبوع، أو 2024-12-31"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <div>
            <Label htmlFor="request-options" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">خيارات إضافية (اختياري)</Label>
            <Textarea
              id="request-options"
              placeholder="أي متطلبات خاصة أو تفضيلات إضافية."
              rows={3}
              value={additionalOptions}
              onChange={(e) => setAdditionalOptions(e.target.value)}
              className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
          </div>
          <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
            إرسال الطلب
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientCreateRequestPage;