"use client";

import React, { useState } from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NewRequest {
  clientId: string;
  title: string;
  description: string;
  location?: string;
  dueDate?: string;
  additionalOptions?: string;
}

const createRequest = async (request: NewRequest): Promise<Response> => {
  const response = await fetch('http://localhost:3000/api/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error('Failed to create request');
  }
  return response.json();
};

const ClientCreateRequestPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [additionalOptions, setAdditionalOptions] = useState('');

  const addRequestMutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientRequests'] }); // Invalidate client requests cache
      toast.success('تم إرسال طلبك بنجاح! سيتم مراجعته من قبل مقدمي الخدمات.');
      navigate('/client-home'); // Redirect to client home after submission
    },
    onError: (error) => {
      toast.error(`فشل في إرسال الطلب: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('الرجاء ملء عنوان الطلب والوصف.');
      return;
    }

    // Placeholder for current client ID - replace with actual auth context
    const currentClientId = 'client456';

    addRequestMutation.mutate({
      clientId: currentClientId,
      title,
      description,
      location: location || undefined,
      dueDate: dueDate || undefined,
      additionalOptions: additionalOptions || undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader />
      <main className="flex-grow container mx-auto px-8 py-10 flex items-center justify-center">
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
              <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg" disabled={addRequestMutation.isPending}>
                {addRequestMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ClientCreateRequestPage;