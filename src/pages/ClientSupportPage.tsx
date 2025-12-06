import React from 'react';
// تم إزالة استيراد ClientDashboardLayout
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

const ClientSupportPage = () => {
  const faqs = [
    {
      question: 'كيف يمكنني طلب خدمة جديدة؟',
      answer: 'يمكنك تصفح كتالوج الخدمات، اختيار الخدمة التي تناسبك، ثم النقر على زر "اطلب الخدمة الآن" واتباع الخطوات.',
    },
    {
      question: 'كيف أتواصل مع مقدم الخدمة بعد الطلب؟',
      answer: 'بعد تأكيد الطلب، ستتمكن من التواصل مباشرة مع مقدم الخدمة عبر مركز الرسائل الخاص بك.',
    },
    {
      question: 'ماذا أفعل إذا لم أكن راضياً عن الخدمة؟',
      answer: 'في حال وجود أي مشكلة، يرجى التواصل مع فريق الدعم الفني فوراً وسنعمل على حل المشكلة أو تقديم التعويض المناسب.',
    },
    {
      question: 'هل يمكنني إلغاء طلب بعد تأكيده؟',
      answer: 'تعتمد إمكانية الإلغاء على سياسة مقدم الخدمة والمرحلة التي وصل إليها الطلب. يرجى مراجعة شروط الخدمة أو التواصل مع الدعم.',
    },
  ];

  return (
    <div> {/* تم إزالة ClientDashboardLayout */}
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">الدعم والمساعدة</h1>

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
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">مركز التعلم</h2>
        <Card className="bg-brand-card-bg p-6 rounded-2xl shadow-soft">
          <CardContent className="p-0 text-right">
            <p className="text-brand-text-dark mb-4 font-ibm-plex-arabic">
              استكشف مواردنا التعليمية لمساعدتك في استخدام المنصة بفعالية.
            </p>
            <Link to="/client-dashboard/learning-center"> {/* Placeholder link */}
              <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                اذهب إلى مركز التعلم
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ClientSupportPage;