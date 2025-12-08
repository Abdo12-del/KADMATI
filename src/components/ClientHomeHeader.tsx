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
  const unreadNotificationsCount = 3; // قيمة وهمية لعدد الإشعارات غير المقروءة
  // const unreadMessagesCount = 1; // قيمة وهمية لعدد الرسائل غير المقروءة (سيتم إدارتها بواسطة MessageCenterModal)

  return (
    <header className="bg-brand-card-bg text-brand-text-dark p-4 shadow-soft border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/client-home" className="text-2xl font-bold font-cairo text-brand-primary">
          منصة الخدمات
        </Link>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <ThemeToggle />
          <NotificationsDropdown unreadCount={unreadNotificationsCount} />
          <MessageCenterModal currentUserId="customer" /> {/* تحديد المستخدم الحالي كطالب خدمة */}
          <ClientOrdersModal /> {/* زر الطلبات يفتح نافذة منبثقة */}
          <ClientGeneralMenuModal /> {/* زر القائمة العامة يفتح نافذة منبثقة */}
        </div>
      </div>
    </header>
  );
};

export default ClientHomeHeader;