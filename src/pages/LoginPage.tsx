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
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-6 font-montserrat text-gray-800">تسجيل الدخول</h2>
          <form className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="ادخل بريدك الإلكتروني" required />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" placeholder="ادخل كلمة المرور" required />
            </div>
            <Button type="submit" className="w-full bg-orange-button hover:bg-orange-button/90 text-white py-2">
              تسجيل الدخول
            </Button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-4">
            ليس لديك حساب؟{' '}
            <Link to="/signup" className="text-sky-blue-light hover:underline">
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