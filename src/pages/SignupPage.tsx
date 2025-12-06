import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SignupPage = () => {
  const [stage, setStage] = useState(1);
  const [role, setRole] = useState<'seeker' | 'provider' | null>(null);

  const handleRoleSelect = (selectedRole: 'seeker' | 'provider') => {
    setRole(selectedRole);
    setStage(2);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center bg-light-gray">
        <Card className="w-full max-w-md p-8 shadow-soft-neumorphism bg-soft-white rounded-2xl text-right">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-3xl font-bold text-center font-montserrat text-dark-blue">
              إنشاء حساب جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stage === 1 && (
              <div className="space-y-6 text-center">
                <h3 className="text-xl font-semibold font-montserrat text-dark-blue">اختر دورك:</h3>
                <Button
                  onClick={() => handleRoleSelect('seeker')}
                  className="w-full bg-light-blue hover:bg-light-blue/90 text-white py-3 text-lg rounded-lg shadow-md"
                >
                  طالب خدمة
                </Button>
                <Button
                  onClick={() => handleRoleSelect('provider')}
                  className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-3 text-lg rounded-lg shadow-md"
                >
                  عارض خدمة
                </Button>
              </div>
            )}

            {stage === 2 && role && (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-inter">الاسم الكامل</Label>
                  <Input id="name" type="text" placeholder="ادخل اسمك الكامل" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-inter">رقم الهاتف</Label>
                  <Input id="phone" type="tel" placeholder="ادخل رقم هاتفك" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-inter">كلمة المرور</Label>
                  <Input id="password" type="password" placeholder="ادخل كلمة المرور" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-gray-700 font-inter">تأكيد كلمة المرور</Label>
                  <Input id="confirm-password" type="password" placeholder="أعد إدخال كلمة المرور" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
                </div>

                {role === 'provider' && (
                  <>
                    <div>
                      <Label htmlFor="provider-type" className="text-gray-700 font-inter">نوع العارض</Label>
                      <Select>
                        <SelectTrigger id="provider-type" className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right">
                          <SelectValue placeholder="اختر نوع العارض" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg shadow-soft-neumorphism bg-soft-white">
                          <SelectItem value="craftsman-card">بطاقة حرفي</SelectItem>
                          <SelectItem value="commercial-register">سجل تجاري</SelectItem>
                          <SelectItem value="freelancer">عامل مستقل (بدون بطاقة أو سجل)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="id-number" className="text-gray-700 font-inter">رقم البطاقة / السجل التجاري</Label>
                      <Input id="id-number" type="text" placeholder="ادخل الرقم التعريفي" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-gray-700 font-inter">عنوان المكتب أو مكان العمل</Label>
                      <Input id="address" type="text" placeholder="ادخل العنوان" required className="rounded-lg shadow-soft-neumorphism bg-soft-white text-right" />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-2 rounded-lg shadow-md">
                  إنشاء حساب
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStage(1)}
                  className="w-full mt-2 border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg shadow-md"
                >
                  العودة لاختيار الدور
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-gray-700 mt-4 font-inter">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-light-blue hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SignupPage;