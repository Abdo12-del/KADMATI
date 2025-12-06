"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Menu } from 'lucide-react';
import ClientDashboardMenuContent from '@/components/ClientDashboardMenuContent';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom'; // لاستخدام التوجيه بعد تسجيل الخروج

// استيراد مكونات الصفحات الداخلية للنافذة المنبثقة (مكونات وهمية حاليًا)
import ClientDashboardOverviewPage from '@/pages/ClientDashboardOverviewPage';
import ClientMyOrdersPage from '@/pages/ClientMyOrdersPage';
import ClientServicesCatalogPage from '@/pages/ClientServicesCatalogPage';
import ClientMessagesPage from '@/pages/ClientMessagesPage';
import ClientFavoritesPage from '@/pages/ClientFavoritesPage';
import ClientPaymentsPage from '@/pages/ClientPaymentsPage';
import ClientReviewsRatingsPage from '@/pages/ClientReviewsRatingsPage';
import ClientSettingsPage from '@/pages/ClientSettingsPage';
import ClientSupportPage from '@/pages/ClientSupportPage';
import ProfilePage from '@/pages/ProfilePage'; // استخدام صفحة الملف الشخصي العامة

export const ClientDashboardMenuModal = () => {
  const [open, setOpen] = React.useState(false);
  const [activeModalPage, setActiveModalPage] = React.useState('overview'); // الصفحة الافتراضية
  const navigate = useNavigate();

  const handleNavigate = (page: string) => {
    setActiveModalPage(page);
  };

  const handleCloseModalAndLogout = () => {
    setOpen(false); // إغلاق النافذة المنبثقة
    navigate('/login'); // الانتقال إلى صفحة تسجيل الدخول
  };

  const renderModalContent = () => {
    switch (activeModalPage) {
      case 'overview':
        return <ClientDashboardOverviewPage />;
      case 'orders':
        return <ClientMyOrdersPage />;
      case 'services':
        return <ClientServicesCatalogPage />;
      case 'messages':
        return <ClientMessagesPage />;
      case 'favorites':
        return <ClientFavoritesPage />;
      case 'payments':
        return <ClientPaymentsPage />;
      case 'reviews':
        return <ClientReviewsRatingsPage />;
      case 'settings':
        return <ClientSettingsPage />;
      case 'support':
        return <ClientSupportPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <div className="text-center p-8 text-brand-text-muted font-ibm-plex-arabic">المحتوى غير موجود.</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-text-dark hover:bg-brand-background rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">القائمة العامة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-brand-card-bg rounded-2xl shadow-soft flex rtl:flex-row-reverse">
        {/* Sidebar within the modal */}
        <div className="w-64 flex-shrink-0 border-l border-border rtl:border-r rtl:border-l-0 p-6">
          <ClientDashboardMenuContent
            onNavigate={handleNavigate}
            activePage={activeModalPage}
            onCloseModal={handleCloseModalAndLogout}
          />
        </div>

        {/* Main content area within the modal */}
        <div className="flex-grow overflow-y-auto p-8">
          <ScrollArea className="h-full">
            {renderModalContent()}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};