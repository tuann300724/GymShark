'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import apiClient from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = { fullName: '', email: '', phone: '' };

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === 'string').join(', ');
    }
  }
  return error instanceof Error ? error.message : 'Không thể tạo tài khoản nhân viên';
}

export function CreateStaffAccountDialog({ open, onClose }: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/users/staff', {
        ...form,
        phone: form.phone.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success('Đã tạo tài khoản nhân viên', res.message);
      setForm(EMPTY_FORM);
      onClose();
      queryClient.invalidateQueries({ queryKey: ['staff-shift-options'] });
      queryClient.invalidateQueries({ queryKey: ['staff-accounts'] });
    },
    onError: (error) => toast.error('Tạo tài khoản thất bại', getErrorMessage(error)),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tạo tài khoản nhân viên"
      description="Nhân viên sẽ nhận email gồm thông tin đăng nhập và mật khẩu tạm thời."
      className="max-w-lg"
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="Họ và tên"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          maxLength={400}
          required
        />
        <Input
          label="Email đăng nhập"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          maxLength={400}
          required
        />
        <Input
          label="Số điện thoại (không bắt buộc)"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          maxLength={30}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Tạo tài khoản & gửi mật khẩu tạm thời
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
