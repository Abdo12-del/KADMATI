import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CustomerCard from '@/components/CustomerCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const CustomersPage = () => {
  // Placeholder for customers
  const customers = [
    { id: 'c1', name: 'أحمد محمد', email: 'ahmed@example.com', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AM', totalOrders: 3, lastOrderDate: '2023-10-20' },
    { id: 'c2', name: 'سارة علي', email: 'sara@example.com', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SA', totalOrders: 1, lastOrderDate: '2023-10-25' },
    { id: 'c3', name: 'خالد فهد', email: 'khalid@example.com', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=KF', totalOrders: 2, lastOrderDate: '2023-10-18' },
    { id: 'c4', name: 'ليلى ناصر', email: 'layla@example.com', avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=LN', totalOrders: 5, lastOrderDate: '2023-11-01' },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">العملاء</h1>

      <div className="mb-8 relative max-w-sm">
        <Input placeholder="بحث عن عميل..." className="w-full pr-10 rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right" />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length > 0 ? (
          customers.map(customer => (
            <CustomerCard key={customer.id} customer={customer} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا يوجد عملاء حتى الآن.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomersPage;