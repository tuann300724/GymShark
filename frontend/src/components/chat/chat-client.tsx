'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ConversationItem, type MessageItem } from '@/services/chat.service';
import { useChatSocket } from '@/providers/chat-socket-provider';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquare, Send, User, Users, Utensils, Undo2, Check, CheckCheck } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Role = 'TRAINER' | 'MEMBER';

interface ChatClientProps {
  myRole: Role;
  emptyHint: string;
  /** Khi vào từ trang công khai: tự mở hội thoại với HLV này. */
  trainerId?: string | null;
}

export default function ChatClient({ myRole, emptyHint, trainerId }: ChatClientProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { ensure } = useChatSocket();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef('');
  const sendingRef = useRef(false);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    ensure();
  }, [ensure]);

  const { data: convs, isLoading: loadingConvs } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => chatApi.listConversations({ limit: 50 }),
  });

  const conversationList = useMemo(() => convs?.data ?? [], [convs?.data]);
  const filtered = conversationList.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.partner.name.toLowerCase().includes(q) || c.partner.code?.toLowerCase().includes(q);
  });

  const { data: msgs, isLoading: loadingMsgs } = useQuery({
    queryKey: ['chat-messages', activeConv],
    queryFn: () =>
      activeConv
        ? chatApi.getMessages(activeConv, { limit: 50 })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 50 }),
    enabled: !!activeConv,
  });

  const messageList = msgs?.data ?? [];

  // Tự chọn hội thoại đầu tiên
  useEffect(() => {
    if (!activeConv && conversationList.length > 0) {
      setActiveConv(conversationList[0].id);
    }
  }, [conversationList, activeConv]);

  // Vào từ "/trainers/:id" → mở (hoặc tạo) hội thoại với đúng HLV đó.
  // Chạy 1 lần cho mỗi trainerId; ref chặn tạo trùng khi React Query refetch.
  useEffect(() => {
    if (myRole !== 'MEMBER' || !trainerId || loadingConvs || autoStartedRef.current) return;
    const target = conversationList.find(
      (c) => c.partner.type === 'TRAINER' && c.partner.id === trainerId,
    );
    if (target) {
      autoStartedRef.current = true;
      setActiveConv(target.id);
      return;
    }
    autoStartedRef.current = true;
    chatApi
      .startConversation({ trainerId })
      .then((conv) => {
        void qc.invalidateQueries({ queryKey: ['chat-conversations'] });
        setActiveConv(conv.id);
      })
      .catch((e: any) => {
        toast.error(
          'Không thể mở hội thoại với huấn luyện viên',
          e?.response?.data?.message || e?.message,
        );
      });
  }, [myRole, trainerId, loadingConvs, conversationList, qc, toast]);

  // Mark read khi mở hội thoại
  useEffect(() => {
    if (!activeConv) return;
    const conv = conversationList.find((c) => c.id === activeConv);
    if (conv && conv.unreadCount > 0) {
      chatApi.markRead(activeConv).then(() => {
        qc.invalidateQueries({ queryKey: ['chat-conversations'] });
        qc.invalidateQueries({ queryKey: ['chat-unread'] });
      });
    }
  }, [activeConv, conversationList, qc]);

  // Cuộn xuống tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList.length]);

  const sendMut = useMutation({
    mutationFn: (payload: { content?: string; attachments?: any[] }) => {
      if (!activeConv) return Promise.reject(new Error('no conversation'));
      return chatApi.sendMessage(activeConv, {
        type: payload.attachments?.length ? 'IMAGE' : 'TEXT',
        content: payload.content,
        attachments: payload.attachments,
      });
    },
    onSuccess: (_data, payload) => {
      qc.invalidateQueries({ queryKey: ['chat-messages', activeConv] });
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (textRef.current.trim() === (payload.content ?? '')) {
        textRef.current = '';
        setText('');
      }
    },
    onSettled: () => {
      sendingRef.current = false;
      inputRef.current?.focus();
    },
  });

  const handleSend = () => {
    const t = text.trim();
    if (!t || sendingRef.current) return;
    sendingRef.current = true;
    sendMut.mutate({ content: t });
  };

  const recallMut = useMutation({
    mutationFn: (messageId: string) => {
      if (!activeConv) return Promise.reject(new Error('no conversation'));
      return chatApi.recallMessage(activeConv, messageId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', activeConv] });
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
      toast.success('Đã thu hồi tin nhắn');
    },
    onError: (e: any) => {
      toast.error('Không thể thu hồi', e?.response?.data?.message || e?.message);
    },
  });

  const handleRecall = async (messageId: string) => {
    const ok = await confirm({
      title: 'Thu hồi tin nhắn',
      description:
        'Tin nhắn sẽ bị xoá vĩnh viễn nội dung và ảnh đính kèm. Cả hai bên sẽ thấy "Tin nhắn đã được thu hồi".',
      type: 'danger',
    });
    if (ok) recallMut.mutate(messageId);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      sendMut.mutate({
        content: text.trim() || undefined,
        attachments: [
          {
            dataUrl: reader.result as string,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        ],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const activePartner = conversationList.find((c) => c.id === activeConv)?.partner;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Tin nhắn
        </h1>
        <p className="mt-1 text-sm text-muted">
          {myRole === 'TRAINER'
            ? 'Trò chuyện với hội viên đang được phân công.'
            : 'Trò chuyện với huấn luyện viên phụ trách.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:h-[calc(100vh-220px)]">
        {/* Danh sách hội thoại */}
        <Card className="flex flex-col overflow-hidden border-line bg-surface/95 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4" /> Hội thoại
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
            <Input
              placeholder="Tìm theo tên, mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
            />
            {loadingConvs ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-sm" />
                <Skeleton className="h-16 w-full rounded-sm" />
                <Skeleton className="h-16 w-full rounded-sm" />
              </div>
            ) : (
              <div className="divide-y divide-line/60">
                {filtered.map((c: ConversationItem) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors hover:bg-line/30',
                      activeConv === c.id && 'bg-neon/10',
                    )}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-ink text-muted">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-chalk">
                          {c.partner.name}
                        </p>
                        {c.unreadCount > 0 && (
                          <Badge variant="default" className="shrink-0">
                            {c.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted">
                        {c.lastMessagePreview || 'Chưa có tin nhắn'}
                      </p>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <EmptyState
                    icon={MessageSquare}
                    title="Chưa có hội thoại"
                    description={emptyHint}
                    className="border-0 bg-transparent px-3 py-8"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Khung chat */}
        <Card className="flex flex-col overflow-hidden border-line bg-surface/95 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {activePartner ? (
                <>
                  <div className="flex size-7 items-center justify-center rounded-full border border-line bg-ink text-muted">
                    <User className="size-3.5" />
                  </div>
                  <span>{activePartner.name}</span>
                </>
              ) : (
                'Tin nhắn'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
            <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {loadingMsgs ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-3/4 rounded-sm" />
                  <Skeleton className="ml-auto h-12 w-1/2 rounded-sm" />
                </div>
              ) : (
                <>
                  {messageList.map((m: MessageItem) => {
                    const isMine =
                      myRole === 'TRAINER'
                        ? m.sender.role === 'TRAINER'
                        : m.sender.role === 'MEMBER';
                    const isRecalled = !!m.recalledAt;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'group flex items-start gap-1.5',
                          isMine ? 'justify-end' : 'justify-start',
                        )}
                      >
                        {isMine && !isRecalled && (
                          <button
                            type="button"
                            onClick={() => handleRecall(m.id)}
                            disabled={recallMut.isPending}
                            title="Thu hồi tin nhắn"
                            aria-label="Thu hồi tin nhắn"
                            className="mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted opacity-40 transition hover:border-danger/40 hover:text-danger focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/40 md:opacity-0 md:group-hover:opacity-100 md:hover:opacity-100"
                          >
                            <Undo2 className="size-3.5" />
                          </button>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] rounded-[14px] px-3.5 py-2 text-sm',
                            isRecalled
                              ? isMine
                                ? 'rounded-br-[4px] border border-dashed border-line bg-surface/40'
                                : 'rounded-bl-[4px] border border-dashed border-line bg-surface/40'
                              : isMine
                                ? 'rounded-br-[4px] border border-neon/25 bg-neon/10 text-chalk'
                                : 'rounded-bl-[4px] border border-line bg-ink text-chalk',
                          )}
                        >
                          {isRecalled ? (
                            <p className="flex items-center gap-1.5 italic text-muted">
                              <Undo2 className="size-3.5 shrink-0" />
                              Tin nhắn đã được thu hồi
                            </p>
                          ) : (
                            <>
                              {m.type === 'IMAGE' && m.attachments[0]?.dataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.attachments[0].dataUrl}
                                  alt={m.attachments[0].fileName || 'Ảnh đính kèm'}
                                  className="mb-1 max-h-64 rounded-sm object-cover"
                                />
                              ) : null}
                              {m.mealPlan && <MealPlanCard message={m} />}
                              {m.content && (
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              )}
                            </>
                          )}
                          {isMine ? (
                            <p className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted/80">
                              <span>{new Date(m.createdAt).toLocaleTimeString('vi-VN')}</span>
                              {!isRecalled &&
                                (m.isRead ? (
                                  <span className="flex items-center gap-0.5 font-semibold text-neon">
                                    <CheckCheck className="size-3.5" />
                                    Đã xem
                                  </span>
                                ) : m.deliveredAt ? (
                                  <span className="flex items-center gap-0.5 text-muted">
                                    <CheckCheck className="size-3.5" />
                                    Đã nhận
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 text-muted">
                                    <Check className="size-3.5" />
                                    Đã gửi
                                  </span>
                                ))}
                            </p>
                          ) : (
                            <p className="mt-1 text-[10px] text-muted">
                              {new Date(m.createdAt).toLocaleTimeString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {messageList.length === 0 && activeConv && (
                    <EmptyState
                      icon={MessageSquare}
                      title="Chưa có tin nhắn"
                      description="Gửi lời chào để bắt đầu cuộc trò chuyện!"
                      className="border-0 bg-transparent px-4 py-8"
                    />
                  )}
                  {!activeConv && (
                    <EmptyState
                      icon={Users}
                      title="Chọn một hội thoại"
                      description="Chọn hội thoại ở danh sách bên trái để bắt đầu trò chuyện."
                      className="border-0 bg-transparent px-4 py-8"
                    />
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-line/60 pt-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={!activeConv || sendingRef.current}
              >
                Ảnh
              </Button>
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => {
                  textRef.current = e.target.value;
                  setText(e.target.value);
                }}
                placeholder="Nhập tin nhắn..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={!activeConv}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!activeConv || !text.trim() || sendingRef.current}
                aria-label="Gửi tin nhắn"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MealPlanCard({ message }: { message: MessageItem }) {
  const [expanded, setExpanded] = useState(false);
  const plan = message.mealPlan;
  if (!plan) return null;
  const meals = (plan.meals || []) as any[];
  return (
    <div className="mb-2 overflow-hidden rounded-sm border border-line/60 bg-ink/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 p-2 text-left transition hover:bg-ink"
      >
        <Utensils className="size-4 shrink-0 text-neon" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-chalk">{plan.title}</p>
          <p className="text-xs text-muted">
            {plan.scope === 'WEEK' ? 'Thực đơn tuần' : 'Thực đơn ngày'}• {plan.totalCalories ?? 0}{' '}
            kcal • {meals.length} bữa
          </p>
        </div>
        <span className="text-xs text-muted">{expanded ? 'Thu gọn' : 'Xem món'}</span>
      </button>
      {expanded && (
        <div className="border-t border-line/40 bg-surface/60 p-2">
          <div className="space-y-2">
            {meals.map((meal: any, i: number) => (
              <div key={i} className="rounded-sm border border-line/30 bg-ink p-2">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-neon">
                  <span className="uppercase tracking-wide">
                    {(meal.type || '')
                      .replace('BREAKFAST', 'Sáng')
                      .replace('LUNCH', 'Trưa')
                      .replace('DINNER', 'Tối')
                      .replace('SNACK', 'Phụ')}
                  </span>
                  {meal.time && <span className="text-muted">{meal.time}</span>}
                  <span className="ml-auto text-[10px] text-muted">{meal.note || ''}</span>
                </div>
                <div className="space-y-1">
                  {(meal.items || []).map((it: any, j: number) => (
                    <div
                      key={j}
                      className="flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-xs hover:bg-line/20"
                    >
                      <span className="text-chalk">{it.name}</span>
                      <span className="text-muted">
                        {it.quantity} {it.unit || 'g'} • {Math.round(it.calories || 0)} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
