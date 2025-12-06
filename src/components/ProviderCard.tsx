import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: number;
    serviceCount: number;
  };
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
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
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={provider.avatarUrl} alt={provider.name} />
          <AvatarFallback>{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-montserrat">{provider.name}</CardTitle>
          <div className="flex items-center text-sm text-gray-600">
            {renderStars(provider.rating)}
            <span className="ml-1">({provider.rating})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600 flex items-center">
          <Briefcase className="h-4 w-4 mr-2" />
          عدد الخدمات: <span className="font-medium ml-1">{provider.serviceCount}</span>
        </p>
        <Link to={`/provider/${provider.id}`}> {/* Placeholder link to provider profile */}
          <Button className="w-full mt-4 bg-sky-blue-light hover:bg-sky-blue-light/90 text-white">
            عرض الملف الشخصي
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;