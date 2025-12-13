"use client";

import { MessageCenterModal } from '@/components/MessageCenterModal';

const MessageCenterPage = () => {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-4xl font-cairo text-brand-text-dark mb-6 text-right">مركز الرسائل</h1>
      <div className="flex-grow">
        <MessageCenterModal currentUserId="provider" isPage={true} /> {/* Set isPage to true */}
      </div>
    </div>
  );
};

export default MessageCenterPage;