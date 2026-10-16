'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initSocket, ensureSocket } from '@/lib/socket';

interface ChatSocketContextType {
  ensure: () => void;
}

const ChatSocketContext = createContext<ChatSocketContextType | undefined>(undefined);

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

  const value = useMemo<ChatSocketContextType>(
    () => ({
      ensure: () => {
        ensureSocket();
      },
    }),
    [],
  );

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) throw new Error('useChatSocket must be used within ChatSocketProvider');
  return ctx;
}
