// import React from 'react'; // Removed
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
    <Card className="bg-brand-card-bg rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <CardHeader className="flex flex-row-reverse items-center space-x-4 rtl:space-x-reverse p-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={provider.avatarUrl} alt={provider.name} />
          <AvatarFallback className="bg-brand-primary-light text-brand-primary font-cairo">{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-cairo text-brand-text-dark">{provider.name}</CardTitle>
          <div className="flex items-center justify-end text-sm text-brand-text-muted font-ibm-plex-arabic">
            <span className="ml-1">({provider.rating})</span>
            {renderStars(provider.rating)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-right">
        <p className="text-sm text-brand-text-muted flex flex-row-reverse items-center font-ibm-plex-arabic">
          <span className="mr-2">عدد الخدمات: <span className="font-semibold">{provider.serviceCount}</span></span>
          <Briefcase className="h-4 w-4 text-brand-primary" />
        </p>
        <Link to={`/provider/${provider.id}`}> {/* Placeholder link to provider profile */}
          <Button className="w-full mt-4 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg shadow-soft font-ibm-plex-arabic">
            عرض الملف الشخصي
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;