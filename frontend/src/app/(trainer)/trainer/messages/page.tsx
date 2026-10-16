'use client';

import React from 'react';
import { TrainerGuard } from '@/components/guards/trainer-guard';
import ChatClient from '@/components/chat/chat-client';

export default function TrainerMessagesPage() {
  return (
    <TrainerGuard>
      <ChatClient
        myRole="TRAINER"
        emptyHint="Chưa có hội thoại. Hãy mở hội thoại từ trang Hội viên."
      />
    </TrainerGuard>
  );
}
