"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { ClientHomeMessagesDropdown } from '@/components/ClientHomeMessagesDropdown';
import { ClientGeneralMenuModal } from '@/components/ClientGeneralMenuModal'; // استيراد المكون الجديد
import ClientOrdersModal from '@/components/ClientOrdersModal'; // استيراد مكون الطلبات الجديد

const ClientHomeHeader = () => {
  const unreadNotificationsCount = 3; // قيمة وهمية لعدد الإشعارات غير المقروءة
  const unreadMessagesCount = 1; // قيمة وهمية لعدد الرسائل غير المقروءة

  return (
    <header className="bg-brand-card-bg text-brand-text-dark p-4 shadow-soft border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/client-home" className="text-2xl font-bold font-cairo text-brand-primary">
          منصة الخدمات
        </Link>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <ThemeToggle />
          <NotificationsDropdown unreadCount={unreadNotificationsCount} />
          <ClientHomeMessagesDropdown unreadCount={unreadMessagesCount} />
          <ClientOrdersModal /> {/* زر الطلبات يفتح نافذة منبثقة */}
          <ClientGeneralMenuModal /> {/* زر القائمة العامة يفتح نافذة منبثقة */}
        </div>
      </div>
    </header>
  );
};

export default ClientHomeHeader;