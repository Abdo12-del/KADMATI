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
  return (
    <Card className="shadow-soft-neumorphism bg-soft-white rounded-2xl p-4">
      <img src={service.imageUrl || '/placeholder.svg'} alt={service.title} className="w-full h-40 object-cover rounded-xl mb-4" />
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-lg font-montserrat text-dark-blue">{service.title}</CardTitle>
        <p className="text-sm text-gray-700 font-inter">بواسطة: <span className="font-medium">{service.providerName}</span></p>
      </CardHeader>
      <CardContent className="p-0 space-y-2">
        <p className="text-sm text-gray-700 line-clamp-2 font-inter">{service.description}</p>
        <div className="flex items-center text-sm text-gray-700 font-inter">
          <MapPin className="h-4 w-4 mr-1 text-light-blue" />
          <span>{service.location}</span>
        </div>
        <div className="flex items-center text-sm text-yellow-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < service.rating ? 'fill-yellow-500' : 'text-gray-300'}`} />
          ))}
          <span className="ml-1 text-gray-700 font-inter">({service.rating})</span>
        </div>
        <div className="flex justify-between items-center pt-4">
          <span className="text-light-blue font-bold text-xl">${service.price}</span>
          <Link to={`/client-dashboard/services/${service.id}`}>
            <Button className="bg-platform-orange hover:bg-platform-orange/90 text-white px-6 py-3 rounded-lg shadow-md">
              عرض التفاصيل
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientServiceCard;