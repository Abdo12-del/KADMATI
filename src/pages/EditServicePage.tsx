"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Import useEffect, useCallback
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams, useNavigate
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // Import AlertDialog components

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EditServicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [deliveryTime, setDeliveryTime] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل جلب تفاصيل الخدمة.');
      }
      const serviceData = await response.json();
      const service = serviceData.data;
      setTitle(service.title);
      setDescription(service.description);
      setCategory(service.category);
      setPrice(service.price);
      setDeliveryTime(service.delivery_time);
      setImageUrl(service.image_url || '');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب تفاصيل الخدمة.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || price === '' || deliveryTime === '') {
      toast.error('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    const updatedService = {
      title,
      description,
      category,
      price: Number(price),
      delivery_time: Number(deliveryTime),
      image_url: imageUrl,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedService),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تحديث الخدمة.');
      }

      const result = await response.json();
      toast.success('تم حفظ تعديلات الخدمة بنجاح!');
      console.log('Service updated:', result.data);
      navigate('/dashboard/services'); // Redirect to services list
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حفظ تعديلات الخدمة.');
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 204) { // 204 No Content is typical for successful DELETE
        toast.success('تم حذف الخدمة بنجاح!');
        navigate('/dashboard/services'); // Redirect to services list after deletion
      } else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل حذف الخدمة.');
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حذف الخدمة.');
      console.error('Error deleting service:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل تفاصيل الخدمة...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
    );
  }

  return (
    <Card className="bg-brand-card-bg p-8 rounded-2xl shadow-soft w-full max-w-2xl mx-auto text-right">
      <CardHeader className="p-0 pb-6">
        <CardTitle className="text-3xl font-cairo text-center text-brand-text-dark">تعديل الخدمة</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="service-title" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">عنوان الخدمة</Label>
            <Input id="service-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <div>
            <Label htmlFor="service-description" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وصف الخدمة</Label>
            <Textarea id="service-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <div>
            <Label htmlFor="service-category" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">الفئة</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="service-category" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
                <SelectValue placeholder="اختر فئة الخدمة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
                <SelectItem value="design">تصميم</SelectItem>
                <SelectItem value="development">تطوير</SelectItem>
                <SelectItem value="writing">كتابة ومحتوى</SelectItem>
                <SelectItem value="marketing">تسويق</SelectItem>
                <SelectItem value="consulting">استشارات</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="service-price" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">السعر (د.ج)</Label>
            <Input id="service-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required min="0" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <div>
            <Label htmlFor="delivery-time" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">وقت التسليم (أيام)</Label>
            <Input id="delivery-time" type="number" value={deliveryTime} onChange={(e) => setDeliveryTime(Number(e.target.value))} required min="1" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <div>
            <Label htmlFor="service-image" className="text-brand-text-dark font-ibm-plex-arabic mb-2 block">رابط صورة الخدمة (اختياري)</Label>
            <Input id="service-image" type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="مثال: https://example.com/image.jpg" className="rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
          </div>
          <div className="flex justify-between gap-4 mt-8">
            <Button type="submit" className="flex-grow bg-brand-primary hover:bg-brand-primary-dark text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
              حفظ التعديلات
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-brand-danger hover:bg-brand-danger/90 text-white py-3 rounded-xl shadow-soft font-ibm-plex-arabic text-lg">
                  حذف الخدمة
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-cairo text-brand-text-dark text-2xl">هل أنت متأكد تمامًا؟</AlertDialogTitle>
                  <AlertDialogDescription className="font-ibm-plex-arabic text-brand-text-muted">
                    سيؤدي هذا الإجراء إلى حذف الخدمة بشكل دائم من قائمتك. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row-reverse justify-start gap-3">
                  <AlertDialogAction onClick={handleDeleteService} className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-xl shadow-soft font-ibm-plex-arabic">
                    نعم، احذف الخدمة
                  </AlertDialogAction>
                  <AlertDialogCancel className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-xl shadow-soft font-ibm-plex-arabic">
                    إلغاء
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditServicePage;