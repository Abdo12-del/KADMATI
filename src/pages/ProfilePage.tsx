"use client";

import React, { useState } from 'react'; // Import useState
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ProfilePage = () => {
  // Placeholder user data - will be replaced by actual data from auth context
  const [name, setName] = useState('أحمد محمد');
  const email = 'ahmed.mohamed@example.com'; // Removed setEmail
  const role = 'مقدم خدمة'; // Removed setRole
  const [bio, setBio] = useState('مصمم جرافيك بخبرة 5 سنوات في تصميم الشعارات والهويات البصرية.');
  const avatarUrl = 'https://api.dicebear.com/7.x/initials/svg?seed=AM'; // Removed setAvatarUrl

  const handleSaveChanges = () => {
    toast.success('تم حفظ التعديلات بنجاح (وظيفة وهمية)!');
    console.log('Profile changes saved', { name, email, bio });
  };

  const handleChangePassword = () => {
    toast.success('تم تغيير كلمة المرور بنجاح (وظيفة وهمية)!');
    console.log('Password changed');
  };

  return (
    <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-3xl mx-auto text-right">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-4xl font-cairo text-center text-brand-text-dark">الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-8">
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-cairo text-brand-text-dark">{name}</h2>
          <p className="text-brand-text-muted font-ibm-plex-arabic">{email}</p>
          <p className="text-brand-primary font-semibold mt-2 font-ibm-plex-arabic">{role}</p>
        </div>

        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">معلومات شخصية</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <Label htmlFor="profile-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الاسم الكامل</Label>
              <Input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="profile-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
              <Input id="profile-email" type="email" value={email} disabled className="rounded-xl shadow-soft bg-brand-card-bg border-none font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="profile-bio" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">نبذة عني</Label>
              <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <Button onClick={handleSaveChanges} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
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
            <Button onClick={handleChangePassword} variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ProfilePage;