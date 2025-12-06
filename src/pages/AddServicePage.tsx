import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AddServicePage = () => {
  return (
    <DashboardLayout>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 font-montserrat text-dark-blue">إضافة خدمة جديدة</h1>
        <form className="space-y-6">
          <div>
            <Label htmlFor="service-title" className="text-gray-700 font-open-sans">عنوان الخدمة</Label>
            <Input id="service-title" type="text" placeholder="مثال: تصميم شعار احترافي" required className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="service-description" className="text-gray-700 font-open-sans">وصف الخدمة</Label>
            <Textarea id="service-description" placeholder="صف خدمتك بالتفصيل..." rows={5} required className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="service-category" className="text-gray-700 font-open-sans">الفئة</Label>
            <Select>
              <SelectTrigger id="service-category" className="rounded-lg">
                <SelectValue placeholder="اختر فئة الخدمة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="design">تصميم</SelectItem>
                <SelectItem value="development">تطوير</SelectItem>
                <SelectItem value="writing">كتابة ومحتوى</SelectItem>
                <SelectItem value="marketing">تسويق</SelectItem>
                <SelectItem value="consulting">استشارات</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="service-price" className="text-gray-700 font-open-sans">السعر ($)</Label>
            <Input id="service-price" type="number" placeholder="مثال: 150" required min="0" className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="delivery-time" className="text-gray-700 font-open-sans">وقت التسليم (أيام)</Label>
            <Input id="delivery-time" type="number" placeholder="مثال: 3" required min="1" className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="service-image" className="text-gray-700 font-open-sans">صورة الخدمة</Label>
            <Input id="service-image" type="file" className="rounded-lg" />
          </div>
          <Button type="submit" className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-2 rounded-lg">
            إضافة الخدمة
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddServicePage;