import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AddServicePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6 font-montserrat text-gray-800">إضافة خدمة جديدة</h1>
          <form className="space-y-6">
            <div>
              <Label htmlFor="service-title">عنوان الخدمة</Label>
              <Input id="service-title" type="text" placeholder="مثال: تصميم شعار احترافي" required />
            </div>
            <div>
              <Label htmlFor="service-description">وصف الخدمة</Label>
              <Textarea id="service-description" placeholder="صف خدمتك بالتفصيل..." rows={5} required />
            </div>
            <div>
              <Label htmlFor="service-category">الفئة</Label>
              <Select>
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
              <Input id="service-price" type="number" placeholder="مثال: 150" required min="0" />
            </div>
            <div>
              <Label htmlFor="delivery-time">وقت التسليم (أيام)</Label>
              <Input id="delivery-time" type="number" placeholder="مثال: 3" required min="1" />
            </div>
            <div>
              <Label htmlFor="service-image">صورة الخدمة</Label>
              <Input id="service-image" type="file" />
            </div>
            <Button type="submit" className="w-full bg-orange-button hover:bg-orange-button/90 text-white py-2">
              إضافة الخدمة
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddServicePage;