"use client";

import React, { useState } from 'react';
// import Header from '@/components/Header'; // Removed
// import Footer from '@/components/Footer'; // Removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirection is handled within the login function in useAuth
    } catch (error) {
      // toast.error is already handled in useAuth, but can add more specific handling here if needed
      console.error('Login failed in component:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      {/* <Header /> */} {/* Removed */}
      <main className="flex-grow container mx-auto px-8 py-10 flex items-center justify-center">
        <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-md text-right">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ادخل بريدك الإلكتروني"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="ادخل كلمة المرور"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
                />
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
      {/* <Footer /> */} {/* Removed */}
    </div>
  );
};

export default LoginPage;