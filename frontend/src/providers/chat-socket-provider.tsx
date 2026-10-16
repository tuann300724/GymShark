'use client';

import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initSocket } from '@/lib/socket';

/**
 * Mount toàn cục: kết nối Socket.IO và đăng ký các listener giữ cho
 * danh sách hội thoại / badge chưa đọc luôn mới. Trang chat cụ thể
 * tự đăng ký thêm listener riêng qua `getSocket()`.
 */
export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    const socket = initSocket();
    if (!socket) return;

    const onMessageNew = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    };

    const onConversationUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    };

    const onMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    };

    socket.on('message:new', onMessageNew);
    socket.on('conversation:updated', onConversationUpdated);
    socket.on('messages:read', onMessagesRead);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('messages:read', onMessagesRead);
      // Không disconnect toàn cục — trang khác có thể cần.
    };
  }, [queryClient]);

  return <>{children}</>;
}
