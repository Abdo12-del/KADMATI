import React from 'react';
// تم إزالة استيراد ClientDashboardLayout
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ClientSettingsPage = () => {
  // Placeholder user data
  const user = {
    name: 'ليلى ناصر',
    email: 'layla.nasser@example.com',
    phone: '+966501234567',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=LN',
  };

  return (
    <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-3xl mx-auto text-right"> {/* تم إزالة ClientDashboardLayout */}
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-4xl font-cairo text-center text-brand-text-dark">الإعدادات</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-8">
        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg shadow-soft font-ibm-plex-arabic">تغيير الصورة</Button>
            </div>
            <div>
              <Label htmlFor="profile-name" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الاسم الكامل</Label>
              <Input id="profile-name" type="text" defaultValue={user.name} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="profile-email" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">البريد الإلكتروني</Label>
              <Input id="profile-email" type="email" defaultValue={user.email} disabled className="rounded-xl shadow-soft bg-brand-card-bg border-none font-ibm-plex-arabic text-right" />
            </div>
            <div>
              <Label htmlFor="profile-phone" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رقم الهاتف</Label>
              <Input id="profile-phone" type="tel" defaultValue={user.phone} className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
            </div>
            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              حفظ التعديلات
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">طرق الدفع</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <p className="text-brand-text-muted font-ibm-plex-arabic">لا توجد طرق دفع محفوظة حاليًا.</p>
            <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              إضافة طريقة دفع جديدة
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

        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">إعدادات الإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex flex-row-reverse items-center justify-between">
              <Label htmlFor="email-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات عبر البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex flex-row-reverse items-center justify-between">
              <Label htmlFor="push-notifications" className="text-brand-text-dark font-ibm-plex-arabic text-lg">تلقي إشعارات فورية</Label>
              <Switch id="push-notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft bg-brand-background p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-cairo text-brand-text-dark text-2xl">اللغة</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <Label htmlFor="language-select" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">لغة الواجهة</Label>
              <Select defaultValue="ar">
                <SelectTrigger id="language-select" className="rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                  <SelectValue placeholder="اختر اللغة" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              حفظ إعدادات اللغة
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ClientSettingsPage;