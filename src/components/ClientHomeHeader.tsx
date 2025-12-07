"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { ClientGeneralMenuModal } from '@/components/ClientGeneralMenuModal';
import ClientOrdersModal from '@/components/ClientOrdersModal';
import { MessageCenterModal } from '@/components/MessageCenterModal'; // استيراد المكون الجديد

const ClientHomeHeader = () => {
  // For demonstration, let's assume a dummy client user ID
  // In a real app, this would come from an authentication context
  const currentClientId = 'client456'; 

  return (
    <header className="bg-brand-card-bg text-brand-text-dark p-4 shadow-soft border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/client-home" className="text-2xl font-bold font-cairo text-brand-primary">
          منصة الخدمات
        </Link>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <ThemeToggle />
          <NotificationsDropdown currentUserId={currentClientId} /> {/* تمرير معرف المستخدم */}
          <MessageCenterModal currentUserId={currentClientId} /> {/* تحديد المستخدم الحالي كطالب خدمة */}
          <ClientOrdersModal /> {/* زر الطلبات يفتح نافذة منبثقة */}
          <ClientGeneralMenuModal /> {/* زر القائمة العامة يفتح نافذة منبثقة */}
        </div>
      </div>
    </header>
  );
};

export default ClientHomeHeader;