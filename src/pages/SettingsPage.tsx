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
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 font-montserrat text-dark-blue">الإعدادات</h1>

        <Card className="mb-6 rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">الإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-gray-700 font-open-sans">تلقي إشعارات عبر البريد الإلكتروني</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-gray-700 font-open-sans">تلقي إشعارات فورية</Label>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">معلومات الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact-email" className="text-gray-700 font-open-sans">البريد الإلكتروني للدعم</Label>
              <Input id="contact-email" type="email" defaultValue="support@serviceplatform.com" disabled className="rounded-lg" />
            </div>
            <div>
              <Label htmlFor="contact-message" className="text-gray-700 font-open-sans">رسالتك</Label>
              <Textarea id="contact-message" placeholder="اكتب رسالتك هنا..." rows={5} className="rounded-lg" />
            </div>
            <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white rounded-lg">
              إرسال الرسالة
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-montserrat text-dark-blue">إدارة الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive" className="w-full bg-platform-red hover:bg-platform-red/90 text-white rounded-lg">
              حذف الحساب
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;