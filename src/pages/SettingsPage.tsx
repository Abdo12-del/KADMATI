import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 font-montserrat text-gray-800">الإعدادات</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat">الإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">تلقي إشعارات عبر البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">تلقي إشعارات فورية</Label>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-montserrat">معلومات الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact-email">البريد الإلكتروني للدعم</Label>
              <Input id="contact-email" type="email" defaultValue="support@serviceplatform.com" disabled />
            </div>
            <div>
              <Label htmlFor="contact-message">رسالتك</Label>
              <Textarea id="contact-message" placeholder="اكتب رسالتك هنا..." rows={5} />
            </div>
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white">
              إرسال الرسالة
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat">إدارة الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive" className="w-full">
              حذف الحساب
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;