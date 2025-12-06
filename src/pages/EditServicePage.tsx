import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EditServicePage = () => {
  // Placeholder for service data to be edited
  const service = {
    title: 'تصميم شعار احترافي',
    description: 'أقدم خدمة تصميم شعارات احترافية ومبتكرة لشركتك أو مشروعك. تصميم فريد يعروس هويتك.',
    category: 'design',
    price: 150,
    deliveryTime: 3,
  };

  return (
    <DashboardLayout>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 font-montserrat text-dark-blue">تعديل الخدمة</h1>
        <form className="space-y-6">
          <div>
            <Label htmlFor="service-title" className="text-gray-700 font-open-sans">عنوان الخدمة</Label>
            <Input id="service-title" type="text" defaultValue={service.title} required className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="service-description" className="text-gray-700 font-open-sans">وصف الخدمة</Label>
            <Textarea id="service-description" defaultValue={service.description} rows={5} required className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="service-category" className="text-gray-700 font-open-sans">الفئة</Label>
            <Select defaultValue={service.category}>
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
            <Input id="service-price" type="number" defaultValue={service.price} required min="0" className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="delivery-time" className="text-gray-700 font-open-sans">وقت التسليم (أيام)</Label>
            <Input id="delivery-time" type="number" defaultValue={service.deliveryTime} required min="1" className="rounded-lg" />
          </div>
          <div>
            <Label htmlFor="service-image" className="text-gray-700 font-open-sans">صورة الخدمة (اتركها فارغة للحفاظ على الصورة الحالية)</Label>
            <Input id="service-image" type="file" className="rounded-lg" />
          </div>
          <Button type="submit" className="w-full bg-platform-orange hover:bg-platform-orange/90 text-white py-2 rounded-lg">
            حفظ التعديلات
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditServicePage;