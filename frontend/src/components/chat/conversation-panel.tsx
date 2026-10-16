'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ConversationItem, type MessageItem } from '@/services/chat.service';
import { getSocket } from '@/lib/socket';
import { getStoredUser } from '@/lib/auth';
import { cn, formatDateTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Utensils,
} from 'lucide-react';

const CONVERSATION_LIMIT = 20;
const MESSAGE_LIMIT = 50;

const MEAL_TYPE_LABEL: Record<string, string> = {
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
};

interface ConversationPanelProps {
  /** Loại đối tác mà người dùng hiện tại đang trò chuyện cùng. */
  partnerType: 'TRAINER' | 'MEMBER';
  emptyHint?: string;
}

export function ConversationPanel({ partnerType, emptyHint }: ConversationPanelProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const me = getStoredUser();

  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [typingPartner, setTypingPartner] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------- Danh sách ------------------------------- */
  const {
    data: conversations,
    isLoading: loadingConversations,
    isFetching: fetchingConversations,
  } = useQuery({
    queryKey: ['chat-conversations', search, unreadOnly],
    queryFn: () =>
      chatApi.listConversations({
        page: 1,
        limit: CONVERSATION_LIMIT,
        search: search.trim() || undefined,
        unreadOnly: unreadOnly || undefined,
      }),
    retry: 0,
  });

  const items = conversations?.data || [];
  const active: ConversationItem | undefined = items.find((c) => c.id === activeId) || items[0];
  const activeIdResolved = active?.id ?? null;

  /* -------------------------------- Tin nhắn ------------------------------- */
  const {
    data: messages,
    isLoading: loadingMessages,
    isFetching: fetchingMessages,
  } = useQuery({
    queryKey: ['chat-messages', activeIdResolved],
    queryFn: () => chatApi.getMessages(activeIdResolved!, { page: 1, limit: MESSAGE_LIMIT }),
    enabled: Boolean(activeIdResolved),
    retry: 0,
  });

  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) => chatApi.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    },
    onError: () => {
      // Đánh dấu đã đọc thất bại không chặn trải nghiệm đọc tin.
    },
  });

  // Đánh dấu đã đọc khi mở hội thoại.
  useEffect(() => {
    if (!activeIdResolved) return;
    if ((active?.unreadCount || 0) > 0) markReadMutation.mutate(activeIdResolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdResolved]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage(activeIdResolved!, { type: 'TEXT', content }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeIdResolved] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      const socket = getSocket();
      socket?.emit('typing', { conversationId: activeIdResolved, isTyping: false });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không gửi được tin nhắn. Thử lại.';
      toast.error('Gửi thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  /* -------------------------------- Realtime ------------------------------ */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessageNew = (payload: any) => {
      if (payload?.conversationId === activeIdResolved) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', activeIdResolved] });
        markReadMutation.mutate(activeIdResolved);
      }
    };
    const onTyping = (payload: { conversationId?: string; isTyping?: boolean }) => {
      if (payload?.conversationId !== activeIdResolved) return;
      setTypingPartner(Boolean(payload?.isTyping));
    };

    socket.on('message:new', onMessageNew);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('typing', onTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdResolved, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.data?.length, typingPartner]);

  /* -------------------------------- Hành động ------------------------------ */
  const handleDraftChange = (value: string) => {
    setDraft(value);
    const socket = getSocket();
    if (!socket || !activeIdResolved) return;
    socket.emit('typing', { conversationId: activeIdResolved, isTyping: value.length > 0 });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing', { conversationId: activeIdResolved, isTyping: false });
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeIdResolved || sendMutation.isPending) return;
    sendMutation.mutate(content);
  };

  const listEmptyText = useMemo(() => {
    if (search.trim()) return 'Không tìm thấy hội thoại nào khớp.';
    if (unreadOnly) return 'Không có hội thoại nào chưa đọc.';
    return partnerType === 'TRAINER'
      ? 'Bạn chưa có hội thoại nào với hội viên. Chọn hội viên ở trang Quản lý hội viên để bắt đầu.'
      : 'Bạn chưa có hội thoại nào với huấn luyện viên.';
  }, [search, unreadOnly, partnerType]);

  /* ---------------------------------- Render ------------------------------- */
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Cột trái: danh sách hội thoại */}
      <Card className={cn('h-fit', activeIdResolved && 'max-lg:hidden')}>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên..."
              className="pl-9"
              aria-label="Tìm hội thoại"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setUnreadOnly((v) => !v)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                unreadOnly
                  ? 'border-neon/40 bg-neon/10 text-neon'
                  : 'border-line text-muted hover:text-chalk',
              )}
            >
              Chưa đọc
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })}
              aria-label="Tải lại danh sách"
            >
              <RefreshCw className={cn('size-3.5', fetchingConversations && 'animate-spin')} />
            </Button>
          </div>

          {loadingConversations ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{listEmptyText}</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((c) => {
                const isActive = c.id === active?.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2.5 text-left transition-colors',
                        isActive
                          ? 'border-neon/40 bg-neon/5'
                          : 'border-transparent hover:border-line hover:bg-ink',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-sm font-semibold',
                            isActive ? 'text-neon' : 'text-chalk',
                          )}
                        >
                          {c.partner.name}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="min-w-[20px] rounded-full bg-danger px-1.5 text-center text-[10px] font-bold leading-5 text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {c.lastMessagePreview || 'Chưa có tin nhắn'}
                      </p>
                      {c.lastMessageAt && (
                        <p className="mt-0.5 text-[11px] text-muted/70">
                          {formatDateTime(c.lastMessageAt)}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Cột phải: khung chat */}
      <Card className="flex min-h-[60vh] flex-col">
        {!activeIdResolved ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <MessageSquare className="size-8 text-muted" />
            <p className="text-sm text-muted">
              {emptyHint || 'Chọn một hội thoại trong danh sách để bắt đầu trò chuyện.'}
            </p>
          </div>
        ) : (
          <>
            {/* Header khung chat */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setActiveId(null)}
                aria-label="Quay lại danh sách"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="flex size-9 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-sm font-bold uppercase text-neon">
                {active.partner.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-chalk">{active.partner.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted">
                  {active.partner.type === 'TRAINER' ? 'Huấn luyện viên' : 'Hội viên'}
                  {active.partner.code ? ` • ${active.partner.code}` : ''}
                </p>
              </div>
            </div>

            {/* Tin nhắn */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingMessages ? (
                <>
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="ml-auto h-10 w-1/2" />
                  <Skeleton className="h-10 w-3/5" />
                </>
              ) : (messages?.data || []).length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!
                </p>
              ) : (
                [...(messages?.data || [])]
                  .reverse()
                  .map((m) => <MessageBubble key={m.id} message={m} mine={m.senderId === me?.id} />)
              )}

              {typingPartner && (
                <p className="text-xs italic text-muted">{active.partner.name} đang nhập...</p>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Nhập tin */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <Input
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder="Nhập tin nhắn..."
                aria-label="Nội dung tin nhắn"
                maxLength={2000}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim() || sendMutation.isPending}
                aria-label="Gửi tin nhắn"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </>
        )}
      </Card>

      {/* Phân trang danh sách hội thoại */}
      {!loadingConversations && (conversations?.total || 0) > CONVERSATION_LIMIT && (
        <p className="text-center text-xs text-muted lg:col-span-2">
          Hiển thị {items.length}/{conversations?.total} hội thoại — dùng ô tìm kiếm để thu hẹp.
        </p>
      )}
    </div>
  );
}

/* ----------------------------- Bong bóng tin nhắn ----------------------------- */
function MessageBubble({ message, mine }: { message: MessageItem; mine: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] space-y-2 rounded-2xl px-3.5 py-2.5 sm:max-w-[70%]',
          mine ? 'bg-neon/10 border border-neon/25' : 'bg-ink border border-line',
        )}
      >
        {message.type === 'MEAL_PLAN' && message.mealPlan ? (
          <div className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
            <Utensils className="mt-0.5 size-4 shrink-0 text-neon" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-chalk">
                {message.mealPlan.title || 'Thực đơn'}
              </p>
              <p className="text-xs text-muted">Huấn luyện viên đã gửi một kế hoạch thực đơn.</p>
            </div>
          </div>
        ) : null}

        {message.content && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-chalk">
            {message.content}
          </p>
        )}

        {(message.attachments || []).map((att) =>
          att.mimeType?.startsWith('image/') || att.kind === 'IMAGE' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={att.id}
              src={att.dataUrl}
              alt={att.fileName || 'Tệp đính kèm'}
              className="max-h-64 rounded-xl border border-line object-contain"
            />
          ) : (
            <p key={att.id} className="text-xs text-muted">
              {att.fileName || 'Tệp đính kèm'}
            </p>
          ),
        )}

        <div className="flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-muted">
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {mine && (
            <Badge variant={message.isRead ? 'success' : 'outline'} className="text-[10px]">
              {message.isRead ? 'Đã đọc' : 'Đã gửi'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
