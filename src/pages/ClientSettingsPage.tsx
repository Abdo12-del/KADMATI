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
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 font-montserrat text-gray-800">الإعدادات</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat">الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">تغيير الصورة</Button>
            </div>
            <div>
              <Label htmlFor="profile-name">الاسم الكامل</Label>
              <Input id="profile-name" type="text" defaultValue={user.name} />
            </div>
            <div>
              <Label htmlFor="profile-email">البريد الإلكتروني</Label>
              <Input id="profile-email" type="email" defaultValue={user.email} disabled />
            </div>
            <div>
              <Label htmlFor="profile-phone">رقم الهاتف</Label>
              <Input id="profile-phone" type="tel" defaultValue={user.phone} />
            </div>
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white">
              حفظ التعديلات
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat">طرق الدفع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">لا توجد طرق دفع محفوظة حاليًا.</p>
            <Button variant="outline" className="border-sky-blue-light text-sky-blue-light hover:bg-sky-blue-light/10">
              إضافة طريقة دفع جديدة
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat">إعدادات الإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">تلقي إشعارات عبر البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">تلقي إشعارات فورية</Label>
              <Switch id="push-notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat">اللغة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language-select">لغة الواجهة</Label>
              <Select defaultValue="ar">
                <SelectTrigger id="language-select">
                  <SelectValue placeholder="اختر اللغة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white">
              حفظ إعدادات اللغة
            </Button>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSettingsPage;