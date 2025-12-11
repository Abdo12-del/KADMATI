"use client";

// import React, { useState } from 'react'; // Removed
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const ClientSettingsTab = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [language, setLanguage] = useState('ar');

  const handleChangePassword = () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }
    // Simulate API call
    toast.success('تم تغيير كلمة المرور بنجاح (وظيفة وهمية)!');
    console.log('Password changed', { currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleNotificationToggle = (id: string, checked: boolean) => {
    toast.info(`تم ${checked ? 'تفعيل' : 'تعطيل'} إشعارات ${id === 'email-notifications' ? 'البريد الإلكتروني' : 'الفورية'} (وظيفة وهمية)!`);
    console.log(`Notification ${id} toggled: ${checked}`);
  };

  const handleSaveLanguageSettings = () => {
    toast.success('تم حفظ إعدادات اللغة بنجاح (وظيفة وهمية)!');
    console.log('Language settings saved:', language);
  };

  return (
    <Card className="bg-brand-card-bg p-6 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="font-cairo text-brand-text-dark text-2xl">الإعدادات</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-cairo text-brand-text-dark">تغيير كلمة المرور</h3>
          <div>
            <Label htmlFor="current-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الحالية</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <div>
            <Label htmlFor="new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">كلمة المرور الجديدة</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <div>
            <Label htmlFor="confirm-new-password" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">تأكيد كلمة المرور الجديدة</Label>
            <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <Button onClick={handleChangePassword} variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            تغيير كلمة المرور
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-cairo text-brand-text-dark">إعدادات الإشعارات</h3>
          <div className="flex flex-row-reverse items-center justify-between">
            <Label htmlFor="email-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات عبر البريد الإلكتروني</Label>
            <Switch id="email-notifications" defaultChecked onCheckedChange={(checked) => handleNotificationToggle('email-notifications', checked)} />
          </div>
          <div className="flex flex-row-reverse items-center justify-between">
            <Label htmlFor="push-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات فورية</Label>
            <Switch id="push-notifications" defaultChecked onCheckedChange={(checked) => handleNotificationToggle('push-notifications', checked)} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-cairo text-brand-text-dark">اللغة</h3>
          <div>
            <Label htmlFor="language-select" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">لغة الواجهة</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language-select" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                <SelectValue placeholder="اختر اللغة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveLanguageSettings} className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
            حفظ إعدادات اللغة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};