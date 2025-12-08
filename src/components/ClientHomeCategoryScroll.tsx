"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Sparkles, Wrench, BookOpen, Palette, Truck, Scissors, LayoutList, Home, Car, Utensils, Monitor, HeartHandshake } from 'lucide-react';

// Removed getIconComponent and serviceCategories dummy data.
// The component will now render empty or with a placeholder if no real data is provided.

export const ClientHomeCategoryScroll = () => {
  // In a real application, this data would be fetched from a backend API.
  const serviceCategories: { id: string; name: string; icon: string; }[] = []; // Empty array for now

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
    return icons[iconName] || LayoutList; // Default to LayoutList if icon not found
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-xl shadow-soft bg-brand-card-bg p-4">
      <div className="flex w-max space-x-4 rtl:space-x-reverse p-2">
        {serviceCategories.length > 0 ? (
          serviceCategories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <Link key={category.id} to={`/client-home/services?category=${category.id}`}>
                <Card className="flex flex-col items-center justify-center p-4 rounded-full shadow-soft hover:shadow-soft-lg transition-all duration-300 cursor-pointer min-w-[80px] h-[80px] bg-brand-background group">
                  <IconComponent className="h-8 w-8 text-brand-primary group-hover:scale-110 transition-transform" />
                  {/* <span className="text-sm font-cairo text-brand-text-dark">{category.name}</span> */}
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="flex items-center justify-center w-full text-brand-text-muted font-ibm-plex-arabic p-4">
            لا توجد فئات متاحة حاليًا.
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" className="bg-brand-background" />
    </ScrollArea>
  );
};