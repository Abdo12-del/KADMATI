"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const SupportCenterPage = () => {
  const faqs = [
    {
      question: 'كيف يمكنني إضافة خدمة جديدة؟',
      answer: 'يمكنك إضافة خدمة جديدة من خلال الذهاب إلى قسم "خدماتي" في لوحة التحكم ثم النقر على زر "إضافة خدمة جديدة".',
    },
    {
      question: 'ما هي رسوم المنصة على الخدمات؟',
      answer: 'تفرض المنصة رسومًا بنسبة 10% على كل خدمة مكتملة وناجحة.',
    },
    {
      question: 'كيف يمكنني التواصل مع العملاء؟',
      answer: 'يمكنك التواصل مع العملاء مباشرة من خلال مركز الرسائل الخاص بك في لوحة التحكم.',
    },
    {
      question: 'ماذا أفعل إذا واجهت مشكلة في طلب ما؟',
      answer: 'في حال واجهت مشكلة، يرجى التواصل مع فريق الدعم الفني عبر نموذج الاتصال في هذه الصفحة أو من خلال البريد الإلكتروني.',
    },
  ];

  const handleSubmitSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Removed dummy toast message
    console.log('Support message sent');
    toast.success('تم إرسال رسالتك إلى الدعم الفني بنجاح!');
  };

  return (
    <>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">مركز المساعدة والدعم</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6">
          <CardHeader className="p-0 pb-4 text-right">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">الأسئلة الشائعة</CardTitle>
          </CardHeader>
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

        <Card className="bg-brand-card-bg rounded-2xl shadow-soft p-6 text-right">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">تواصل مع الدعم الفني</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <form onSubmit={handleSubmitSupportMessage} className="space-y-4">
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
              <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                إرسال الرسالة
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SupportCenterPage;