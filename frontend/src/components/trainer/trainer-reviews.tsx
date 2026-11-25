'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Pencil, Star, Trash2 } from 'lucide-react';
import { publicApi } from '@/services/package.service';
import { trainerReviewApi } from '@/services/trainer-review.service';
import { getStoredUser } from '@/lib/auth';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface TrainerReviewsProps {
  trainerId: string;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'size-3.5',
            star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted/50',
          )}
        />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Chọn số sao">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} sao`}
          aria-pressed={value === star}
          onClick={() => onChange(star)}
          className="rounded-sm p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'size-6',
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted/60',
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-chalk">{value}/5</span>
    </div>
  );
}

export function TrainerReviews({ trainerId }: TrainerReviewsProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);

  // getStoredUser đọc localStorage — chỉ gọi sau hydration để tránh lệch SSR.
  useEffect(() => {
    setViewerRole(getStoredUser()?.role ?? null);
  }, []);

  const {
    data: reviews,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['public-trainer-reviews', trainerId],
    queryFn: () => publicApi.getTrainerReviews(trainerId, { limit: 50 }),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const { data: mine, refetch: refetchMine } = useQuery({
    queryKey: ['my-trainer-review', trainerId],
    queryFn: () => trainerReviewApi.mine(trainerId),
    enabled: viewerRole === 'MEMBER',
    retry: 0,
  });

  useEffect(() => {
    if (mine?.review) {
      setRating(mine.review.rating);
      setComment(mine.review.comment ?? '');
    }
  }, [mine?.review]);

  const refresh = () => {
    void refetch();
    void refetchMine();
    qc.invalidateQueries({ queryKey: ['public-trainer', trainerId] });
    qc.invalidateQueries({ queryKey: ['public-trainers'] });
  };

  const saveMut = useMutation({
    mutationFn: () =>
      mine?.review
        ? trainerReviewApi.update(mine.review.id, { rating, comment })
        : trainerReviewApi.create({ trainerId, rating, comment }),
    onSuccess: () => {
      toast.success(mine?.review ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá HLV');
      setEditing(false);
      refresh();
    },
    onError: (e: any) =>
      toast.error('Không thể lưu đánh giá', e?.response?.data?.message || e?.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => trainerReviewApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá đánh giá');
      setEditing(false);
      setComment('');
      refresh();
    },
    onError: (e: any) =>
      toast.error('Không thể xoá đánh giá', e?.response?.data?.message || e?.message),
  });

  const handleDelete = async () => {
    if (!mine?.review) return;
    const ok = await confirm({
      title: 'Xoá đánh giá',
      description: 'Đánh giá của bạn về huấn luyện viên này sẽ bị xoá vĩnh viễn.',
      type: 'danger',
    });
    if (ok) deleteMut.mutate(mine.review.id);
  };

  const showForm = viewerRole === 'MEMBER' && (editing || (!mine?.review && mine?.eligible));

  return (
    <section className="container-x pb-16 lg:pb-20">
      <div className="rounded-2xl border border-line bg-surface p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="meta-label !text-neon">Đánh giá từ hội viên</p>
            <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk lg:text-3xl">
              HLV được đánh giá thế nào
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-ink px-4 py-3">
            <span className="font-display text-3xl font-extrabold leading-none text-neon">
              {(reviews?.averageRating ?? 0).toFixed(1)}
            </span>
            <div>
              <Stars value={reviews?.averageRating ?? 0} />
              <p className="mt-0.5 text-xs text-muted">{reviews?.total ?? 0} đánh giá</p>
            </div>
          </div>
        </div>

        {/* Form đánh giá / trạng thái của người xem */}
        {viewerRole === null && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink p-4">
            <MessageSquare className="size-5 shrink-0 text-neon" />
            <p className="text-sm text-muted">Cần có tài khoản để đánh giá huấn luyện viên.</p>
            <Link
              href={`/login?next=${encodeURIComponent(`/trainers/${trainerId}`)}`}
              className="ml-auto text-sm font-semibold text-neon hover:underline"
            >
              Đăng nhập
            </Link>
          </div>
        )}

        {viewerRole === 'MEMBER' && !showForm && (
          <div className="mt-6 rounded-xl border border-line bg-ink p-4 text-sm text-muted">
            {mine?.review ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-chalk">Đánh giá của bạn</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Stars value={mine.review.rating} />
                    <span className="text-sm">{mine.review.comment || 'Không có bình luận'}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="size-4" /> Xoá
                </Button>
              </div>
            ) : mine ? (
              'Bạn cần hoàn thành buổi tập với huấn luyện viên này trước khi đánh giá.'
            ) : (
              <Skeleton className="h-10 w-full" />
            )}
          </div>
        )}

        {showForm && (
          <div className="mt-6 space-y-4 rounded-xl border border-neon/30 bg-ink p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Điểm đánh giá
              </p>
              <div className="mt-2">
                <StarPicker value={rating} onChange={setRating} />
              </div>
            </div>
            <Textarea
              label="Bình luận (không bắt buộc)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm tập luyện của bạn..."
              maxLength={2000}
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                isLoading={saveMut.isPending}
                onClick={() => saveMut.mutate()}
              >
                {mine?.review ? 'Lưu đánh giá' : 'Gửi đánh giá'}
              </Button>
              {editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Huỷ
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Danh sách đánh giá */}
        <div className="mt-8 border-t border-line pt-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !reviews || reviews.data.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Chưa có đánh giá nào"
              description="Hãy là người đầu tiên chia sẻ trải nghiệm sau khi hoàn thành buổi tập cùng HLV."
            />
          ) : (
            <ul className="space-y-3">
              {reviews.data.map((item) => (
                <li key={item.id} className="rounded-xl border border-line bg-ink p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neon/30 bg-neon/10 text-sm font-bold uppercase text-neon">
                      {item.member.fullName?.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-chalk">
                        {item.member.fullName}
                      </p>
                      <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
                    </div>
                    <Stars value={item.rating} />
                  </div>
                  {item.comment && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                      {item.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
