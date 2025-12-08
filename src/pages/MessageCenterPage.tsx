"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { MessageCenterModal } from '@/components/MessageCenterModal';

const MessageCenterPage = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <h1 className="text-4xl font-cairo text-brand-text-dark mb-10 text-right">مركز الرسائل</h1>
        <div className="flex-grow">
          {/* The MessageCenterModal is designed to be a modal, but we can render its content directly or wrap it */}
          {/* For simplicity, we'll render the modal's content directly here, assuming it handles its own state */}
          {/* Note: This might require slight adjustments to MessageCenterModal if it strictly expects to be in a Dialog */}
          <MessageCenterModal currentUserId="provider" isPage={true} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MessageCenterPage;