"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Menu } from 'lucide-react';
import ClientDashboardMenuContent from '@/components/ClientDashboardMenuContent';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ClientDashboardMenuModal = () => {
  const [open, setOpen] = React.useState(false);

  const handleLinkClick = () => {
    setOpen(false); // إغلاق النافذة المنبثقة عند النقر على رابط
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">القائمة العامة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-brand-card-bg rounded-2xl shadow-soft p-6 text-right">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-cairo text-brand-text-dark text-center mb-4">قائمة لوحة العميل</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-150px)] max-h-[500px] pr-4"> {/* إضافة ScrollArea هنا */}
          <ClientDashboardMenuContent onLinkClick={handleLinkClick} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};