import React from 'react';
import ClientDashboardLayout from '@/components/ClientDashboardLayout';
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
    <ClientDashboardLayout>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 font-montserrat text-dark-blue">الإعدادات</h1>

        <Card className="mb-6 rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">تغيير الصورة</Button>
            </div>
            <div>
              <Label htmlFor="profile-name" className="text-gray-700 font-open-sans">الاسم الكامل</Label>
              <Input id="profile-name" type="text" defaultValue={user.name} className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="profile-email" className="text-gray-700 font-open-sans">البريد الإلكتروني</Label>
              <Input id="profile-email" type="email" defaultValue={user.email} disabled className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="profile-phone" className="text-gray-700 font-open-sans">رقم الهاتف</Label>
              <Input id="profile-phone" type="tel" defaultValue={user.phone} className="rounded-lg" />
            </div>
            <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg">
              حفظ التعديلات
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6 rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">طرق الدفع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 font-open-sans">لا توجد طرق دفع محفوظة حاليًا.</p>
            <Button variant="outline" className="border-light-blue text-light-blue hover:bg-light-blue/10 rounded-lg">
              إضافة طريقة دفع جديدة
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6 rounded-xl">
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

        <Card className="mb-6 rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">إعدادات الإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-gray-700 font-open-sans">تلقي إشعارات عبر البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-gray-700 font-open-sans">تلقي إشعارات فورية</Label>
              <Switch id="push-notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">اللغة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language-select" className="text-gray-700 font-open-sans">لغة الواجهة</Label>
              <Select defaultValue="ar">
                <SelectTrigger id="language-select" className="rounded-lg">
                  <SelectValue placeholder="اختر اللغة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg">
              حفظ إعدادات اللغة
            </Button>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSettingsPage;