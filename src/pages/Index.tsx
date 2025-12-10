import React from 'react';
// import Header from '@/components/Header'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      {/* <Header /> */} {/* Removed */}
      <main className="flex-grow container mx-auto px-8 py-10">
        <section className="text-center py-20 bg-gradient-to-br from-brand-primary to-brand-primary-light text-white rounded-2xl shadow-soft-lg">
          <h1 className="text-5xl font-cairo mb-4">KHEDMATI: منصة الخدمات الذكية</h1>
          <p className="text-xl font-ibm-plex-arabic mb-8">منصة رقمية ذكية تربط مقدمي الخدمات بالمستخدمين الباحثين عن خدمة قريبة وسريعة. تهدف المنصة إلى تحسين كفاءة سوق الخدمات في الجزائر، وتسهيل الوصول إلى الخدمات للمواطنين بطريقة ذكية وسريعة، مع إمكانية التوسع والتطوير إلى تطبيق حقيقي على مستوى السوق المحلي.</p>
          <div className="relative max-w-xl mx-auto mb-8">
            <Input
              type="text"
              placeholder="ابحث عن خدمات..."
              className="w-full pr-12 pl-5 py-3 text-lg rounded-2xl shadow-soft bg-white text-brand-text-dark border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-text-muted" />
          </div>
          <Link to="/signup">
            <Button className="bg-white hover:bg-brand-background text-brand-primary text-lg px-8 py-4 rounded-2xl shadow-soft-lg font-cairo">
              ابدأ الآن
            </Button>
          </Link>
        </section>

        <section className="py-16">
          <h2 className="text-4xl font-cairo text-brand-text-dark text-center mb-12">كيف تعمل المنصة؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-brand-card-bg p-8 rounded-2xl shadow-soft text-center">
              <h3 className="text-2xl font-cairo text-brand-primary mb-4">1. اكتشف الخدمات</h3>
              <p className="text-brand-text-dark font-ibm-plex-arabic">تصفح مجموعة واسعة من الخدمات المقدمة من محترفين.</p>
            </div>
            <div className="bg-brand-card-bg p-8 rounded-2xl shadow-soft text-center">
              <h3 className="text-2xl font-cairo text-brand-primary mb-4">2. اطلب الخدمة</h3>
              <p className="text-brand-text-dark font-ibm-plex-arabic">اختر الخدمة المناسبة واطلبها ببضع نقرات.</p>
            </div>
            <div className="bg-brand-card-bg p-8 rounded-2xl shadow-soft text-center">
              <h3 className="text-2xl font-cairo text-brand-primary mb-4">3. استلم العمل</h3>
              <p className="text-brand-text-dark font-ibm-plex-arabic">تواصل مع مقدم الخدمة واستلم عملك بجودة عالية.</p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-brand-background rounded-2xl shadow-soft-inset">
          <h2 className="text-4xl font-cairo text-brand-text-dark text-center mb-12">لماذا تختار منصتنا؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-row-reverse items-start p-4 text-right">
              <span className="text-brand-primary text-3xl ml-4">✔️</span>
              <div>
                <h3 className="text-xl font-cairo text-brand-text-dark mb-2">سهولة الاستخدام</h3>
                <p className="text-brand-text-muted font-ibm-plex-arabic">واجهة بسيطة وبديهية لتجربة سلسة.</p>
              </div>
            </div>
            <div className="flex flex-row-reverse items-start p-4 text-right">
              <span className="text-brand-primary text-3xl ml-4">🔒</span>
              <div>
                <h3 className="text-xl font-cairo text-brand-text-dark mb-2">أمان وموثوقية</h3>
                <p className="text-brand-text-muted font-ibm-plex-arabic">معاملات آمنة وحماية لبياناتك.</p>
              </div>
            </div>
            <div className="flex flex-row-reverse items-start p-4 text-right">
              <span className="text-brand-primary text-3xl ml-4">🌟</span>
              <div>
                <h3 className="text-xl font-cairo text-brand-text-dark mb-2">خدمات متنوعة</h3>
                <p className="text-brand-text-muted font-ibm-plex-arabic">تغطية شاملة لاحتياجاتك من الخدمات.</p>
              </div>
            </div>
            <div className="flex flex-row-reverse items-start p-4 text-right">
              <span className="text-brand-primary text-3xl ml-4">🤝</span>
              <div>
                <h3 className="text-xl font-cairo text-brand-text-dark mb-2">دعم فني</h3>
                <p className="text-brand-text-muted font-ibm-plex-arabic">فريق دعم جاهز لمساعدتك في أي وقت.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* <Footer /> */} {/* Removed */}
    </div>
  );
};

export default Index;