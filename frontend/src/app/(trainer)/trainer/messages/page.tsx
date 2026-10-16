'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ConversationPanel } from '@/components/chat/conversation-panel';

export default function TrainerMessagesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <MessageSquare className="size-6 text-neon" />
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-chalk">
            Tin nhắn
          </h1>
          <p className="text-sm text-muted">Trò chuyện với các hội viên đang phụ trách.</p>
        </div>
      </header>

      <ConversationPanel
        partnerType="MEMBER"
        emptyHint="Chưa có hội thoại nào. Vào Quản lý hội viên và chọn một hội viên để bắt đầu trò chuyện."
      />
    </div>
  );
}
