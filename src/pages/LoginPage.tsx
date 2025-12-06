import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center bg-light-gray">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-6 font-montserrat text-dark-blue">تسجيل الدخول</h2>
          <form className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-open-sans">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="ادخل بريدك الإلكتروني" required className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700 font-open-sans">كلمة المرور</Label>
              <Input id="password" type="password" placeholder="ادخل كلمة المرور" required className="rounded-lg" />
            </div>
            <Button type="submit" className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-2 rounded-lg">
              تسجيل الدخول
            </Button>
          </form>
          <p className="text-center text-sm text-gray-700 mt-4 font-open-sans">
            ليس لديك حساب؟{' '}
            <Link to="/signup" className="text-light-blue hover:underline">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;