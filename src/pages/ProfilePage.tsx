import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 font-montserrat text-gray-800">الملف الشخصي</h1>

          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold font-montserrat text-gray-800">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sky-blue-light font-medium mt-2">{user.role}</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-montserrat">معلومات شخصية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="profile-name">الاسم الكامل</Label>
                <Input id="profile-name" type="text" defaultValue={user.name} />
              </div>
              <div>
                <Label htmlFor="profile-email">البريد الإلكتروني</Label>
                <Input id="profile-email" type="email" defaultValue={user.email} disabled />
              </div>
              <div>
                <Label htmlFor="profile-bio">نبذة عني</Label>
                <Textarea id="profile-bio" defaultValue={user.bio} rows={4} />
              </div>
              <Button className="bg-orange-button hover:bg-orange-button/90 text-white">
                حفظ التعديلات
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-montserrat">تغيير كلمة المرور</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                <Input id="current-password" type="password" />
              </div>
              <div>
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input id="new-password" type="password" />
              </div>
              <div>
                <Label htmlFor="confirm-new-password">تأكيد كلمة المرور الجديدة</Label>
                <Input id="confirm-new-password" type="password" />
              </div>
              <Button variant="outline" className="border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10">
                تغيير كلمة المرور
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;