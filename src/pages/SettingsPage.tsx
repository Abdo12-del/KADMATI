"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const SettingsPage = () => {
  const handleSendMessage = () => {
    // Removed dummy toast message
    console.log('Contact message sent');
    toast.success('تم إرسال رسالتك بنجاح!');
  };

  const handleDeleteAccount = () => {
    // Removed dummy toast message
    console.log('Account deletion requested');
    toast.error('تم طلب حذف الحساب!');
  };

  const handleNotificationToggle = (id: string, checked: boolean) => {
    // Removed dummy toast message
    console.log(`Notification ${id} toggled: ${checked}`);
    toast.info(`تم ${checked ? 'تفعيل' : 'تعطيل'} إشعارات ${id === 'email-notifications' ? 'البريد الإلكتروني' : 'الفورية'}!`);
  };

  return (
    <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-3xl mx-auto text-right">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-4xl font-cairo text-center text-brand-text-dark">الإعدادات</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-8">
        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">الإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex flex-row-reverse items-center justify-between">
              <Label htmlFor="email-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات عبر البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked onCheckedChange={(checked) => handleNotificationToggle('email-notifications', checked)} />
            </div>
            <div className="flex flex-row-reverse items-center justify-between">
              <Label htmlFor="push-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات فورية</Label>
              <Switch id="push-notifications" onCheckedChange={(checked) => handleNotificationToggle('push-notifications', checked)} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">معلومات الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <Label htmlFor="contact-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني للدعم</Label>
              <Input id="contact-email" type="email" defaultValue="support@serviceplatform.com" disabled className="rounded-xl shadow-soft bg-brand-card-bg border-none font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="contact-message" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رسالتك</Label>
              <Textarea id="contact-message" placeholder="اكتب رسالتك هنا..." rows={5} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <Button onClick={handleSendMessage} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              إرسال الرسالة
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">إدارة الحساب</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <Button onClick={handleDeleteAccount} variant="destructive" className="w-full bg-brand-danger hover:bg-brand-danger/90 text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              حذف الحساب
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default SettingsPage;