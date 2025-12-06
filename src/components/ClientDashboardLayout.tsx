import React from 'react';
import ClientHomeHeader from '@/components/ClientHomeHeader'; // استخدام ClientHomeHeader الجديد
import Footer from '@/components/Footer';
// تم إزالة استيراد ClientSidebar

interface ClientDashboardLayoutProps {
  children: React.ReactNode;
}

const ClientDashboardLayout = ({ children }: ClientDashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      <ClientHomeHeader /> {/* استخدام ClientHomeHeader */}
      <div className="flex flex-grow">
        {/* تم إزالة ClientSidebar */}
        <main className="flex-grow container mx-auto px-8 py-10">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ClientDashboardLayout;