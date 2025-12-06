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
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 font-montserrat text-gray-800">تعديل الخدمة</h1>
        <form className="space-y-6">
          <div>
            <Label htmlFor="service-title">عنوان الخدمة</Label>
            <Input id="service-title" type="text" defaultValue={service.title} required />
          </div>
          <div>
            <Label htmlFor="service-description">وصف الخدمة</Label>
            <Textarea id="service-description" defaultValue={service.description} rows={5} required />
          </div>
          <div>
            <Label htmlFor="service-category">الفئة</Label>
            <Select defaultValue={service.category}>
              <SelectTrigger id="service-category">
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
            <Label htmlFor="service-price">السعر ($)</Label>
            <Input id="service-price" type="number" defaultValue={service.price} required min="0" />
          </div>
          <div>
            <Label htmlFor="delivery-time">وقت التسليم (أيام)</Label>
            <Input id="delivery-time" type="number" defaultValue={service.deliveryTime} required min="1" />
          </div>
          <div>
            <Label htmlFor="service-image">صورة الخدمة (اتركها فارغة للحفاظ على الصورة الحالية)</Label>
            <Input id="service-image" type="file" />
          </div>
          <Button type="submit" className="w-full bg-orange-button hover:bg-orange-button/90 text-white py-2">
            حفظ التعديلات
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditServicePage;