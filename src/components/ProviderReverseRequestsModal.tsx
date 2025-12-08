"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter } from 'lucide-react';
import ProviderRequestCard from '@/components/ProviderRequestCard';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

interface RequestData {
  id: number;
  client_id: number;
  title: string;
  description: string;
  location?: string;
  due_date?: string;
  additional_options?: string;
  category?: string;
  created_at?: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled'; // Added status property
}

interface UserData {
  id: number;
  name: string;
}

interface ProviderRequestCardPropsData {
  id: string;
  title: string;
  description: string;
  location?: string;
  dateAdded: string;
  dueDate?: string;
  additionalOptions?: string;
  clientName: string;
}

export const ProviderReverseRequestsModal = () => {
  const { user } = useAuth(); // Get current user from auth context
  const PROVIDER_ID = user?.id; // Use actual provider ID

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['design', 'development', 'writing', 'marketing', 'consulting']; // Match backend categories
  const locations = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'الخبر']; // Example locations

  const fetchAllData = useCallback(async () => {
    if (!PROVIDER_ID) {
      setLoading(false);
      setError('Provider ID not available. Please log in as a provider.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [requestsResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:3000/api/requests'),
        fetch('http://localhost:3000/api/users'),
      ]);

      if (!requestsResponse.ok) {
        const errorData = await requestsResponse.json();
        throw new Error(errorData.message || 'فشل جلب الطلبات.');
      }
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'فشل جلب المستخدمين.');
      }

      const requestsResult = await requestsResponse.json();
      const usersResult = await usersResponse.json();

      // Filter requests that are not yet accepted/completed/cancelled
      // and are potentially open for this provider to offer a service
      const openRequests = requestsResult.data.filter((req: RequestData) => req.status === 'pending');
      setRequests(openRequests);
      setUsers(usersResult.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب الطلبات العكسية.');
    } finally {
      setLoading(false);
    }
  }, [PROVIDER_ID]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(request => {
        const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              request.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || request.category === filterCategory;
        const matchesLocation = filterLocation === 'all' || (request.location && request.location.includes(filterLocation));
        return matchesSearch && matchesCategory && matchesLocation;
      })
      .map(request => {
        const client = users.find(user => user.id === request.client_id);
        return {
          id: request.id.toString(),
          title: request.title,
          description: request.description,
          location: request.location,
          dateAdded: request.created_at ? new Date(request.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
          dueDate: request.due_date,
          additionalOptions: request.additional_options,
          clientName: client?.name || 'عميل غير معروف',
        };
      });
  }, [requests, users, searchTerm, filterCategory, filterLocation]);

  if (loading) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
            <ListFilter className="h-5 w-5" />
            <span className="sr-only">الطلبات العكسية</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
          <div className="flex items-center justify-center h-full text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الطلبات...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
            <ListFilter className="h-5 w-5" />
            <span className="sr-only">الطلبات العكسية</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
          <div className="flex items-center justify-center h-full text-brand-danger font-ibm-plex-arabic">خطأ: {error}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <ListFilter className="h-5 w-5" />
          <span className="sr-only">الطلبات العكسية</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <DialogHeader className="text-right pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark">الطلبات العكسية</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 mb-6 flex-shrink-0 rtl:space-x-reverse">
          <div className="relative flex-grow">
            <Input
              placeholder="بحث في الطلبات..."
              className="w-full pr-10 rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
          </div>
          <Select onValueChange={setFilterCategory} defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px] rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
              <SelectItem value="all">كل الفئات</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setFilterLocation} defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px] rounded-xl shadow-soft bg-brand-background border-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 font-ibm-plex-arabic text-right">
              <SelectValue placeholder="الموقع" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-soft bg-brand-card-bg font-ibm-plex-arabic text-right">
              <SelectItem value="all">كل المواقع</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <ProviderRequestCard key={request.id} request={request} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات مطابقة.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};