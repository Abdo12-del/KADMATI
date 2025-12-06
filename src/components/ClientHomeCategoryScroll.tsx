"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Sparkles, Wrench, BookOpen, Palette, Truck, Scissors, LayoutList, Home, Car, Utensils, Monitor, HeartHandshake } from 'lucide-react';

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
  };
  return icons[iconName] || LayoutList; // افتراضيًا LayoutList إذا لم يتم العثور على الأيقونة
};

const serviceCategories = [
  { id: 'cat1', name: 'نظافة', icon: 'Sparkles' },
  { id: 'cat2', name: 'صيانة', icon: 'Wrench' },
  { id: 'cat3', name: 'تعليم', icon: 'BookOpen' },
  { id: 'cat4', name: 'تصميم', icon: 'Palette' },
  { id: 'cat5', name: 'نقل', icon: 'Truck' },
  { id: 'cat6', name: 'جمال', icon: 'Scissors' },
  { id: 'cat7', name: 'منزل', icon: 'Home' },
  { id: 'cat8', name: 'سيارات', icon: 'Car' },
  { id: 'cat9', name: 'طعام', icon: 'Utensils' },
  { id: 'cat10', name: 'تقنية', icon: 'Monitor' },
  { id: 'cat11', name: 'استشارات', icon: 'HeartHandshake' },
];

export const ClientHomeCategoryScroll = () => {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-xl shadow-soft bg-brand-card-bg p-4">
      <div className="flex w-max space-x-4 rtl:space-x-reverse p-2">
        {serviceCategories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          return (
            <Link key={category.id} to={`/client-home/services?category=${category.id}`}>
              <Card className="flex flex-col items-center justify-center p-4 rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 cursor-pointer min-w-[100px] h-[100px] bg-brand-background group">
                <IconComponent className="h-8 w-8 text-brand-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-cairo text-brand-text-dark">{category.name}</span>
              </Card>
            </Link>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="bg-brand-background" />
    </ScrollArea>
  );
};