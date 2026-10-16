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
import { MessageSquare, Send, User, Utensils } from 'lucide-react';

type Role = 'TRAINER' | 'MEMBER';

interface ChatClientProps {
  myRole: Role;
  emptyHint: string;
}

export default function ChatClient({ myRole, emptyHint }: ChatClientProps) {
  const qc = useQueryClient();
  const { ensure } = useChatSocket();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', activeConv] });
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
      setText('');
    },
  });

  const handleSend = () => {
    const t = text.trim();
    if (!t || sendMut.isPending) return;
    sendMut.mutate({ content: t });
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
          <CardContent className="flex flex-1 flex-col gap-2 overflow-auto p-3">
            <Input
              placeholder="Tìm theo tên, mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
            />
            {loadingConvs ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="divide-y divide-line/60">
                {filtered.map((c: ConversationItem) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-sm px-2 py-2.5 text-left transition hover:bg-line/30',
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
                  <p className="p-4 text-center text-sm text-muted">{emptyHint}</p>
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
          <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
            <div className="flex-1 space-y-2 overflow-auto pr-1">
              {loadingMsgs ? (
                <Skeleton className="h-20 w-3/4" />
              ) : (
                <>
                  {messageList.map((m: MessageItem) => {
                    const isMine =
                      myRole === 'TRAINER'
                        ? m.sender.role === 'TRAINER'
                        : m.sender.role === 'MEMBER';
                    return (
                      <div
                        key={m.id}
                        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-sm px-3 py-2 text-sm shadow-sm',
                            isMine
                              ? 'bg-neon/90 text-ink'
                              : 'border border-line bg-surface text-chalk',
                          )}
                        >
                          {m.type === 'IMAGE' && m.attachments[0]?.dataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.attachments[0].dataUrl}
                              alt={m.attachments[0].fileName || 'image'}
                              className="mb-1 max-h-64 rounded-sm object-cover"
                            />
                          ) : null}
                          {m.mealPlan && (
                            <div className="mb-1 flex items-center gap-2 rounded-sm border border-line/60 bg-ink/50 p-2">
                              <Utensils className="size-4 text-neon" />
                              <div>
                                <p className="font-semibold text-chalk">{m.mealPlan.title}</p>
                                <p className="text-xs text-muted">
                                  {m.mealPlan.scope === 'WEEK' ? 'Thực đơn tuần' : 'Thực đơn ngày'}{' '}
                                  • {m.mealPlan.totalCalories} kcal
                                </p>
                              </div>
                            </div>
                          )}
                          {m.content && (
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          )}
                          <p
                            className={cn(
                              'mt-1 text-[10px] opacity-70',
                              isMine ? 'text-ink/70' : 'text-muted',
                            )}
                          >
                            {new Date(m.createdAt).toLocaleTimeString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {messageList.length === 0 && activeConv && (
                    <p className="py-10 text-center text-sm text-muted">
                      Chưa có tin nhắn. Gửi lời chào nhé!
                    </p>
                  )}
                  {!activeConv && (
                    <p className="py-10 text-center text-sm text-muted">
                      Chọn một hội thoại để bắt đầu.
                    </p>
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
                disabled={!activeConv || sendMut.isPending}
              >
                Ảnh
              </Button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={!activeConv || sendMut.isPending}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!activeConv || !text.trim() || sendMut.isPending}
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
