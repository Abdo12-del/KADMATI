"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CalendarDays, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface ProviderRequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    location?: string;
    dateAdded: string;
    dueDate?: string;
    additionalOptions?: string;
    clientName: string; // For display in details
  };
}

const ProviderRequestCard = ({ request }: ProviderRequestCardProps) => {
  return (
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <CardHeader className="p-4 pb-2 text-right">
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{request.title}</CardTitle>
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">تاريخ الإضافة: {request.dateAdded}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-dark line-clamp-2 font-ibm-plex-arabic">{request.description}</p>
        {request.location && (
          <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
            <span className="ml-1">{request.location}</span>
            <MapPin className="h-4 w-4 mr-1 text-brand-primary" />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 px-3 py-2 rounded-lg shadow-soft font-ibm-plex-arabic text-sm">
                عرض التفاصيل
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-2xl shadow-soft bg-brand-card-bg p-6 text-right">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-3xl font-cairo text-brand-text-dark text-center">{request.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-brand-text-dark font-ibm-plex-arabic">
                <p className="text-lg font-semibold">{request.description}</p>
                <Separator className="bg-border" />
                {request.location && (
                  <div className="flex flex-row-reverse items-center">
                    <MapPin className="ml-2 h-5 w-5 text-brand-primary" />
                    <span>الموقع: {request.location}</span>
                  </div>
                )}
                <div className="flex flex-row-reverse items-center">
                  <CalendarDays className="ml-2 h-5 w-5 text-brand-primary" />
                  <span>تاريخ الإضافة: {request.dateAdded}</span>
                </div>
                {request.dueDate && (
                  <div className="flex flex-row-reverse items-center">
                    <CalendarDays className="ml-2 h-5 w-5 text-brand-primary" />
                    <span>الموعد المتوقع: {request.dueDate}</span>
                  </div>
                )}
                {request.additionalOptions && (
                  <div>
                    <p className="font-semibold mt-4">خيارات إضافية:</p>
                    <p>{request.additionalOptions}</p>
                  </div>
                )}
                <p className="font-semibold mt-4">طالب الخدمة: {request.clientName}</p>
              </div>
              <div className="mt-6 text-center">
                <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
                  <MessageSquare className="ml-2 h-5 w-5" />
                  الاتصال بالطالب
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white px-3 py-2 rounded-lg shadow-soft font-ibm-plex-arabic text-sm">
            الاتصال بالطالب
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderRequestCard;