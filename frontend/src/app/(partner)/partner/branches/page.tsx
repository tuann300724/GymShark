'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoredUser } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { PartnerBranchInput, PartnerBranchRecord, partnerApi } from '@/services/partner.service';
import BranchAddressPicker from '@/components/partners/branch-address-picker';

const EMPTY_FORM: PartnerBranchInput = { name: '', address: '', phone: '' };

export default function PartnerBranchesPage() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState<PartnerBranchRecord | null>(null);
  const [form, setForm] = useState<PartnerBranchInput>(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  // Chỉ chủ đối tác thêm/sửa/xóa cơ sở; nhân viên chỉ xem
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => setIsStaff(Boolean(getStoredUser()?.partnerStaff)), []);

  const branchesQuery = useQuery({
    queryKey: ['partner-my-branches'],
    queryFn: partnerApi.getMyBranches,
    retry: 0,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing ? partnerApi.updateMyBranch(editing.id, form) : partnerApi.createMyBranch(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-my-branches'] });
      toast.success(editing ? 'Đã cập nhật cơ sở' : 'Đã thêm cơ sở');
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (error: any) =>
      toast.error('Không lưu được cơ sở', error.response?.data?.message || 'Vui lòng thử lại.'),
  });

  const deleteMutation = useMutation({
    mutationFn: partnerApi.deleteMyBranch,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['partner-my-branches'] });
      toast.success(result.message || 'Đã xóa cơ sở');
    },
    onError: (error: any) =>
      toast.error('Không xóa được cơ sở', error.response?.data?.message || 'Vui lòng thử lại.'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (branch: PartnerBranchRecord) => {
    setEditing(branch);
    setForm({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      latitude: branch.latitude ?? undefined,
      longitude: branch.longitude ?? undefined,
    });
    setOpen(true);
  };

  const removeBranch = async (branch: PartnerBranchRecord) => {
    const ok = await confirm({
      title: 'Xóa cơ sở này?',
      description: `Cơ sở “${branch.name}” sẽ bị xóa khỏi danh sách doanh nghiệp.`,
      type: 'danger',
    });
    if (ok) deleteMutation.mutate(branch.id);
  };

  const updateField = (
    field: keyof Pick<PartnerBranchInput, 'name' | 'address' | 'phone'>,
    value: string,
  ) => setForm((current) => ({ ...current, [field]: value }));

  const updateAddress = useCallback(
    (address: string) => setForm((current) => ({ ...current, address })),
    [],
  );

  const updateCoordinates = useCallback(
    (point: { lat: number; lng: number } | null) =>
      setForm((current) => ({
        ...current,
        latitude: point?.lat ?? undefined,
        longitude: point?.lng ?? undefined,
      })),
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Doanh nghiệp</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight text-chalk">
            Cơ sở / Chi nhánh
          </h1>
          <p className="mt-1 text-sm text-muted">
            Thêm và cập nhật thông tin các địa điểm thuộc doanh nghiệp của bạn.
          </p>
        </div>
        {!isStaff && (
          <Button variant="primary" onClick={openCreate}>
            <Plus className="size-4" /> Thêm cơ sở
          </Button>
        )}
      </header>

      {branchesQuery.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => (
            <Skeleton key={item} className="h-40" />
          ))}
        </div>
      ) : branchesQuery.isError ? (
        <ErrorState
          title="Không tải được danh sách cơ sở"
          description="Vui lòng thử tải lại."
          onRetry={() => branchesQuery.refetch()}
        />
      ) : branchesQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branchesQuery.data.map((branch) => (
            <Card key={branch.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-ink text-neon">
                    <Building2 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg text-chalk">{branch.name}</CardTitle>
                    <CardDescription className="mt-1">Cơ sở thuộc doanh nghiệp</CardDescription>
                  </div>
                </div>
                <span className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-1 text-xs font-semibold text-neon">
                  {branch.status === 'ACTIVE' ? 'Đang hoạt động' : branch.status}
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted">
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{branch.address || 'Chưa cập nhật địa chỉ'}</span>
                  </p>
                  <p className="flex gap-2">
                    <Phone className="size-4 shrink-0" />
                    <span>{branch.phone || 'Chưa cập nhật số điện thoại'}</span>
                  </p>
                </div>
                <div
                  className={`mt-5 flex justify-end gap-2 border-t border-line pt-4 ${isStaff ? 'hidden' : ''}`}
                >
                  <Button variant="outline" size="sm" onClick={() => openEdit(branch)}>
                    <Pencil className="size-3.5" /> Sửa
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={deleteMutation.isPending}
                    onClick={() => removeBranch(branch)}
                  >
                    <Trash2 className="size-3.5" /> Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="Doanh nghiệp chưa có cơ sở nào"
          description="Thêm địa điểm đầu tiên để quản lý thông tin chi nhánh của doanh nghiệp."
          action={
            isStaff ? undefined : (
              <Button variant="primary" onClick={openCreate}>
                <Plus className="size-4" /> Thêm cơ sở
              </Button>
            )
          }
        />
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Cập nhật cơ sở' : 'Thêm cơ sở mới'}
        description="Thông tin này chỉ thuộc doanh nghiệp đang đăng nhập."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (form.name.trim()) saveMutation.mutate();
          }}
        >
          <Input
            label="Tên cơ sở *"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            required
            maxLength={200}
          />
          <BranchAddressPicker
            key={editing?.id || 'new-branch'}
            initialAddress={editing?.address || ''}
            initialLatitude={editing?.latitude ?? undefined}
            initialLongitude={editing?.longitude ?? undefined}
            onAddressChange={updateAddress}
            onCoordinatesChange={updateCoordinates}
          />
          <Input
            label="Số điện thoại"
            value={form.phone || ''}
            onChange={(event) => updateField('phone', event.target.value)}
            maxLength={30}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
              {editing ? 'Lưu thay đổi' : 'Tạo cơ sở'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
