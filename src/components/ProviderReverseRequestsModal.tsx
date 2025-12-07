"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter } from 'lucide-react';
import ProviderRequestCard from '@/components/ProviderRequestCard';
import { useQuery } from '@tanstack/react-query';

interface Request {
  id: string;
  title: string;
  description: string;
  location?: string;
  dateAdded: string; // Assuming this comes from createdAt
  dueDate?: string;
  additionalOptions?: string;
  clientId: string; // To fetch client details
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
}

interface UserProfile {
  id: string;
  name: string;
}

const fetchAllRequests = async (): Promise<Request[]> => {
  const response = await fetch('http://localhost:3000/api/requests');
  if (!response.ok) {
    throw new Error('Failed to fetch requests');
  }
  const requests = await response.json();
  // Format dateAdded from createdAt
  return requests.map((req: any) => ({
    ...req,
    dateAdded: new Date(req.createdAt).toLocaleDateString('ar-EG'),
  }));
};

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`http://localhost:3000/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

export const ProviderReverseRequestsModal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // Category is not in request model, will filter by description for now
  const [filterLocation, setFilterLocation] = useState('all');

  const { data: requests, isLoading, error } = useQuery<Request[], Error>({
    queryKey: ['allRequests'],
    queryFn: fetchAllRequests,
  });

  const [requestsWithClientNames, setRequestsWithClientNames] = useState<(Request & { clientName: string })[]>([]);

  React.useEffect(() => {
    const getClientNames = async () => {
      if (requests) {
        const requestsWithNames = await Promise.all(
          requests.map(async (request) => {
            const client = await fetchUserProfile(request.clientId);
            return {
              ...request,
              clientName: client?.name || 'مستخدم مجهول',
            };
          })
        );
        setRequestsWithClientNames(requestsWithNames);
      }
    };
    getClientNames();
  }, [requests]);

  const categories = ['صيانة', 'تصميم', 'تعليم', 'تقنية', 'نقل', 'جمال']; // These are dummy categories for filter UI
  const locations = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'الخبر']; // These are dummy locations for filter UI

  const filteredRequests = requestsWithClientNames.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.description.toLowerCase().includes(searchTerm.toLowerCase());
    // Category filtering is currently based on description as no category field in request model
    const matchesCategory = filterCategory === 'all' || request.description.toLowerCase().includes(filterCategory.toLowerCase());
    const matchesLocation = filterLocation === 'all' || (request.location && request.location.toLowerCase().includes(filterLocation.toLowerCase()));
    return matchesSearch && matchesCategory && matchesLocation;
  });

  if (isLoading) return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <ListFilter className="h-5 w-5" />
          <span className="sr-only">الطلبات العكسية</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <div className="text-center text-brand-text-dark font-ibm-plex-arabic">جاري تحميل الطلبات...</div>
      </DialogContent>
    </Dialog>
  );

  if (error) return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-brand-text-dark hover:bg-brand-background rounded-full">
          <ListFilter className="h-5 w-5" />
          <span className="sr-only">الطلبات العكسية</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <div className="text-center text-brand-danger font-ibm-plex-arabic">خطأ في تحميل الطلبات: {error.message}</div>
      </DialogContent>
    </Dialog>
  );

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