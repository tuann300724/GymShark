'use client';

import React from 'react';
import { MemberGuard } from '@/components/guards/member-guard';
import ChatClient from '@/components/chat/chat-client';

export default function MemberMessagesPage() {
  return (
    <MemberGuard>
      <ChatClient
        myRole="MEMBER"
        emptyHint="Bạn chưa có hội thoại. HLV sẽ liên hệ khi được phân công."
      />
    </MemberGuard>
  );
}
