import React from 'react';

const ServiceCard = () => {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="text-lg font-semibold font-montserrat">Service Title</h3>
      <p className="text-gray-600 text-sm mt-1">Service description snippet...</p>
      <div className="flex justify-between items-center mt-4">
        <span className="text-sky-blue-light font-bold">Price: $XX</span>
        <button className="bg-orange-button text-white px-3 py-1 rounded-md hover:bg-orange-button/90">
          View Details
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;