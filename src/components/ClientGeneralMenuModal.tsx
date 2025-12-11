"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

// Import new modular tab components
import { ClientProfileTab } from '@/components/client-menu/ClientProfileTab.tsx';
import { ClientSettingsTab } from '@/components/client-menu/ClientSettingsTab.tsx';
import { ClientFavoritesTab } from '@/components/client-menu/ClientFavoritesTab.tsx';
import { ClientPaymentsTab } from '@/components/client-menu/ClientPaymentsTab.tsx';
import { ClientReviewsTab } from '@/components/client-menu/ClientReviewsTab.tsx';
import { ClientSupportTab } from '@/components/client-menu/ClientSupportTab.tsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ClientGeneralMenuModal = () => {
  const { user, logout } = useAuth(); // Removed updateUserFavorites

  const handleProfileUpdate = (updatedFields: Partial<any>) => {
    // This would typically involve an API call to update the user profile
    console.log('Updating profile with:', updatedFields);
    // For now, just a toast and console log
    toast.success('تم تحديث الملف الشخصي بنجاح (وظيفة وهمية)!');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">القائمة العامة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col rounded-2xl shadow-soft bg-brand-card-bg p-6 overflow-hidden">
        <DialogHeader className="text-right pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-cairo text-brand-text-dark">القائمة العامة</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="profile" className="flex-grow flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-6 bg-brand-background rounded-xl shadow-soft p-2 mb-4 flex-shrink-0">
            <TabsTrigger value="profile" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الإعدادات</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">المفضلة</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الدفع</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">تقييماتي</TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-brand-primary data-[state=active]:text-white rounded-lg font-ibm-plex-arabic text-brand-text-dark data-[state=active]:shadow-soft-inset transition-all duration-200">الدعم</TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto pr-2">
            <TabsContent value="profile" className="mt-0">
              <ClientProfileTab user={user} onProfileUpdate={handleProfileUpdate} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <ClientSettingsTab />
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              <ClientFavoritesTab API_BASE_URL={API_BASE_URL} />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <ClientPaymentsTab />
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <ClientReviewsTab />
            </TabsContent>

            <TabsContent value="support" className="mt-0">
              <ClientSupportTab />
            </TabsContent>
          </div>
          <div className="mt-6 border-t border-border pt-4 text-center flex-shrink-0">
            <Button onClick={logout} variant="destructive" className="bg-brand-danger hover:bg-brand-danger/90 text-white rounded-xl shadow-soft font-ibm-plex-arabic py-3 text-lg">
              <LogOut className="ml-2 h-5 w-5" />
              تسجيل الخروج
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};