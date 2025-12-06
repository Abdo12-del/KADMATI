import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-grow">
        <Sidebar className="w-64 flex-shrink-0" />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;