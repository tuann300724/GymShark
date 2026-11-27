'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import { trainerApi } from '@/services/trainer.service';
import { ptSessionApi } from '@/services/pt-session.service';

const DURATIONS = [30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: `${m} phút` }));

/** Ngày mai, 18:00 — giá trị mặc định cho ô ngày/giờ */
function defaultStart() {
  const d = new Date(Date.now() + 86400_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: '18:00' };
}

/**
 * PT gửi đề nghị buổi tập cho hội viên trong chat: thời gian, thời lượng, giá.
 * Hiển thị trước phần chiết khấu GymMaster và thu nhập PT nhận được.
 */
export function PtSessionOfferDialog({
  open,
  onClose,
  memberId,
  memberName,
}: {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['trainer-my-profile'],
    queryFn: trainerApi.myProfile,
    enabled: open,
  });
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    price: '',
    note: '',
  });

  useEffect(() => {
    if (!open) return;
    const { date, time } = defaultStart();
    setForm({
      title: 'Buổi tập 1:1',
      date,
      time,
      duration: '60',
      price: profile?.hourlyRate ? String(Number(profile.hourlyRate)) : '',
      note: '',
    });
  }, [open, profile?.hourlyRate]);

  const rate = Number(profile?.commissionRate ?? 20);
  const price = Number(form.price) || 0;
  const fee = Math.round((price * rate) / 100);

  const create = useMutation({
    mutationFn: () =>
      ptSessionApi.create({
        memberId,
        title: form.title.trim(),
        startTime: new Date(`${form.date}T${form.time}`).toISOString(),
        durationMinutes: Number(form.duration),
        price,
        note: form.note.trim() || undefined,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['chat-messages'] });
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
      onClose();
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message;
      toast.error('Không gửi được đề nghị', Array.isArray(m) ? m.join(', ') : m);
    },
  });

  const valid = form.title.trim().length >= 2 && form.date && form.time && price >= 10000;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Đề nghị buổi tập"
      description={`Gửi cho ${memberName}. Hội viên chấp nhận và thanh toán qua GymMaster thì buổi tập mới được xếp lịch.`}
    >
      <div className="space-y-3">
        <Input
          id="pt-offer-title"
          label="Tên buổi tập"
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            id="pt-offer-date"
            label="Ngày"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            id="pt-offer-time"
            label="Giờ bắt đầu"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <Select
            id="pt-offer-duration"
            label="Thời lượng"
            options={DURATIONS}
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
        </div>
        <Input
          id="pt-offer-price"
          label="Giá buổi tập (VND)"
          type="number"
          min={10000}
          step={10000}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-ink p-3 text-center text-xs">
          <div>
            <p className="text-muted">Hội viên trả</p>
            <p className="mt-0.5 font-semibold text-chalk">{formatCurrency(price)}</p>
          </div>
          <div>
            <p className="text-muted">Chiết khấu {rate}%</p>
            <p className="mt-0.5 font-semibold text-chalk">−{formatCurrency(fee)}</p>
          </div>
          <div>
            <p className="text-muted">Bạn nhận</p>
            <p className="mt-0.5 font-display text-base font-bold text-neon">
              {formatCurrency(price - fee)}
            </p>
          </div>
        </div>
        <Textarea
          id="pt-offer-note"
          label="Ghi chú cho hội viên"
          rows={3}
          maxLength={1000}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Địa điểm, nội dung buổi tập, cần chuẩn bị gì..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={!valid} isLoading={create.isPending} onClick={() => create.mutate()}>
            <Send className="size-4" /> Gửi đề nghị
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
