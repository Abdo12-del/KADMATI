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
        <Card className="w-full max-w-md p-8 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center mb-6 font-montserrat text-dark-blue">
              إنشاء حساب جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stage === 1 && (
              <div className="space-y-6 text-center">
                <h3 className="text-xl font-semibold font-montserrat text-dark-blue">اختر دورك:</h3>
                <Button
                  onClick={() => handleRoleSelect('seeker')}
                  className="w-full bg-light-blue hover:bg-light-blue/90 text-white py-3 text-lg rounded-lg"
                >
                  طالب خدمة
                </Button>
                <Button
                  onClick={() => handleRoleSelect('provider')}
                  className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-3 text-lg rounded-lg"
                >
                  عارض خدمة
                </Button>
              </div>
            )}

            {stage === 2 && role && (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-open-sans">الاسم الكامل</Label>
                  <Input id="name" type="text" placeholder="ادخل اسمك الكامل" required className="rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-open-sans">رقم الهاتف</Label>
                  <Input id="phone" type="tel" placeholder="ادخل رقم هاتفك" required className="rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-open-sans">كلمة المرور</Label>
                  <Input id="password" type="password" placeholder="ادخل كلمة المرور" required className="rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-gray-700 font-open-sans">تأكيد كلمة المرور</Label>
                  <Input id="confirm-password" type="password" placeholder="أعد إدخال كلمة المرور" required className="rounded-lg" />
                </div>

                {role === 'provider' && (
                  <>
                    <div>
                      <Label htmlFor="provider-type" className="text-gray-700 font-open-sans">نوع العارض</Label>
                      <Select>
                        <SelectTrigger id="provider-type" className="rounded-lg">
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
                      <Label htmlFor="id-number" className="text-gray-700 font-open-sans">رقم البطاقة / السجل التجاري</Label>
                      <Input id="id-number" type="text" placeholder="ادخل الرقم التعريفي" required className="rounded-lg" />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-gray-700 font-open-sans">عنوان المكتب أو مكان العمل</Label>
                      <Input id="address" type="text" placeholder="ادخل العنوان" required className="rounded-lg" />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-2 rounded-lg">
                  إنشاء حساب
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStage(1)}
                  className="w-full mt-2 border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg"
                >
                  العودة لاختيار الدور
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-gray-700 mt-4 font-open-sans">
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