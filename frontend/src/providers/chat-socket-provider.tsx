'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { initSocket, ensureSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/toast';
import { chatApi } from '@/services/chat.service';
import { getStoredUser } from '@/services/auth.service';

interface ChatSocketContextType {
  ensure: () => void;
}

const ChatSocketContext = createContext<ChatSocketContextType | undefined>(undefined);

/** Payload backend emit khi có tin nhắn mới: { conversationId, message } */
interface IncomingMessagePayload {
  senderId: string;
  sender?: { fullName?: string | null; role?: string | null } | null;
  type?: string;
  content?: string | null;
}

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pathname = usePathname();

  // Chỉ gọi API khi đã đăng nhập — khách vãng lai không bắn request 401.
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('gym_access_token');
  // Backend khai báo @Roles(TRAINER, MEMBER) cấp controller cho toàn bộ /chat/* —
  //Admin/MANAGER/STAFF gọi sẽ nhận 403 lặp mỗi 60s, nên chỉ bật query khi đúng role.
  const canChatRole = getStoredUser()?.role === 'TRAINER' || getStoredUser()?.role === 'MEMBER';

  // Số tin chưa đọc — CHUNG queryKey với badge "Tin nhắn" ở header,
  // nên invalidate từ socket làm badge sáng ngay.
  const { data: unreadData } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: chatApi.unreadCount,
    enabled: hasToken && canChatRole,
    refetchInterval: 60_000,
    retry: 0,
  });
  const unread = canChatRole ? (unreadData?.count ?? 0) : 0;

  // Hiện số tin chưa đọc trên TIÊU ĐỀ TAB (taskbar trình duyệt): "(2) GymMaster...".
  // Next tự đổi title theo metadata khi chuyển trang → chạy lại theo pathname
  // để gắn lại tiền tố, và strip tiền tố cũ trước khi ghi (tránh "(1) (1) ...").
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [unread, pathname]);

  useEffect(() => {
    // Không giữ guard "registered": nếu user mở app khi CHƯA đăng nhập thì
    // initSocket() trả null — phải thử lại ở lần navigate sau (sau login),
    // lúc đó token đã có.
    const socket = initSocket();
    if (!socket) return;

    const onMessageNew = (payload?: { message?: IncomingMessagePayload }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
      // Nạp lại câu thoại đang mở — nếu không, thành viên ngồi trong trang
      // Tin nhắn sẽ không thấy tin mới cho tới khi F5.
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });

      const msg = payload?.message;
      const myId = getStoredUser()?.id;
      // Không popup khi tin do chính mình gửi, hoặc khi đang ngồi đọc trang Tin nhắn.
      if (!msg || (myId && msg.senderId === myId)) return;
      if (pathname.endsWith('/messages')) return;

      const fullName = msg.sender?.fullName?.trim();
      // Prefix "HLV " khi gửi cho hội viên — nhưng bỏ qua nếu tên đã có sẵn "HLV".
      const rolePrefix =
        msg.sender?.role === 'TRAINER' && fullName && !/^HLV\b/i.test(fullName) ? 'HLV ' : '';
      const previewRaw =
        msg.content?.trim() ||
        (msg.type === 'IMAGE'
          ? 'Đã gửi một hình ảnh'
          : msg.type === 'MEAL_PLAN'
            ? 'Đã gửi một thực đơn'
            : 'Bạn có tin nhắn mới');
      const preview = previewRaw.length > 120 ? `${previewRaw.slice(0, 120)}…` : previewRaw;
      toast({
        type: 'info',
        title: `Tin nhắn mới từ ${rolePrefix}${fullName || 'người dùng'}`,
        description: `${preview} — vào mục "Tin nhắn" để xem.`,
      });
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
  }, [queryClient, toast, pathname]);

  // Tránh StrictMode/điều hướng gọi ensure không cần thiết lần đầu.
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
