import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
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
    <ClientDashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-dark-blue text-right">الدعم والمساعدة</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-2xl shadow-soft-neumorphism bg-soft-white">
          <CardHeader className="text-right">
            <CardTitle className="font-montserrat text-dark-blue">الأسئلة الشائعة</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                  <AccordionTrigger className="font-semibold text-gray-800 font-inter text-right hover:no-underline hover:text-light-blue">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 font-inter text-right">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft-neumorphism bg-soft-white">
          <CardHeader className="text-right">
            <CardTitle className="font-montserrat text-dark-blue">تواصل مع الدعم الفني</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div>
              <Label htmlFor="support-name" className="text-gray-700 font-inter">اسمك الكامل</Label>
              <Input id="support-name" type="text" placeholder="ادخل اسمك" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
            </div>
            <div>
              <Label htmlFor="support-email" className="text-gray-700 font-inter">بريدك الإلكتروني</Label>
              <Input id="support-email" type="email" placeholder="ادخل بريدك الإلكتروني" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
            </div>
            <div>
              <Label htmlFor="support-subject" className="text-gray-700 font-inter">الموضوع</Label>
              <Input id="support-subject" type="text" placeholder="موضوع رسالتك" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
            </div>
            <div>
              <Label htmlFor="support-message" className="text-gray-700 font-inter">رسالتك</Label>
              <Textarea id="support-message" placeholder="اكتب رسالتك هنا بالتفصيل..." rows={5} required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
            </div>
            <Button className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg shadow-md">
              إرسال الرسالة
            </Button>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 font-montserrat text-dark-blue text-right">مركز التعلم</h2>
        <div className="bg-soft-white p-6 rounded-2xl shadow-soft-neumorphism">
          <p className="text-gray-700 mb-4 font-inter text-right">
            استكشف مواردنا التعليمية لمساعدتك في استخدام المنصة بفعالية.
          </p>
          <Link to="/client-dashboard/learning-center"> {/* Placeholder link */}
            <Button variant="outline" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg shadow-md">
              اذهب إلى مركز التعلم
            </Button>
          </Link>
        </div>
      </section>
    </ClientDashboardLayout>
  );
};

export default ClientSupportPage;