'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowStep,
  Mail,
  Phone,
  Copy,
  KeyRound,
  Eye,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';
import {
  partnerApi,
  type PartnerLeadRecord,
  type PartnerLeadStatus,
} from '@/services/partner.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { gymTierLabel } from '@/lib/package-options';
import { Dialog } from '@/components/ui/dialog';
import {
  CLOSE_ACTION,
  LEAD_DIRECTION_LABELS,
  LEAD_PIPELINE,
  LEAD_STATUS_HINTS,
  LEAD_STATUS_LABELS,
  LeadDetailDialog,
  LeadStepper,
  LeadTransitionDialog,
  NEXT_STEP,
  canClose,
  leadStatusVariant,
} from '@/components/admin/partner-lead-workflow';

const LIMIT = 20;
type StepAction = NonNullable<(typeof NEXT_STEP)[PartnerLeadStatus]>;

export default function AdminPartnerLeadsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState({ search: '', status: '' });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [transition, setTransition] = useState<{
    lead: PartnerLeadRecord;
    action: StepAction;
  } | null>(null);
  const [accountLead, setAccountLead] = useState<PartnerLeadRecord | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [termMonths, setTermMonths] = useState(1);
  const [accountResult, setAccountResult] = useState<{
    emailSent: boolean;
    temporaryPassword?: string;
  } | null>(null);

  const query = useQuery({
    queryKey: ['admin-partner-leads', page, applied],
    queryFn: () => partnerApi.adminLeadList({ page, limit: LIMIT, ...applied }),
    retry: 1,
  });
  const createAccountMutation = useMutation({
    mutationFn: () =>
      partnerApi.adminCreatePartnerAccount(accountLead!.id, businessName.trim(), termMonths),
    onSuccess: (result) => {
      setAccountResult(result);
      queryClient.invalidateQueries({ queryKey: ['admin-partner-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-lead-history', accountLead!.id] });
      if (result.emailSent) success('Đã tạo tài khoản và gửi thông tin đăng nhập qua email.');
      else
        error('Đã tạo tài khoản nhưng gửi email thất bại. Hãy gửi mật khẩu tạm thời cho đối tác.');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không thể tạo tài khoản đối tác.';
      error(typeof message === 'string' ? message : JSON.stringify(message));
    },
  });

  const plansQuery = useQuery({
    queryKey: ['admin-partnership-plans'],
    queryFn: partnerApi.adminPlans,
    enabled: Boolean(accountLead),
  });
  const accountPlan = plansQuery.data?.find((plan) => plan.code === accountLead?.direction);

  const list = query.data?.data || [];
  const counts = query.data?.counts;
  const allCount = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : undefined;
  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / LIMIT));
  const detailLead = list.find((lead) => lead.id === detailId) ?? null;

  const applyFilters = (status = applied.status) => {
    setPage(1);
    setApplied({ search: search.trim(), status });
  };
  const openAction = (lead: PartnerLeadRecord, action: StepAction) =>
    setTransition({ lead, action });
  const openCreateAccount = (lead: PartnerLeadRecord) => {
    setAccountLead(lead);
    setBusinessName('');
    setTermMonths(1);
    setAccountResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          <Building2 className="size-6 text-neon" /> Yêu cầu hợp tác
        </h1>
        <p className="mt-1 text-xs text-muted">
          Xử lý theo quy trình: Mới nhận → Đã liên hệ → Đang tư vấn → Đã chốt hợp tác → Tạo tài
          khoản đối tác. Mỗi bước được ghi lại trong lịch sử.
        </p>
      </div>

      {/* Pipeline — bấm từng bước để lọc */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <PipelineTile
          label="Tất cả"
          hint="Mọi yêu cầu"
          count={allCount}
          active={applied.status === ''}
          onClick={() => applyFilters('')}
        />
        {[...LEAD_PIPELINE, 'CLOSED' as const].map((status, index) => (
          <PipelineTile
            key={status}
            step={status === 'CLOSED' ? undefined : index + 1}
            label={LEAD_STATUS_LABELS[status]}
            hint={LEAD_STATUS_HINTS[status]}
            count={counts?.[status]}
            active={applied.status === status}
            highlight={status === 'NEW' && (counts?.NEW ?? 0) > 0}
            onClick={() => applyFilters(status)}
          />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <div className="min-w-0 flex-1">
              <Input
                aria-label="Tìm kiếm yêu cầu"
                name="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên, email hoặc số điện thoại"
              />
            </div>
            <Button type="submit">
              <Search className="size-4" /> Tìm
            </Button>
          </form>

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
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="bg-ink/70 text-[11px] uppercase tracking-wider text-muted">
                    <tr className="border-b border-line">
                      <th className="p-3 font-semibold">Người liên hệ</th>
                      <th className="p-3 font-semibold">Hướng hợp tác</th>
                      <th className="p-3 font-semibold">Nội dung trao đổi</th>
                      <th className="p-3 font-semibold">Tiến độ</th>
                      <th className="p-3 font-semibold">Bước tiếp theo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.length ? (
                      list.map((lead) => {
                        const next = NEXT_STEP[lead.status];
                        return (
                          <tr
                            key={lead.id}
                            className="align-top transition-colors hover:bg-surface/50"
                          >
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => setDetailId(lead.id)}
                                className="text-left font-semibold text-chalk hover:text-neon"
                              >
                                {lead.contactName}
                              </button>
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
                            <td className="p-3 text-chalk">
                              {LEAD_DIRECTION_LABELS[lead.direction]}
                              <p className="mt-1 text-xs text-muted">
                                Gửi {formatDate(lead.createdAt)}
                              </p>
                              {lead.direction === 'COMMUNITY' && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <Badge variant={lead.assessedTier ? 'success' : 'warning'}>
                                    {lead.assessedTier
                                      ? `Hạng ${gymTierLabel(lead.assessedTier)}`
                                      : 'Chờ xếp hạng'}
                                  </Badge>
                                  <span className="flex items-center gap-1 text-[11px] text-muted">
                                    <ImageIcon className="size-3" />
                                    {lead._count?.photos ?? 0} ảnh
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="max-w-[300px] p-3 text-xs leading-relaxed text-muted">
                              <p className="line-clamp-3 whitespace-pre-wrap">
                                {lead.message || 'Chưa có nội dung bổ sung'}
                              </p>
                              {lead.notes && (
                                <p className="mt-2 line-clamp-2 border-l-2 border-line pl-2 italic">
                                  {lead.notes}
                                </p>
                              )}
                            </td>
                            <td className="w-52 p-3">
                              <Badge variant={leadStatusVariant(lead.status)}>
                                {LEAD_STATUS_LABELS[lead.status]}
                              </Badge>
                              <div className="mt-2">
                                <LeadStepper status={lead.status} compact />
                              </div>
                              <p className="mt-2 text-[11px] text-muted">
                                {lead.handledAt
                                  ? `Cập nhật ${formatDate(lead.handledAt)}`
                                  : 'Chưa xử lý'}
                              </p>
                            </td>
                            <td className="w-56 p-3">
                              <div className="flex flex-col gap-1.5">
                                {next && (
                                  <Button size="sm" onClick={() => openAction(lead, next)}>
                                    <next.icon className="size-3.5" /> {next.label}
                                  </Button>
                                )}
                                {lead.status === 'CONVERTED' &&
                                  (lead.accountCreated ? (
                                    <p className="py-1 text-xs font-semibold text-neon">
                                      ✓ Đã có tài khoản đối tác
                                    </p>
                                  ) : (
                                    <Button size="sm" onClick={() => openCreateAccount(lead)}>
                                      <KeyRound className="size-3.5" /> Tạo tài khoản
                                    </Button>
                                  ))}
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setDetailId(lead.id)}
                                  >
                                    <Eye className="size-3.5" /> Chi tiết
                                  </Button>
                                  {canClose(lead.status) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-danger"
                                      aria-label={`Đóng yêu cầu của ${lead.contactName}`}
                                      title="Đóng yêu cầu"
                                      onClick={() => openAction(lead, CLOSE_ACTION)}
                                    >
                                      <XCircle className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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

      <LeadDetailDialog
        lead={transition || accountLead ? null : detailLead}
        onClose={() => setDetailId(null)}
        onAction={openAction}
        onCreateAccount={openCreateAccount}
      />

      <LeadTransitionDialog
        lead={transition?.lead ?? null}
        action={transition?.action ?? null}
        onClose={() => setTransition(null)}
      />

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
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Thời hạn hợp đồng
              </span>
              <select
                value={termMonths}
                onChange={(event) => setTermMonths(Number(event.target.value))}
                className="h-11 w-full rounded-sm border border-line bg-ink px-3.5 text-sm text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
              >
                {[1, 3, 6, 12, 24, 36].map((m) => (
                  <option key={m} value={m}>
                    {m === 1
                      ? '1 tháng (mặc định)'
                      : `${m} tháng${m >= 12 ? ' · thỏa thuận nội bộ' : ''}`}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs text-muted">
                Loại: {accountLead ? LEAD_DIRECTION_LABELS[accountLead.direction] : ''}
                {accountPlan
                  ? ` · phí chốt ${formatCurrency(accountPlan.monthlyPrice)}/tháng · hết hạn ${formatDate(
                      new Date(new Date().setMonth(new Date().getMonth() + termMonths)),
                    )}`
                  : ''}
              </span>
              <span className="mt-1 block text-[11px] text-muted">
                Đối tác đăng ký theo tháng. Hợp đồng dài hạn chỉ chọn khi đã thỏa thuận riêng với
                đối tác (không hiển thị trên trang công khai).
              </span>
            </label>
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

function PipelineTile({
  label,
  hint,
  count,
  step,
  active,
  highlight,
  onClick,
}: {
  label: string;
  hint: string;
  count?: number;
  step?: number;
  active: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border p-3 text-left transition-colors',
        active ? 'border-neon/60 bg-neon/10' : 'border-line bg-surface hover:border-neon/40',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {step ? `Bước ${step}` : label === 'Tất cả' ? 'Tổng' : 'Kết thúc'}
        </span>
        {step && step < 4 && <ArrowStep className="size-3.5 text-muted" />}
      </span>
      <span
        className={cn(
          'mt-1 block font-display text-2xl font-extrabold',
          active || highlight ? 'text-neon' : 'text-chalk',
        )}
      >
        {count ?? '–'}
        {highlight && !active && (
          <span
            className="ml-1.5 inline-block size-2 rounded-full bg-neon align-middle"
            aria-hidden
          />
        )}
      </span>
      <span className="block text-sm font-semibold text-chalk">{label}</span>
      <span className="block text-[11px] text-muted">{hint}</span>
    </button>
  );
}
