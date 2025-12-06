import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue">مركز المساعدة والدعم</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">الأسئلة الشائعة</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="font-semibold text-gray-800 font-open-sans text-right hover:no-underline hover:text-light-blue">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 font-open-sans text-right">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">تواصل مع الدعم الفني</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="support-name" className="text-gray-700 font-open-sans">اسمك الكامل</Label>
              <Input id="support-name" type="text" placeholder="ادخل اسمك" required className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="support-email" className="text-gray-700 font-open-sans">بريدك الإلكتروني</Label>
              <Input id="support-email" type="email" placeholder="ادخل بريدك الإلكتروني" required className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="support-subject" className="text-gray-700 font-open-sans">الموضوع</Label>
              <Input id="support-subject" type="text" placeholder="موضوع رسالتك" required className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="support-message" className="text-gray-700 font-open-sans">رسالتك</Label>
              <Textarea id="support-message" placeholder="اكتب رسالتك هنا بالتفصيل..." rows={5} required className="rounded-lg" />
            </div>
            <Button className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg">
              إرسال الرسالة
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SupportCenterPage;