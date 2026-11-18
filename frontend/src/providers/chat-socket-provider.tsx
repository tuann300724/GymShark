'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { initSocket, ensureSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/toast';
import { chatApi } from '@/services/chat.service';
import { notificationApi } from '@/services/notification.service';
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

interface StaffShiftUpdatePayload {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  status: string;
  action: 'STARTED' | 'COMPLETED';
  actorId: string;
}

interface RealtimeNotificationPayload {
  id?: string;
  type?: string;
  title?: string;
  content?: string;
  link?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  queryKeys?: string[];
  createdAt?: string | Date;
}

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pathname = usePathname();

  // Chỉ gọi API khi đã đăng nhập — khách vãng lai không bắn request 401.
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('gym_access_token');
  const storedUser = getStoredUser();
  const canChatRole = storedUser?.role === 'TRAINER' || storedUser?.role === 'MEMBER';
  const isAdminRole =
    storedUser?.role === 'ADMIN' || storedUser?.role === 'MANAGER' || storedUser?.role === 'STAFF';

  // Số tin nhắn chưa đọc (HLV / Hội viên)
  const { data: unreadData } = useQuery({
    queryKey: ['chat-unread'],
    queryFn: chatApi.unreadCount,
    enabled: hasToken && canChatRole,
    retry: 0,
  });
  const chatUnread = canChatRole ? (unreadData?.count ?? 0) : 0;

  // Số thông báo chưa đọc đối với tổ quản trị / vận hành
  const { data: adminUnreadData } = useQuery({
    queryKey: ['admin', 'unread'],
    queryFn: notificationApi.getUnreadCount,
    enabled: hasToken && isAdminRole,
    retry: 0,
  });
  const adminUnread = isAdminRole ? (adminUnreadData?.count ?? 0) : 0;

  const totalUnread = canChatRole ? chatUnread : adminUnread;

  // Hiện số chưa đọc trên TIÊU ĐỀ TAB: "(2) GymMaster..."
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = totalUnread > 0 ? `(${totalUnread}) ${base}` : base;
  }, [totalUnread, pathname]);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRealtimeRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        queryClient.invalidateQueries({ refetchType: 'active' });
        refreshTimer = undefined;
      }, 150);
    };

    window.addEventListener('gym:mutation-complete', scheduleRealtimeRefresh);
    const socket = initSocket();
    if (!socket) {
      return () => {
        window.removeEventListener('gym:mutation-complete', scheduleRealtimeRefresh);
        if (refreshTimer) clearTimeout(refreshTimer);
      };
    }

    const onMessageNew = (payload?: { message?: IncomingMessagePayload }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });

      const msg = payload?.message;
      const myId = getStoredUser()?.id;
      if (!msg || (myId && msg.senderId === myId)) return;
      if (pathname.endsWith('/messages')) return;

      const fullName = msg.sender?.fullName?.trim();
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

    // Tin nhắn bị thu hồi — không hiện toast, chỉ làm mới danh sách hội thoại + tin nhắn
    const onMessageRecalled = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    };

    const onMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    };

    // Tin nhắn đã tới thiết bị người nhận — cập nhật tick "Đã nhận" trên UI người gửi
    const onMessagesDelivered = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    };

    const onStaffShiftUpdated = (payload?: StaffShiftUpdatePayload) => {
      queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-shift-settlement-preview'] });

      const myId = getStoredUser()?.id;
      if (!payload || (myId && payload.actorId === myId)) return;

      const started = payload.action === 'STARTED';
      toast({
        type: 'info',
        title: started ? 'Nhân viên đã vào ca' : 'Nhân viên đã kết ca',
        description: `${payload.staffName} · ${payload.title}`,
      });
    };

    const onRealtimeNotification = (payload?: RealtimeNotificationPayload) => {
      if (!payload) return;

      // 1. Cập nhật chuông thông báo & danh sách thông báo toàn bộ các vai trò
      queryClient.invalidateQueries({ queryKey: ['admin', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mini'] });
      queryClient.invalidateQueries({ queryKey: ['member', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['member', 'mini'] });
      queryClient.invalidateQueries({ queryKey: ['member-notif-badge'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['trainer', 'mini'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-notif-badge'] });
      queryClient.invalidateQueries({ queryKey: ['notif-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-admin'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });

      // 2. Invalidate các bảng dữ liệu nghiệp vụ tương ứng theo sự kiện
      const type = (payload.type || '').toUpperCase();
      const refType = (payload.referenceType || '').toUpperCase();
      const title = payload.title || '';

      if (type === 'PAYMENT' || refType.includes('PAYMENT')) {
        queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
        queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
        queryClient.invalidateQueries({ queryKey: ['member-payments'] });
        queryClient.invalidateQueries({ queryKey: ['member-memberships'] });
        queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
        queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['reports-revenue'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }

      if (type === 'MEMBERSHIP' || refType.includes('MEMBER') || refType.includes('FACE')) {
        queryClient.invalidateQueries({ queryKey: ['admin-members'] });
        queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
        queryClient.invalidateQueries({ queryKey: ['member-memberships'] });
        queryClient.invalidateQueries({ queryKey: ['member-profile'] });
        queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
        queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
      }

      if (type === 'CHECKIN' || refType.includes('CHECKIN') || refType.includes('CHECKOUT')) {
        queryClient.invalidateQueries({ queryKey: ['checkins-history'] });
        queryClient.invalidateQueries({ queryKey: ['checkins-inside'] });
        queryClient.invalidateQueries({ queryKey: ['checkins-daily'] });
        queryClient.invalidateQueries({ queryKey: ['checkins-hourly'] });
        queryClient.invalidateQueries({ queryKey: ['reports-attendance'] });
        queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
      }

      if (
        type === 'SCHEDULE' ||
        refType.includes('CLASS') ||
        refType.includes('SCHEDULE') ||
        refType.includes('TRAINING')
      ) {
        queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-schedules'] });
        queryClient.invalidateQueries({ queryKey: ['member-schedule'] });
      }

      if (refType.includes('BEVERAGE') || title.includes('đồ uống')) {
        queryClient.invalidateQueries({ queryKey: ['beverage-pos-sales'] });
        queryClient.invalidateQueries({ queryKey: ['beverage-pos-products'] });
        queryClient.invalidateQueries({ queryKey: ['beverage-sales'] });
        queryClient.invalidateQueries({ queryKey: ['beverage-stock'] });
        queryClient.invalidateQueries({ queryKey: ['beverage-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['beverages'] });
      }

      if (Array.isArray(payload.queryKeys)) {
        payload.queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      // 3. Hiển thị Popup Toast thông báo realtime trên màn hình
      toast({
        type: 'info',
        title: payload.title || 'Thông báo mới',
        description: payload.content || '',
      });
    };

    socket.on('message:new', onMessageNew);
    socket.on('message:recalled', onMessageRecalled);
    socket.on('conversation:updated', onConversationUpdated);
    socket.on('messages:read', onMessagesRead);
    socket.on('messages:delivered', onMessagesDelivered);
    socket.on('staff-shift:updated', onStaffShiftUpdated);
    socket.on('notification:new', onRealtimeNotification);
    socket.on('admin:event', onRealtimeNotification);
    socket.on('realtime:event', onRealtimeNotification);
    socket.on('data:changed', scheduleRealtimeRefresh);

    return () => {
      window.removeEventListener('gym:mutation-complete', scheduleRealtimeRefresh);
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.off('message:new', onMessageNew);
      socket.off('message:recalled', onMessageRecalled);
      socket.off('conversation:updated', onConversationUpdated);
      socket.off('messages:read', onMessagesRead);
      socket.off('messages:delivered', onMessagesDelivered);
      socket.off('staff-shift:updated', onStaffShiftUpdated);
      socket.off('notification:new', onRealtimeNotification);
      socket.off('admin:event', onRealtimeNotification);
      socket.off('realtime:event', onRealtimeNotification);
      socket.off('data:changed', scheduleRealtimeRefresh);
    };
  }, [queryClient, toast, pathname]);

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
