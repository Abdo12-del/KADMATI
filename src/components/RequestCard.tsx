import React from 'react';

const RequestCard = () => {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="text-lg font-semibold font-montserrat">Request Title</h3>
      <p className="text-gray-600 text-sm mt-1">Request description snippet...</p>
      <div className="flex justify-between items-center mt-4">
        <span className="text-gray-700 font-medium">Status: Pending</span>
        <button className="bg-sky-blue-light text-white px-3 py-1 rounded-md hover:bg-sky-blue-light/90">
          View Request
        </button>
      </div>
    </div>
  );
};

export default RequestCard;