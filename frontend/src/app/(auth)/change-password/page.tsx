'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { authApi } from '@/services/auth.service';
import { getPortalHome, getStoredUser, type StoredUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MIN_LENGTH = 8;

/**
 * Bắt đổi mật khẩu ở lần đăng nhập đầu: tài khoản PT / đối tác được GymMaster cấp
 * mật khẩu tạm qua email. Các guard khu /trainer, /partner chuyển về đây cho tới khi đổi xong.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  const logout = () => {
    authApi.clearSession();
    queryClient.clear();
    router.replace('/login');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < MIN_LENGTH)
      return setError(`Mật khẩu mới phải có tối thiểu ${MIN_LENGTH} ký tự.`);
    if (newPassword !== confirmPassword) return setError('Mật khẩu nhập lại không khớp.');
    if (newPassword === currentPassword)
      return setError('Mật khẩu mới phải khác mật khẩu tạm được cấp.');

    setLoading(true);
    try {
      await memberApi.changePassword(currentPassword, newPassword);
      const stored = getStoredUser();
      if (stored) {
        localStorage.setItem('gym_user', JSON.stringify({ ...stored, mustChangePassword: false }));
      }
      router.replace(getPortalHome(stored?.role));
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  const firstLogin = Boolean(user.mustChangePassword);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-line bg-surface/95 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
              <KeyRound className="size-6 text-neon" />
              {firstLogin ? 'Đặt mật khẩu mới' : 'Đổi mật khẩu'}
            </CardTitle>
            <CardDescription>
              {firstLogin
                ? `Xin chào ${user.fullName}! Đây là lần đăng nhập đầu tiên bằng mật khẩu tạm GymMaster gửi qua email. Vui lòng đặt mật khẩu riêng để tiếp tục.`
                : 'Nhập mật khẩu hiện tại và mật khẩu mới.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <PasswordInput
                id="cp-current"
                label={firstLogin ? 'Mật khẩu tạm (trong email)' : 'Mật khẩu hiện tại'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <PasswordInput
                id="cp-new"
                label="Mật khẩu mới"
                required
                minLength={MIN_LENGTH}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`Tối thiểu ${MIN_LENGTH} ký tự`}
                autoComplete="new-password"
              />
              <PasswordInput
                id="cp-confirm"
                label="Nhập lại mật khẩu mới"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                <ShieldCheck className="size-4" /> Lưu mật khẩu mới
              </Button>
              <button
                type="button"
                onClick={logout}
                className="mx-auto flex items-center gap-1.5 text-xs text-muted hover:text-chalk"
              >
                <LogOut className="size-3.5" /> Đăng xuất
              </button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
