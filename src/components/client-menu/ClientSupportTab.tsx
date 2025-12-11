"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card'; // Removed CardHeader, CardTitle
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

// Static FAQs data
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

export const ClientSupportTab = () => {
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const handleSubmitSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    toast.success('تم إرسال رسالتك إلى الدعم الفني بنجاح (وظيفة وهمية)!');
    console.log('Support message sent from modal', { supportName, supportEmail, supportSubject, supportMessage });
    setSupportName('');
    setSupportEmail('');
    setSupportSubject('');
    setSupportMessage('');
  };

  return (
    <>
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
          <form onSubmit={handleSubmitSupportMessage} className="space-y-4">
            <div>
              <Label htmlFor="support-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">اسمك الكامل</Label>
              <Input id="support-name" type="text" placeholder="ادخل اسمك" required value={supportName} onChange={(e) => setSupportName(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="support-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">بريدك الإلكتروني</Label>
              <Input id="support-email" type="email" placeholder="ادخل بريدك الإلكتروني" required value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="support-subject" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الموضوع</Label>
              <Input id="support-subject" type="text" placeholder="موضوع رسالتك" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="support-message" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رسالتك</Label>
              <Textarea id="support-message" placeholder="اكتب رسالتك هنا بالتفصيل..." rows={5} required value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              إرسال الرسالة
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};