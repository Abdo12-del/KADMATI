import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="text-center py-20 bg-dark-blue text-white rounded-2xl shadow-lg">
          <h1 className="text-5xl font-bold mb-4 font-montserrat">منصة الخدمات المتكاملة</h1>
          <p className="text-xl mb-8 font-inter">اكتشف، اطلب، وقدم الخدمات بسهولة وفعالية.</p>
          <Link to="/signup">
            <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white text-lg px-8 py-4 rounded-2xl shadow-md">
              ابدأ الآن
            </Button>
          </Link>
        </section>

        <section className="py-16">
          <h2 className="text-4xl font-bold text-center mb-12 font-montserrat text-dark-blue">كيف تعمل المنصة؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-soft-white p-6 rounded-2xl shadow-soft-neumorphism text-center">
              <h3 className="text-2xl font-semibold mb-4 font-montserrat text-light-blue">1. اكتشف الخدمات</h3>
              <p className="text-gray-700 font-inter">تصفح مجموعة واسعة من الخدمات المقدمة من محترفين.</p>
            </div>
            <div className="bg-soft-white p-6 rounded-2xl shadow-soft-neumorphism text-center">
              <h3 className="text-2xl font-semibold mb-4 font-montserrat text-light-blue">2. اطلب الخدمة</h3>
              <p className="text-gray-700 font-inter">اختر الخدمة المناسبة واطلبها ببضع نقرات.</p>
            </div>
            <div className="bg-soft-white p-6 rounded-2xl shadow-soft-neumorphism text-center">
              <h3 className="text-2xl font-semibold mb-4 font-montserrat text-light-blue">3. استلم العمل</h3>
              <p className="text-gray-700 font-inter">تواصل مع مقدم الخدمة واستلم عملك بجودة عالية.</p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-light-gray rounded-2xl shadow-inner">
          <h2 className="text-4xl font-bold text-center mb-12 font-montserrat text-dark-blue">لماذا تختار منصتنا؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start p-4 text-right">
              <span className="text-light-blue text-3xl ml-4 rtl:mr-4">✔️</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-montserrat text-dark-blue">سهولة الاستخدام</h3>
                <p className="text-gray-700 font-inter">واجهة بسيطة وبديهية لتجربة سلسة.</p>
              </div>
            </div>
            <div className="flex items-start p-4 text-right">
              <span className="text-light-blue text-3xl ml-4 rtl:mr-4">🔒</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-montserrat text-dark-blue">أمان وموثوقية</h3>
                <p className="text-gray-700 font-inter">معاملات آمنة وحماية لبياناتك.</p>
              </div>
            </div>
            <div className="flex items-start p-4 text-right">
              <span className="text-light-blue text-3xl ml-4 rtl:mr-4">🌟</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-montserrat text-dark-blue">خدمات متنوعة</h3>
                <p className="text-gray-700 font-inter">تغطية شاملة لاحتياجاتك من الخدمات.</p>
              </div>
            </div>
            <div className="flex items-start p-4 text-right">
              <span className="text-light-blue text-3xl ml-4 rtl:mr-4">🤝</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-montserrat text-dark-blue">دعم فني</h3>
                <p className="text-gray-700 font-inter">فريق دعم جاهز لمساعدتك في أي وقت.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;