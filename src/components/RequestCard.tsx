import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RequestCard = () => {
  return (
    <Card className="shadow-sm bg-white rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-montserrat text-dark-blue">Request Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 text-sm mt-1 font-open-sans">Request description snippet...</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-700 font-medium">Status: Pending</span>
          <Button className="bg-light-blue text-white px-4 py-2 rounded-lg hover:bg-light-blue/90">
            View Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;