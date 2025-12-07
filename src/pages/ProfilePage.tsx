import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  bio?: string;
  avatarUrl?: string;
}

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  // In a real app, you'd get the userId from auth context
  const response = await fetch(`http://localhost:3000/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

const ProfilePage = () => {
  // Placeholder for current user ID - replace with actual auth context
  const currentUserId = 'provider123'; // Example: 'provider123' or 'client456'

  const { data: user, isLoading, error } = useQuery<UserProfile, Error>({
    queryKey: ['userProfile', currentUserId],
    queryFn: () => fetchUserProfile(currentUserId),
    enabled: !!currentUserId,
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الملف الشخصي...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل الملف الشخصي: {error.message}</div>
    </DashboardLayout>
  );
  if (!user) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-muted font-ibm-plex-arabic">لا توجد بيانات للملف الشخصي.</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-3xl mx-auto text-right">
        <CardHeader className="p-0 pb-6">
          <CardTitle className="text-4xl font-cairo text-center text-brand-text-dark">الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-8">
          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-cairo text-brand-text-dark">{user.name}</h2>
            <p className="text-brand-text-muted font-ibm-plex-arabic">{user.email}</p>
            <p className="text-brand-primary font-semibold mt-2 font-ibm-plex-arabic">{user.role === 'provider' ? 'مقدم خدمة' : 'طالب خدمة'}</p>
          </div>

          <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-cairo text-brand-text-dark text-2xl">معلومات شخصية</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <Label htmlFor="profile-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الاسم الكامل</Label>
                <Input id="profile-name" type="text" defaultValue={user.name} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
              </div>
              <div>
                <Label htmlFor="profile-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
                <Input id="profile-email" type="email" defaultValue={user.email} disabled className="rounded-xl shadow-soft bg-brand-card-bg border-none font-ibm-plex-arabic text-right" />
              </div>
              <div>
                <Label htmlFor="profile-bio" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">نبذة عني</Label>
                <Textarea id="profile-bio" defaultValue={user.bio || ''} rows={4} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
              </div>
              <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                حفظ التعديلات
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-cairo text-brand-text-dark text-2xl">تغيير كلمة المرور</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div>
                <Label htmlFor="current-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الحالية</Label>
                <Input id="current-password" type="password" className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
              </div>
              <div>
                <Label htmlFor="new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الجديدة</Label>
                <Input id="new-password" type="password" className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
              </div>
              <div>
                <Label htmlFor="confirm-new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">تأكيد كلمة المرور الجديدة</Label>
                <Input id="confirm-new-password" type="password" className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
              </div>
              <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                تغيير كلمة المرور
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ProfilePage;