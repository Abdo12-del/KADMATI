"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { ClientGeneralMenuModal } from '@/components/ClientGeneralMenuModal';
import ClientOrdersModal from '@/components/ClientOrdersModal';
import { MessageCenterModal } from '@/components/MessageCenterModal';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const ClientHomeHeader = () => {
  const { isLoggedIn, userRole, logout } = useAuth();

  return (
    <header className="bg-brand-card-bg text-brand-text-dark p-4 shadow-soft border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/client-home" className="text-2xl font-bold font-cairo text-brand-primary">
          KHEDMATI AI
        </Link>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <ThemeToggle />
          {isLoggedIn && userRole === 'seeker' && (
            <>
              <NotificationsDropdown />
              <MessageCenterModal currentUserId="customer" />
              <ClientOrdersModal />
              <ClientGeneralMenuModal />
              <Button onClick={logout} variant="outline" className="border-brand-danger text-brand-danger hover:bg-brand-danger/10 rounded-lg font-ibm-plex-arabic px-4 py-2">
                تسجيل الخروج
              </Button>
            </>
          )}
          {!isLoggedIn && (
            <>
              <Link to="/login">
                <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary-light/20 rounded-lg font-ibm-plex-arabic px-4 py-2">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg font-ibm-plex-arabic px-4 py-2">
                  إنشاء حساب
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default ClientHomeHeader;