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
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <img src={service.imageUrl || '/placeholder.svg'} alt={service.title} className="w-full h-40 object-cover rounded-t-lg" />
      <CardHeader>
        <CardTitle className="text-lg font-montserrat">{service.title}</CardTitle>
        <p className="text-sm text-gray-600">بواسطة: <span className="font-medium">{service.providerName}</span></p>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-700 line-clamp-2">{service.description}</p>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1 text-sky-blue-light" />
          <span>{service.location}</span>
        </div>
        <div className="flex items-center text-sm text-yellow-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < service.rating ? 'fill-yellow-500' : 'text-gray-300'}`} />
          ))}
          <span className="ml-1 text-gray-600">({service.rating})</span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-sky-blue-light font-bold text-lg">${service.price}</span>
          <Link to={`/client-dashboard/services/${service.id}`}>
            <Button className="bg-orange-button hover:bg-orange-button/90 text-white px-4 py-2 rounded-md">
              عرض التفاصيل
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientServiceCard;