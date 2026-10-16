'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ConversationPanel } from '@/components/chat/conversation-panel';

export default function MemberMessagesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <MessageSquare className="size-6 text-neon" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-chalk">
            Tin nhắn
          </h1>
          <p className="text-sm text-muted">Trò chuyện trực tiếp với huấn luyện viên của bạn.</p>
        </div>
      </header>

      <ConversationPanel
        partnerType="TRAINER"
        emptyHint="Bạn chưa có hội thoại nào với huấn luyện viên. Huấn luyện viên sẽ mở hội thoại khi giao thực đơn hoặc theo dõi tiến độ."
      />
    </div>
  );
}
