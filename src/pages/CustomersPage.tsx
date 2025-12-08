import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CustomerCard from '@/components/CustomerCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Customer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  // totalOrders: number; // Will be aggregated on backend or in frontend
  // lastOrderDate: string; // Will be aggregated on backend or in frontend
  createdAt: string;
  role: 'seeker' | 'provider'; // Added role property
}

const fetchCustomers = async (): Promise<Customer[]> => {
  // In a real app, you'd fetch users with role 'seeker'
  const response = await fetch('http://localhost:3000/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  const users: Customer[] = await response.json();
  return users.filter(user => user.role === 'seeker'); // Filter for clients/seekers
};

const CustomersPage = () => {
  const { data: customers = [], isLoading, error } = useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return (
    <DashboardLayout>
      <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل العملاء...</div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout>
      <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل العملاء: {error.message}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">العملاء</h1>

      <div className="mb-8 relative max-w-sm">
        <Input
          placeholder="بحث عن عميل..."
          className="w-full pr-10 rounded-xl shadow-soft bg-brand-card-bg border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <CustomerCard key={customer.id} customer={{
              id: customer.id,
              name: customer.name,
              email: customer.email,
              avatarUrl: customer.avatarUrl,
              totalOrders: 0, // Placeholder, needs backend aggregation
              lastOrderDate: new Date(customer.createdAt).toLocaleDateString('ar-EG'), // Placeholder, needs backend aggregation
            }} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا يوجد عملاء حتى الآن.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomersPage;