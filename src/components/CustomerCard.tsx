"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    totalOrders: number;
    lastOrderDate: string;
  };
}

const CustomerCard = ({ customer }: CustomerCardProps) => {
  const handleSendMessage = () => {
    // Removed dummy toast message
    console.log('Send message clicked for customer:', customer.id);
    toast.info(`سيتم فتح نافذة محادثة مع ${customer.name}!`);
  };

  return (
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <CardHeader className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={customer.avatarUrl} alt={customer.name} />
          <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{customer.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">البريد الإلكتروني: {customer.email}</p>
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">إجمالي الطلبات: <span className="font-semibold">{customer.totalOrders}</span></p>
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">آخر طلب: {customer.lastOrderDate}</p>
        <Button onClick={handleSendMessage} className="w-full mt-4 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg shadow-soft font-ibm-plex-arabic">
          <MessageSquare className="ml-2 h-4 w-4" />
          إرسال رسالة
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;