"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import DashboardLayout from '@/components/DashboardLayout'; // Removed
import CustomerCard from '@/components/CustomerCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'seeker' | 'provider';
  avatar_url?: string;
  created_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CustomersPage = () => {
  const { user } = useAuth(); // Get current user from auth context
  const PROVIDER_ID = user?.id; // Use actual provider ID

  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!PROVIDER_ID) {
      setLoading(false);
      setError('Provider ID not available. Please log in as a provider.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين.');
      }
      const result = await response.json();
      setUsers(result.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب العملاء.');
    } finally {
      setLoading(false);
    }
  }, [PROVIDER_ID]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredCustomers = useMemo(() => {
    return users
      .filter(user => user.role === 'seeker') // Only show seekers as customers
      .filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(customer => ({
        id: customer.id.toString(),
        name: customer.name,
        email: customer.email,
        avatarUrl: customer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${customer.name.split(' ').map(n => n[0]).join('')}`,
        totalOrders: Math.floor(Math.random() * 5) + 1, // Placeholder: In a real app, this would be calculated from orders
        lastOrderDate: customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-EG') : 'غير محدد', // Placeholder
      }));
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">جاري تحميل العملاء...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
    );
  }

  return (
    <>
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
            <CustomerCard key={customer.id} customer={customer} />
          ))
        ) : (
          <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا يوجد عملاء مطابقون.</p>
        )}
      </div>
    </>
  );
};

export default CustomersPage;