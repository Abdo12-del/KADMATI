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
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center mb-6 font-montserrat text-gray-800">
              إنشاء حساب جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stage === 1 && (
              <div className="space-y-6 text-center">
                <h3 className="text-xl font-semibold font-montserrat text-gray-700">اختر دورك:</h3>
                <Button
                  onClick={() => handleRoleSelect('seeker')}
                  className="w-full bg-sky-blue-light hover:bg-sky-blue-light/90 text-white py-3 text-lg"
                >
                  طالب خدمة
                </Button>
                <Button
                  onClick={() => handleRoleSelect('provider')}
                  className="w-full bg-orange-button hover:bg-orange-button/90 text-white py-3 text-lg"
                >
                  عارض خدمة
                </Button>
              </div>
            )}

            {stage === 2 && role && (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input id="name" type="text" placeholder="ادخل اسمك الكامل" required />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" type="tel" placeholder="ادخل رقم هاتفك" required />
                </div>
                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input id="password" type="password" placeholder="ادخل كلمة المرور" required />
                </div>
                <div>
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <Input id="confirm-password" type="password" placeholder="أعد إدخال كلمة المرور" required />
                </div>

                {role === 'provider' && (
                  <>
                    <div>
                      <Label htmlFor="provider-type">نوع العارض</Label>
                      <Select>
                        <SelectTrigger id="provider-type">
                          <SelectValue placeholder="اختر نوع العارض" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="craftsman-card">بطاقة حرفي</SelectItem>
                          <SelectItem value="commercial-register">سجل تجاري</SelectItem>
                          <SelectItem value="freelancer">عامل مستقل (بدون بطاقة أو سجل)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="id-number">رقم البطاقة / السجل التجاري</Label>
                      <Input id="id-number" type="text" placeholder="ادخل الرقم التعريفي" required />
                    </div>
                    <div>
                      <Label htmlFor="address">عنوان المكتب أو مكان العمل</Label>
                      <Input id="address" type="text" placeholder="ادخل العنوان" required />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-orange-button hover:bg-orange-button/90 text-white py-2">
                  إنشاء حساب
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStage(1)}
                  className="w-full mt-2 border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10"
                >
                  العودة لاختيار الدور
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-gray-600 mt-4">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-sky-blue-light hover:underline">
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