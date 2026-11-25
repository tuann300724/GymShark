'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';
import { PackageFormDialog } from '@/components/admin/package-form-dialog';
import { formatCurrency } from '@/lib/utils';
import { formatTierList, formatVisitLimit, packageTypeBadge } from '@/lib/package-options';
import { Package, Plus, Check, Pencil, Trash2, Power, Ban, Dumbbell } from 'lucide-react';
import type { MembershipPackage } from '@/services/types';

export default function MembershipPackagesPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<MembershipPackage | null>(null);

  const {
    data: packages,
    isLoading,
    isError,
    refetch,
  } = useQuery<MembershipPackage[]>({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get('/membership-packages');
      return res.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['membership-packages'] });
    queryClient.invalidateQueries({ queryKey: ['public-packages'] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/membership-packages/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đã xóa gói tập', 'Gói tập đã được xóa khỏi hệ thống.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể xóa gói tập';
      toast.error('Không thể xóa', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const toggleStatus = (pkg: MembershipPackage) => {
    const next = pkg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    apiClient
      .patch(`/membership-packages/${pkg.id}`, { status: next })
      .then(() => {
        toast.success(
          next === 'ACTIVE' ? 'Gói đã mở bán' : 'Gói đã ngừng bán',
          `${pkg.name} ${next === 'ACTIVE' ? 'đã được mở bán lại' : 'đã ngừng bán'}.`,
        );
        invalidate();
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Thao tác thất bại';
        toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
      });
  };

  const openCreate = () => {
    setEditingPkg(null);
    setDialogOpen(true);
  };

  const openEdit = (pkg: MembershipPackage) => {
    setEditingPkg(pkg);
    setDialogOpen(true);
  };

  const confirmDelete = async (pkg: MembershipPackage) => {
    const ok = await confirm({
      title: 'Xác nhận xóa',
      description: `Xóa gói tập "${pkg.name}" khỏi hệ thống?`,
      type: 'danger',
    });
    if (ok) {
      deleteMutation.mutate(pkg.id);
    }
  };

  const tierList = (pkg: MembershipPackage) => formatTierList(pkg.gymTierAccess);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk flex items-center gap-2">
            <Package className="size-6 text-neon" />
            Gói Tập Gym (Membership Packages)
          </h1>
          <p className="text-xs text-muted mt-1">
            Thiết lập loại hình gói, hạn mức lượt tập, hạng phòng gym đối tác và biểu phí dịch vụ
          </p>
        </div>
        <Button variant="primary" size="md" className="font-semibold text-xs" onClick={openCreate}>
          <Plus className="size-4 mr-1.5" />
          Tạo Gói Tập Mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-xs text-muted">
          <Spinner /> Đang tải danh sách gói tập...
        </div>
      ) : isError ? (
        <ErrorState
          title="Không tải được gói tập"
          description="Không thể tải dữ liệu từ Backend. Hãy đảm bảo Backend đang chạy rồi thử lại."
          onRetry={() => refetch()}
        />
      ) : packages && packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isLegacy = pkg.type === 'SESSION_BASED';
            const tiers = tierList(pkg);
            return (
              <Card
                key={pkg.id}
                className={`relative flex flex-col justify-between transition-all ${
                  pkg.status === 'ACTIVE' && !isLegacy ? 'hover:border-neon/40' : 'opacity-75'
                }`}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {pkg.code}
                      </Badge>
                      <Badge variant={pkg.type === 'CREDIT_BASED' ? 'info' : 'default'}>
                        {packageTypeBadge(pkg.type)}
                      </Badge>
                    </div>
                    <Badge variant={pkg.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {pkg.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3 text-chalk">{pkg.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {pkg.description || 'Không có mô tả chi tiết'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-ink border border-line">
                    <span className="text-3xl font-extrabold text-neon font-display">
                      {formatCurrency(pkg.price)}
                    </span>
                    <span className="text-xs text-muted block mt-1">
                      Thời hạn: <strong className="text-chalk">{pkg.durationDays} ngày</strong>
                    </span>
                    <span className="text-xs text-muted block mt-1">
                      Hạn mức lượt: <strong className="text-chalk">{formatVisitLimit(pkg)}</strong>
                    </span>
                    <span className="text-xs text-muted mt-1 flex items-start gap-1.5">
                      <Dumbbell className="size-3.5 mt-0.5 shrink-0 text-neon" />
                      <span>
                        Hạng phòng gym:{' '}
                        {tiers ? (
                          <span className="flex flex-wrap gap-1.5">
                            {tiers.split(' · ').map((tier) => (
                              <Badge key={tier} variant="outline" className="text-[10px]">{tier}</Badge>
                            ))}
                          </span>
                        ) : (
                          <strong className="text-chalk">Chưa chọn hạng</strong>
                        )}
                      </span>
                    </span>
                    {(pkg._count?.memberships ?? 0) > 0 && (
                      <span className="text-[11px] text-muted block mt-1">
                        Đã bán {pkg._count?.memberships} thẻ
                      </span>
                    )}
                  </div>
                  <ul className="text-xs space-y-2 text-muted">
                    {(pkg.features?.items || []).slice(0, 4).map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-4 text-neon shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="grid w-full grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold"
                      onClick={() => openEdit(pkg)}
                      disabled={isLegacy}
                    >
                      <Pencil className="size-3.5 mr-1" /> Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold"
                      onClick={() => toggleStatus(pkg)}
                      disabled={isLegacy}
                    >
                      {pkg.status === 'ACTIVE' ? (
                        <>
                          <Ban className="size-3.5 mr-1" /> Ngừng bán
                        </>
                      ) : (
                        <>
                          <Power className="size-3.5 mr-1 text-neon" /> Mở bán
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold text-danger"
                      isLoading={deleteMutation.isPending}
                      onClick={() => confirmDelete(pkg)}
                    >
                      <Trash2 className="size-3.5 mr-1" /> Xóa
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="Chưa có gói tập"
          description="Chưa có gói tập nào được khởi tạo. Nhấn Tạo Gói Tập Mới để bắt đầu."
        />
      )}

      {/* Create/Edit dialog */}
      <PackageFormDialog
        open={dialogOpen}
        pkg={editingPkg}
        onClose={() => setDialogOpen(false)}
        onSaved={invalidate}
      />
    </div>
  );
}
