import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <Header />
      <main className="flex-grow container mx-auto px-8 py-10 flex items-center justify-center">
        <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-md text-right">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="ادخل بريدك الإلكتروني" required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
              </div>
              <div>
                <Label htmlFor="password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور</Label>
                <Input id="password" type="password" placeholder="ادخل كلمة المرور" required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
              </div>
              <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
                تسجيل الدخول
              </Button>
            </form>
            <p className="text-center text-sm text-brand-text-muted mt-6 font-ibm-plex-arabic">
              ليس لديك حساب؟{' '}
              <Link to="/signup" className="text-brand-primary hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;