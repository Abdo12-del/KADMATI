import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClientSidebar from '@/components/ClientSidebar';

interface ClientDashboardLayoutProps {
  children: React.ReactNode;
}

const ClientDashboardLayout = ({ children }: ClientDashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-grow">
        <ClientSidebar className="w-64 flex-shrink-0" />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ClientDashboardLayout;