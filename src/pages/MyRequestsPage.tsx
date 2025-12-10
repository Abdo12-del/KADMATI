"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import Header from '@/components/Header'; // Removed
// import Footer from '@/components/Footer'; // Removed
import RequestCard from '@/components/RequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // Import AlertDialog components
import { Button } from '@/components/ui/button'; // Import Button for delete action

interface RequestData {
  id: number;
  client_id: number;
  title: string;
  description: string;
  status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at?: string;
}

interface RequestCardPropsData {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Cancelled';
  onDelete?: (id: string) => void; // Added onDelete prop
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MyRequestsPage = () => {
  const { user } = useAuth(); // Get current user from auth context
  const CLIENT_ID = user?.id; // Use actual client ID

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!CLIENT_ID) {
      setLoading(false);
      setError('Client ID not available. Please log in as a seeker.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل جلب الطلبات.');
      }
      const result = await response.json();
      // Filter requests by the current client's ID
      const clientRequests = result.data.filter((req: any) => req.client_id === CLIENT_ID);
      setRequests(clientRequests);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'حدث خطأ أثناء جلب طلباتك.');
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.status === 204) { // 204 No Content is typical for successful DELETE
        toast.success('تم حذف الطلب بنجاح!');
        fetchRequests(); // Re-fetch requests to update the list
      } else if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل حذف الطلب.');
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حذف الطلب.');
      console.error('Error deleting request:', error);
    }
  };

  const mapRequestsToCardProps = (reqs: RequestData[]): RequestCardPropsData[] => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return reqs.map(req => ({
      id: req.id.toString(),
      title: req.title,
      description: req.description,
      status: statusMap[req.status || 'pending'] as RequestCardPropsData['status'],
      onDelete: handleDeleteRequest, // Pass the delete handler
    }));
  };

  const myRequests = useMemo(() => requests.filter(req => req.client_id === CLIENT_ID), [requests, CLIENT_ID]);

  const pendingRequests = useMemo(() => mapRequestsToCardProps(myRequests.filter(req => req.status === 'pending')), [myRequests]);
  const acceptedServices = useMemo(() => mapRequestsToCardProps(myRequests.filter(req => req.status === 'accepted')), [myRequests]); // Assuming 'offered services' are accepted requests
  const completedRequests = useMemo(() => mapRequestsToCardProps(myRequests.filter(req => req.status === 'completed')), [myRequests]);

  if (loading) {
    return (
      <div className="text-center py-10 text-brand-text-dark font-ibm-plex-arabic">
        جاري تحميل طلباتك...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-brand-danger font-ibm-plex-arabic">
        خطأ: {error}
      </div>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">طلباتي وخدماتي</h1>

      <Tabs defaultValue="my-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-brand-background rounded-xl shadow-soft p-2">
          <TabsTrigger value="my-requests" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">طلباتي</TabsTrigger>
          <TabsTrigger value="my-services" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">خدماتي المقدمة</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">السجل</TabsTrigger>
        </TabsList>
        <TabsContent value="my-requests" className="mt-6">
          <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">الطلبات الحالية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <RequestCard key={request.id} request={request} onDelete={handleDeleteRequest} />
              ))
            ) : (
              <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا توجد طلبات حالية.</p>
            )}
          </div>
        </TabsContent>
          <TabsContent value="my-services" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">خدماتي المقدمة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {acceptedServices.length > 0 ? (
                acceptedServices.map(service => (
                  <RequestCard key={service.id} request={service} onDelete={handleDeleteRequest} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لم تقم بتقديم أي خدمات بعد.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <h2 className="text-2xl font-cairo text-brand-text-dark mb-6 text-right">سجل الطلبات المكتملة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedRequests.length > 0 ? (
                completedRequests.map(request => (
                  <RequestCard key={request.id} request={request} onDelete={handleDeleteRequest} />
                ))
              ) : (
                <p className="text-brand-text-muted col-span-full font-ibm-plex-arabic text-right">لا يوجد سجل للطلبات المكتملة.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
    </>
  );
};

export default MyRequestsPage;