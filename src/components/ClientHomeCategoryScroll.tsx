"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Sparkles, Wrench, BookOpen, Palette, Truck, Scissors, LayoutList, Home, Car, Utensils, Monitor, HeartHandshake,
  Zap, Droplet, Hammer, Fan, Leaf, Camera, PartyPopper, Scale // Changed Faucet to Droplet
} from 'lucide-react';

// دالة مساعدة للحصول على مكون أيقونة Lucide
const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: React.ElementType } = {
    Sparkles: Sparkles,
    Wrench: Wrench,
    BookOpen: BookOpen,
    Palette: Palette,
    Truck: Truck,
    Scissors: Scissors,
    Home: Home,
    Car: Car,
    Utensils: Utensils,
    Monitor: Monitor,
    HeartHandshake: HeartHandshake,
    Zap: Zap, // كهرباء
    Droplet: Droplet, // سباكة (تم التغيير من Faucet)
    Hammer: Hammer, // نجارة
    Fan: Fan, // تكييف
    Leaf: Leaf, // حدائق
    Camera: Camera, // تصوير
    PartyPopper: PartyPopper, // تنظيم فعاليات
    Scale: Scale, // استشارات قانونية
  };
  return icons[iconName] || LayoutList; // افتراضيًا LayoutList إذا لم يتم العثور على الأيقونة
};

const serviceCategories = [
  { id: 'cleaning', name: 'نظافة', icon: 'Sparkles' },
  { id: 'home_maintenance', name: 'صيانة منزلية', icon: 'Wrench' },
  { id: 'electricity', name: 'كهرباء', icon: 'Zap' },
  { id: 'plumbing', name: 'سباكة', icon: 'Droplet' }, {/* Changed Faucet to Droplet */}
  { id: 'carpentry', name: 'نجارة', icon: 'Hammer' },
  { id: 'ac_repair', name: 'تكييف', icon: 'Fan' },
  { id: 'gardening', name: 'حدائق', icon: 'Leaf' },
  { id: 'furniture_moving', name: 'نقل أثاث', icon: 'Truck' },
  { id: 'beauty', name: 'تجميل', icon: 'Scissors' },
  { id: 'private_tutoring', name: 'تعليم خاص', icon: 'BookOpen' },
  { id: 'photography', name: 'تصوير', icon: 'Camera' },
  { id: 'event_planning', name: 'تنظيم فعاليات', icon: 'PartyPopper' },
  { id: 'car_wash', name: 'غسيل سيارات', icon: 'Car' },
  { id: 'legal_consulting', name: 'استشارات قانونية', icon: 'Scale' },
];

export const ClientHomeCategoryScroll = () => {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-xl shadow-soft bg-brand-card-bg p-4">
      <div className="flex w-max space-x-4 rtl:space-x-reverse p-2">
        {serviceCategories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          return (
            <Link key={category.id} to={`/client-home/services?category=${category.id}`}>
              <Card className="flex flex-col items-center justify-center p-4 rounded-full shadow-soft hover:shadow-soft-lg transition-all duration-300 cursor-pointer min-w-[80px] h-[80px] bg-brand-background group">
                <IconComponent className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform" />
                {/* <span className="text-sm font-cairo text-brand-text-dark">{category.name}</span> */} {/* تم إزالة اسم الفئة */}
              </Card>
            </Link>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="bg-brand-background" />
    </ScrollArea>
  );
};