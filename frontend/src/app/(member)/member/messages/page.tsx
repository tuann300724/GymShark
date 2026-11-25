'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberGuard } from '@/components/guards/member-guard';
import ChatClient from '@/components/chat/chat-client';
import { Spinner } from '@/components/ui/spinner';

function MemberMessagesContent() {
  const searchParams = useSearchParams();
  const trainerId = searchParams.get('trainer');

  return (
    <MemberGuard>
      <ChatClient
        myRole="MEMBER"
        trainerId={trainerId}
        emptyHint="Bạn chưa có hội thoại. Vào trang Huấn luyện viên để nhắn trực tiếp HLV bạn muốn tập cùng."
      />
    </MemberGuard>
  );
}

export default function MemberMessagesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MemberMessagesContent />
    </Suspense>
  );
}
