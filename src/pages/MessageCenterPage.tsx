"use client";

import { MessageCenterModal } from '@/components/MessageCenterModal';

const MessageCenterPage = () => {
  return (
    <div className="flex flex-col h-full">
      {/* The h1 is removed as MessageCenterModal will handle its own title when isPage is true,
          or the DashboardLayout will provide a general page title.
          Since this page is wrapped by DashboardLayout via ProtectedRoute,
          we should not pass isPage={true} to MessageCenterModal. */}
      <div className="flex-grow">
        <MessageCenterModal currentUserId="provider" isPage={false} /> {/* Set isPage to false */}
      </div>
    </div>
  );
};

export default MessageCenterPage;