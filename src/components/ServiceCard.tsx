import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  imageUrl?: string;
  reviewsCount: number;
}

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex rtl:flex-row-reverse">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden">
      <img src={service.imageUrl || '/placeholder.svg'} alt={service.title} className="w-full h-40 object-cover" />
      <CardHeader className="p-4 pb-2 text-right">
        <CardTitle className="text-lg font-cairo text-brand-text-dark">{service.title}</CardTitle>
        <div className="flex justify-end items-center text-sm text-brand-text-muted">
          {renderStars(service.rating)}
          <span className="mr-1 font-ibm-plex-arabic">({service.reviewsCount})</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted line-clamp-2 font-ibm-plex-arabic">{service.description}</p>
        <div className="flex justify-between items-center pt-2">
          <span className="text-brand-primary font-bold text-xl font-cairo">${service.price}</span>
          <Link to={`/dashboard/services/edit/${service.id}`}>
            <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2 rounded-lg shadow-soft font-ibm-plex-arabic">
              تعديل الخدمة
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;