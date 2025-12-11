"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserData } from '@/types/app-types.ts';

interface ClientProfileTabProps {
  user: UserData | null;
  onProfileUpdate: (updatedUser: Partial<UserData>) => void;
}

export const ClientProfileTab = ({ user, onProfileUpdate }: ClientProfileTabProps) => {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleImageChange = () => {
    toast.info('وظيفة تغيير الصورة قيد التطوير (وظيفة وهمية)!');
    console.log('Change image clicked');
  };

  const handleProfileSave = () => {
    onProfileUpdate({ name, phone });
    toast.success('تم حفظ تعديلات الملف الشخصي بنجاح (وظيفة وهمية)!');
    console.log('Profile saved', { name, phone });
  };

  return (
    <Card className="bg-brand-card-bg p-6 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="font-cairo text-brand-text-dark text-2xl">الملف الشخصي</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="flex flex-col items-center mb-4">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name?.split(' ').map(n => n[0]).join('')}`} alt={user?.name} />
            <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{user?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <Button onClick={handleImageChange} variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic">تغيير الصورة</Button>
        </div>
        <div>
          <Label htmlFor="profile-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الاسم الكامل</Label>
          <Input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
        </div>
        <div>
          <Label htmlFor="profile-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
          <Input id="profile-email" type="email" defaultValue={user?.email} disabled className="rounded-xl shadow-soft bg-brand-background border-none font-ibm-plex-arabic text-right" />
        </div>
        <div>
          <Label htmlFor="profile-phone" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رقم الهاتف</Label>
          <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
        </div>
        <Button onClick={handleProfileSave} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
          حفظ التعديلات
        </Button>
      </CardContent>
    </Card>
  );
};