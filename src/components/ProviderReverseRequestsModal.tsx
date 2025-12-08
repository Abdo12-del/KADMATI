"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter } from 'lucide-react';
import ProviderRequestCard from '@/components/ProviderRequestCard';

interface Request {
  id: string;
  title: string;
  description: string;
  location?: string;
  dateAdded: string;
  dueDate?: string;
  additionalOptions?: string;
  clientName: string;
  category: string; // For filtering
}

const dummyRequests: Request[] = [
  {
    id: 'req1',
    title: 'صيانة شاملة للحديقة المنزلية',
    description: 'أحتاج إلى شخص متخصص لصيانة الحديقة، بما في ذلك تقليم الأشجار، زراعة الزهور، وتنظيف الممرات. يفضل أن يكون لديه خبرة في تنسيق الحدائق.',
    location: 'الرياض، حي النرجس',
    dateAdded: '2023-11-05',
    dueDate: 'خلال أسبوعين',
    additionalOptions: 'توفير الأدوات والمعدات اللازمة.',
    clientName: 'ليلى ناصر',
    category: 'صيانة',
  },
  {
    id: 'req2',
    title: 'تصميم شعار لمتجر إلكتروني',
    description: 'أبحث عن مصمم جرافيك لإنشاء شعار عصري وجذاب لمتجري الإلكتروني الجديد المتخصص في بيع المنتجات اليدوية. أرغب في تصميم يعكس الإبداع والأصالة.',
    location: 'جدة',
    dateAdded: '2023-11-04',
    dueDate: 'خلال 5 أيام',
    additionalOptions: 'تسليم الملفات المصدرية ودليل استخدام الشعار.',
    clientName: 'أحمد محمد',
    category: 'تصميم',
  },
  {
    id: 'req3',
    title: 'دروس تقوية في اللغة الإنجليزية',
    description: 'أحتاج مدرسًا خصوصيًا لتقديم دروس تقوية في اللغة الإنجليزية لابني في المرحلة الثانوية. التركيز على القواعد والمحادثة.',
    location: 'الدمام',
    dateAdded: '2023-11-03',
    dueDate: 'مرتين في الأسبوع',
    additionalOptions: 'يفضل أن يكون لديه خبرة في المناهج السعودية.',
    clientName: 'سارة علي',
    category: 'تعليم',
  },
  {
    id: 'req4',
    title: 'تركيب كاميرات مراقبة للمنزل',
    description: 'أرغب في تركيب نظام كاميرات مراقبة متكامل للمنزل مع إمكانية الوصول عن بعد. يشمل التركيب والبرمجة.',
    location: 'الرياض، حي الياسمين',
    dateAdded: '2023-11-02',
    dueDate: 'في أقرب وقت ممكن',
    additionalOptions: 'ضمان على التركيب والمعدات.',
    clientName: 'خالد فهد',
    category: 'صيانة',
  },
];

export const ProviderReverseRequestsModal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  const categories = ['صيانة', 'تصميم', 'تعليم', 'تقنية', 'نقل', 'جمال'];
  const locations = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'الخبر'];

  const filteredRequests = dummyRequests.filter(request => {
    const matchesSearch = request.title.includes(searchTerm) || request.description.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || request.category === filterCategory;
    const matchesLocation = filterLocation === 'all' || (request.location && request.location.includes(filterLocation));
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <ListFilter className="h-5 w-5" />
          <span className="sr-only">الطلبات العكسية</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <DialogHeader className="text-right pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark">الطلبات العكسية</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 mb-6 flex-shrink-0 rtl:space-x-reverse">
          <div className="relative flex-grow">
            <Input
              placeholder="بحث في الطلبات..."
              className="w-full pr-10 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
          </div>
          <Select onValueChange={setFilterCategory} defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px] rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
              <SelectItem value="all">كل الفئات</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setFilterLocation} defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px] rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
              <SelectValue placeholder="الموقع" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
              <SelectItem value="all">كل المواقع</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <ProviderRequestCard key={request.id} request={request} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مطابقة.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};