"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ClientServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    providerName: string;
    rating: number;
    location: string;
    imageUrl?: string;
  };
}

const ClientServiceCard = ({ service }: ClientServiceCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex rtl:flex-row-reverse">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden">
      <img src={service.imageUrl || '/placeholder.svg'} alt={service.title} className="w-full h-40 object-cover" />
      <CardHeader className="p-4 pb-2 text-right">
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{service.title}</CardTitle>
        <p className="text-sm text-brand-text-muted font-ibm-plex-arabic">بواسطة: <span className="font-semibold">{service.providerName}</span></p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted line-clamp-2 font-ibm-plex-arabic">{service.description}</p>
        <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
          <span className="ml-1">{service.location}</span>
          <MapPin className="h-4 w-4 mr-1 text-brand-primary" />
        </div>
        <div className="flex items-center justify-end text-sm text-yellow-500">
          <span className="ml-1 text-brand-text-muted font-ibm-plex-arabic">({service.rating})</span>
          {renderStars(service.rating)}
        </div>
        <div className="flex justify-between items-center pt-4">
          <span className="text-brand-primary font-bold text-xl font-cairo">${service.price}</span>
          <div className="flex gap-2"> {/* تم إضافة div لتجميع الأزرار */}
            <Link to={`/client-home/services/${service.id}`}>
              <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 px-3 py-2 rounded-lg shadow-soft font-ibm-plex-arabic text-sm">
                عرض التفاصيل
              </Button>
            </Link>
            <Link to={`/client-home/order-service/${service.id}`}> {/* Updated link */}
              <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white px-3 py-2 rounded-lg shadow-soft font-ibm-plex-arabic text-sm">
                اطلب الخدمة
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientServiceCard;