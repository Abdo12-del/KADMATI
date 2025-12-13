"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) {
      toast.error('الرجاء تسجيل الدخول لتعديل الملف الشخصي.');
      return;
    }
    try {
      await updateUser(user.id, { name, bio, phone });
      // toast.success is handled in useAuth
    } catch (error) {
      // toast.error is handled in useAuth
      console.error('Failed to save profile changes:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!user) {
      toast.error('الرجاء تسجيل الدخول لتغيير كلمة المرور.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }
    if (!currentPassword) {
      toast.error('الرجاء إدخال كلمة المرور الحالية.');
      return;
    }

    try {
      // In a real app, you'd send currentPassword for verification
      // For this simulation, we'll just update the password directly
      await updateUser(user.id, { password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      // toast.success is handled in useAuth
    } catch (error) {
      // toast.error is handled in useAuth
      console.error('Failed to change password:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">
        الرجاء تسجيل الدخول لعرض ملفك الشخصي.
      </div>
    );
  }

  return (
    <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-3xl mx-auto text-right">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-4xl font-cairo text-center text-brand-text-dark">الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-8">
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name.split(' ').map(n => n[0]).join('')}`} alt={user.name} />
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
              <Input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="profile-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
              <Input id="profile-email" type="email" value={user.email} disabled className="rounded-xl shadow-soft bg-brand-card-bg border-none font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="profile-phone" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رقم الهاتف</Label>
              <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
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
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الجديدة</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="confirm-new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">تأكيد كلمة المرور الجديدة</Label>
              <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
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