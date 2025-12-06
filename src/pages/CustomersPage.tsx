import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CustomerCard from '@/components/CustomerCard';
import { Input } from '@/components/ui/input';

const CustomersPage = () => {
  // Placeholder for customers
  const customers = [
    { id: 'c1', name: 'أحمد محمد', email: 'ahmed@example.com', avatarUrl: 'https://github.com/shadcn.png', totalOrders: 3, lastOrderDate: '2023-10-20' },
    { id: 'c2', name: 'سارة علي', email: 'sara@example.com', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA', totalOrders: 1, lastOrderDate: '2023-10-25' },
    { id: 'c3', name: 'خالد فهد', email: 'khalid@example.com', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=KF', totalOrders: 2, lastOrderDate: '2023-10-18' },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold mb-8 font-montserrat text-gray-800">العملاء</h1>

      <div className="mb-6">
        <Input placeholder="بحث عن عميل..." className="max-w-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length > 0 ? (
          customers.map(customer => (
            <CustomerCard key={customer.id} customer={customer} />
          ))
        ) : (
          <p className="text-gray-600 col-span-full">لا يوجد عملاء حتى الآن.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomersPage;