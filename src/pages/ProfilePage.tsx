import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ProfilePage = () => {
  // Placeholder user data
  const user = {
    name: 'أحمد محمد',
    email: 'ahmed.mohamed@example.com',
    role: 'مقدم خدمة',
    bio: 'مصمم جرافيك بخبرة 5 سنوات في تصميم الشعارات والهويات البصرية.',
    avatarUrl: 'https://github.com/shadcn.png', // Example avatar
  };

  return (
    <DashboardLayout>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 font-montserrat text-dark-blue">الملف الشخصي</h1>

        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold font-montserrat text-dark-blue">{user.name}</h2>
          <p className="text-gray-700 font-open-sans">{user.email}</p>
          <p className="text-light-blue font-medium mt-2 font-open-sans">{user.role}</p>
        </div>

        <Card className="mb-6 rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">معلومات شخصية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profile-name" className="text-gray-700 font-open-sans">الاسم الكامل</Label>
              <Input id="profile-name" type="text" defaultValue={user.name} className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="profile-email" className="text-gray-700 font-open-sans">البريد الإلكتروني</Label>
              <Input id="profile-email" type="email" defaultValue={user.email} disabled className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="profile-bio" className="text-gray-700 font-open-sans">نبذة عني</Label>
              <Textarea id="profile-bio" defaultValue={user.bio} rows={4} className="rounded-lg" />
            </div>
            <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg">
              حفظ التعديلات
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">تغيير كلمة المرور</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-gray-700 font-open-sans">كلمة المرور الحالية</Label>
              <Input id="current-password" type="password" className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="new-password" className="text-gray-700 font-open-sans">كلمة المرور الجديدة</Label>
              <Input id="new-password" type="password" className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="confirm-new-password" className="text-gray-700 font-open-sans">تأكيد كلمة المرور الجديدة</Label>
              <Input id="confirm-new-password" type="password" className="rounded-lg" />
            </div>
            <Button variant="outline" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;