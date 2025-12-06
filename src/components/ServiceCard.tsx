import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ServiceCard = () => {
  return (
    <Card className="shadow-sm bg-white rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-montserrat text-dark-blue">Service Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 text-sm mt-1 font-open-sans">Service description snippet...</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-light-blue font-bold text-lg">$XX</span>
          <Button className="bg-platform-orange text-white px-4 py-2 rounded-lg hover:bg-platform-orange/90">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;