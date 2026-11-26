'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Copy,
  KeyRound,
} from 'lucide-react';
import {
  partnerApi,
  type PartnerLeadRecord,
  type PartnerLeadStatus,
} from '@/services/partner.service';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';

const LIMIT = 20;
const STATUS_LABELS: Record<PartnerLeadStatus, string> = {
  NEW: 'Mới nhận',
  CONTACTED: 'Đã liên hệ',
  CONVERTED: 'Đã hợp tác',
  CLOSED: 'Đã đóng',
};
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];
const DIRECTION_LABELS = { OWNER: 'Phòng gym riêng', COMMUNITY: 'Gym Cộng đồng' };

export default function AdminPartnerLeadsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState({ search: '', status: '' });
  const [accountLead, setAccountLead] = useState<PartnerLeadRecord | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [accountResult, setAccountResult] = useState<{
    emailSent: boolean;
    temporaryPassword?: string;
  } | null>(null);

  const query = useQuery({
    queryKey: ['admin-partner-leads', page, applied],
    queryFn: () => partnerApi.adminLeadList({ page, limit: LIMIT, ...applied }),
    retry: 1,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: PartnerLeadStatus }) =>
      partnerApi.adminUpdateLead(id, { status: nextStatus }),
    onSuccess: () => {
      success('Đã cập nhật trạng thái yêu cầu.');
      queryClient.invalidateQueries({ queryKey: ['admin-partner-leads'] });
    },
    onError: () => error('Không thể cập nhật trạng thái. Vui lòng thử lại.'),
  });
  const createAccountMutation = useMutation({
    mutationFn: () => partnerApi.adminCreatePartnerAccount(accountLead!.id, businessName.trim()),
    onSuccess: (result) => {
      setAccountResult(result);
      queryClient.invalidateQueries({ queryKey: ['admin-partner-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      if (result.emailSent) success('Đã tạo tài khoản và gửi thông tin đăng nhập qua email.');
      else
        error('Đã tạo tài khoản nhưng gửi email thất bại. Hãy gửi mật khẩu tạm thời cho đối tác.');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không thể tạo tài khoản đối tác.';
      error(typeof message === 'string' ? message : JSON.stringify(message));
    },
  });

  const list = query.data?.data || [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / LIMIT));
  const applyFilters = () => {
    setPage(1);
    setApplied({ search: search.trim(), status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          <Building2 className="size-6 text-neon" /> Yêu cầu hợp tác
        </h1>
        <p className="mt-1 text-xs text-muted">
          Thông tin gửi từ trang Đối tác. Liên hệ trực tiếp và cập nhật trạng thái xử lý tại đây.
        </p>
      </div>

      <StatCard
        title="Yêu cầu mới trong trang"
        value={list.filter((lead) => lead.status === 'NEW').length}
        subtitle={`${query.data?.total || 0} yêu cầu khớp bộ lọc`}
        icon={Building2}
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
            <Input
              label="Tìm kiếm"
              name="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên, email hoặc số điện thoại"
              onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
            />
            <Select
              label="Trạng thái"
              name="status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
            <div className="flex items-end">
              <Button onClick={applyFilters}>
                <Search className="size-4" /> Lọc yêu cầu
              </Button>
            </div>
          </div>

          {query.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : query.isError ? (
            <ErrorState
              description="Không tải được yêu cầu hợp tác. Hãy kiểm tra quyền admin và kết nối API."
              onRetry={() => query.refetch()}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-ink/70 text-[11px] uppercase tracking-wider text-muted">
                    <tr className="border-b border-line">
                      <th className="p-3 font-semibold">Người liên hệ</th>
                      <th className="p-3 font-semibold">Hướng hợp tác</th>
                      <th className="p-3 font-semibold">Nội dung trao đổi</th>
                      <th className="p-3 font-semibold">Ngày nhận</th>
                      <th className="p-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.length ? (
                      list.map((lead) => (
                        <tr
                          key={lead.id}
                          className="align-top transition-colors hover:bg-surface/50"
                        >
                          <td className="p-3">
                            <p className="font-semibold text-chalk">{lead.contactName}</p>
                            {lead.address && (
                              <p className="mt-1 max-w-[240px] text-xs text-muted">
                                {lead.address}
                              </p>
                            )}
                            <a
                              className="mt-2 flex items-center gap-1.5 text-xs text-neon hover:underline"
                              href={`tel:${lead.phone}`}
                            >
                              <Phone className="size-3.5" />
                              {lead.phone}
                            </a>
                            <a
                              className="mt-1 flex items-center gap-1.5 text-xs text-neon hover:underline"
                              href={`mailto:${lead.email}`}
                            >
                              <Mail className="size-3.5" />
                              {lead.email}
                            </a>
                          </td>
                          <td className="p-3 text-chalk">{DIRECTION_LABELS[lead.direction]}</td>
                          <td className="max-w-[360px] whitespace-pre-wrap p-3 text-xs leading-relaxed text-muted">
                            {lead.message || 'Chưa có nội dung bổ sung'}
                          </td>
                          <td className="whitespace-nowrap p-3 text-xs text-muted">
                            {formatDate(lead.createdAt)}
                          </td>
                          <td className="w-44 p-3">
                            <Select
                              aria-label={`Trạng thái yêu cầu của ${lead.contactName}`}
                              name={`status-${lead.id}`}
                              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                                value,
                                label,
                              }))}
                              value={lead.status}
                              disabled={updateMutation.isPending}
                              onChange={(event) =>
                                updateMutation.mutate({
                                  id: lead.id,
                                  nextStatus: event.target.value as PartnerLeadStatus,
                                })
                              }
                            />
                            <Badge
                              variant={
                                lead.status === 'NEW'
                                  ? 'warning'
                                  : lead.status === 'CONVERTED'
                                    ? 'success'
                                    : 'outline'
                              }
                              className="mt-2"
                            >
                              {STATUS_LABELS[lead.status]}
                            </Badge>
                            {lead.status === 'CONVERTED' &&
                              (lead.accountCreated ? (
                                <p className="mt-2 text-xs font-semibold text-neon">
                                  Đã có tài khoản
                                </p>
                              ) : (
                                <Button
                                  className="mt-2 w-full"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setAccountLead(lead);
                                    setBusinessName('');
                                    setAccountResult(null);
                                  }}
                                >
                                  <KeyRound className="size-3.5" /> Tạo tài khoản
                                </Button>
                              ))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-xs text-muted">
                          Chưa có yêu cầu nào khớp bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  Trang {page} / {totalPages} · {query.data?.total || 0} yêu cầu
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    <ChevronLeft className="size-3.5" /> Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Sau <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(accountLead)}
        onClose={() => {
          if (!createAccountMutation.isPending) setAccountLead(null);
        }}
        title={accountResult ? 'Đã tạo tài khoản đối tác' : 'Tạo tài khoản sau khi chốt hợp đồng'}
        description={accountLead ? `${accountLead.contactName} · ${accountLead.email}` : undefined}
      >
        {accountResult ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {accountResult.emailSent
                ? 'Tài khoản đã được tạo và thông tin đăng nhập đã gửi đến email đối tác.'
                : 'Tài khoản đã được tạo nhưng email chưa gửi được. Hãy chuyển mật khẩu tạm thời cho đối tác qua kênh an toàn.'}
            </p>
            {accountResult.temporaryPassword && (
              <div className="rounded-xl border border-neon/30 bg-neon/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Mật khẩu tạm thời · chỉ hiển thị lần này
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-ink p-3 text-sm text-chalk">
                    {accountResult.temporaryPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(accountResult.temporaryPassword!)}
                  >
                    <Copy className="size-4" /> Sao chép
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setAccountLead(null)}>Đóng</Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createAccountMutation.mutate();
            }}
          >
            <p className="text-sm leading-relaxed text-muted">
              Hệ thống sẽ tạo tài khoản PARTNER đã kích hoạt, thêm cơ sở đầu tiên và gửi email đăng
              nhập kèm mật khẩu tạm thời đến địa chỉ trên.
            </p>
            <Input
              label="Tên phòng gym / doanh nghiệp *"
              name="businessName"
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="VD: Gym Alpha"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={createAccountMutation.isPending}
                onClick={() => setAccountLead(null)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                isLoading={createAccountMutation.isPending}
                disabled={!businessName.trim()}
              >
                Tạo tài khoản và gửi email
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
