import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface NewUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'seeker' | 'provider';
  providerType?: string;
  idNumber?: string;
  address?: string;
}

const createUser = async (userData: NewUser): Promise<Response> => {
  const response = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
};

const SignupPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState(1);
  const [role, setRole] = useState<'seeker' | 'provider' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [providerType, setProviderType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');

  const signupMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(`فشل في إنشاء الحساب: ${error.message}`);
    },
  });

  const handleRoleSelect = (selectedRole: 'seeker' | 'provider') => {
    setRole(selectedRole);
    setStage(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('كلمة المرور وتأكيد كلمة المرور غير متطابقين.');
      return;
    }

    if (!name || !email || !phone || !password || !role) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    const userData: NewUser = {
      name,
      email,
      phone,
      password,
      role,
    };

    if (role === 'provider') {
      if (!providerType || !idNumber || !address) {
        toast.error('الرجاء ملء جميع حقول مقدم الخدمة.');
        return;
      }
      userData.providerType = providerType;
      userData.idNumber = idNumber;
      userData.address = address;
    }

    signupMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <Header />
      <main className="flex-grow container mx-auto px-8 py-10 flex items-center justify-center">
        <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-md text-right">
          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">
              إنشاء حساب جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stage === 1 && (
              <div className="space-y-6 text-center">
                <h3 className="text-xl font-cairo text-brand-text-dark mb-4">اختر دورك:</h3>
                <Button
                  onClick={() => handleRoleSelect('seeker')}
                  className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 text-lg rounded-xl shadow-soft font-ibm-plex-arabic"
                >
                  طالب خدمة
                </Button>
                <Button
                  onClick={() => handleRoleSelect('provider')}
                  className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 text-lg rounded-xl shadow-soft font-ibm-plex-arabic"
                >
                  عارض خدمة
                </Button>
              </div>
            )}

            {stage === 2 && role && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الاسم الكامل</Label>
                  <Input id="name" type="text" placeholder="ادخل اسمك الكامل" required value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
                  <Input id="email" type="email" placeholder="ادخل بريدك الإلكتروني" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رقم الهاتف</Label>
                  <Input id="phone" type="tel" placeholder="ادخل رقم هاتفك" required value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور</Label>
                  <Input id="password" type="password" placeholder="ادخل كلمة المرور" required value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">تأكيد كلمة المرور</Label>
                  <Input id="confirm-password" type="password" placeholder="أعد إدخال كلمة المرور" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                </div>

                {role === 'provider' && (
                  <>
                    <div>
                      <Label htmlFor="provider-type" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">نوع العارض</Label>
                      <Select value={providerType} onValueChange={setProviderType}>
                        <SelectTrigger id="provider-type" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                          <SelectValue placeholder="اختر نوع العارض" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                          <SelectItem value="craftsman-card">بطاقة حرفي</SelectItem>
                          <SelectItem value="commercial-register">سجل تجاري</SelectItem>
                          <SelectItem value="freelancer">عامل مستقل (بدون بطاقة أو سجل)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="id-number" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رقم البطاقة / السجل التجاري</Label>
                      <Input id="id-number" type="text" placeholder="ادخل الرقم التعريفي" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">عنوان المكتب أو مكان العمل</Label>
                      <Input id="address" type="text" placeholder="ادخل العنوان" required value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-3 text-lg rounded-xl shadow-soft font-ibm-plex-arabic" disabled={signupMutation.isPending}>
                  {signupMutation.isPending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStage(1)}
                  className="w-full mt-4 border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg"
                >
                  العودة لاختيار الدور
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-brand-text-muted mt-6 font-ibm-plex-arabic">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-brand-primary hover:underline">
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