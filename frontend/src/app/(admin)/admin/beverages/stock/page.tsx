'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { beverageApi } from '@/services/beverage.service';
import { getStoredUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { Boxes, ClipboardList, SlidersHorizontal } from 'lucide-react';

function message(error: unknown) {
  const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message || 'Không thể hoàn tất yêu cầu.';
}

const MOVEMENT_LABEL: Record<string, string> = {
  IMPORT: 'Nhập kho',
  SALE: 'Bán hàng',
  ADJUSTMENT: 'Điều chỉnh',
  IMPORT_RETURN: 'Trả hàng nhập',
  SALE_RETURN: 'Khách trả hàng',
};

export default function BeverageStockPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showMovements, setShowMovements] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustment, setAdjustment] = useState({ productId: '', quantityChange: '', reason: '' });
  const [canAdjust, setCanAdjust] = useState(false);
  const { data: options } = useQuery({
    queryKey: ['beverage-options'],
    queryFn: beverageApi.options,
    retry: 0,
  });
  useEffect(() => {
    const role = getStoredUser()?.role;
    setCanAdjust(role === 'ADMIN' || role === 'MANAGER');
  }, []);
  const params = {
    category: category || undefined,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
  };
  const {
    data: stock,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['beverage-stock', params],
    queryFn: () => beverageApi.stock(params),
    enabled: !showMovements,
    retry: 0,
  });
  const {
    data: movements,
    isLoading: movementsLoading,
    isError: movementsError,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ['beverage-movements', params],
    queryFn: () => beverageApi.movements(params),
    enabled: showMovements,
    retry: 0,
  });
  const adjustmentMutation = useMutation({
    mutationFn: beverageApi.adjustStock,
    onSuccess: () => {
      toast.success('Đã điều chỉnh tồn kho');
      queryClient.invalidateQueries({ queryKey: ['beverage-stock'] });
      queryClient.invalidateQueries({ queryKey: ['beverage-movements'] });
      queryClient.invalidateQueries({ queryKey: ['beverage-dashboard'] });
      setAdjustOpen(false);
      setAdjustment({ productId: '', quantityChange: '', reason: '' });
    },
    onError: (error) => toast.error('Điều chỉnh thất bại', message(error)),
  });
  const adjust = (event: React.FormEvent) => {
    event.preventDefault();
    const quantityChange = Number(adjustment.quantityChange);
    if (!adjustment.productId || !quantityChange || !adjustment.reason.trim()) {
      toast.error(
        'Thông tin điều chỉnh chưa đủ',
        'Chọn sản phẩm, nhập số lượng khác 0 và ghi lý do.',
      );
      return;
    }
    adjustmentMutation.mutate({
      productId: adjustment.productId,
      quantityChange,
      reason: adjustment.reason.trim(),
    });
  };
  const lowCount = stock?.filter((item) => item.stockStatus === 'LOW_STOCK').length ?? 0;
  const outCount = stock?.filter((item) => item.stockStatus === 'OUT_OF_STOCK').length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Quản lý kho</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk">
            Tồn kho nước uống
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showMovements ? 'outline' : 'secondary'}
            onClick={() => setShowMovements(false)}
          >
            <Boxes className="size-4" />
            Tồn hiện tại
          </Button>
          <Button
            variant={showMovements ? 'secondary' : 'outline'}
            onClick={() => setShowMovements(true)}
          >
            <ClipboardList className="size-4" />
            Lịch sử kho
          </Button>
          {canAdjust && (
            <Button onClick={() => setAdjustOpen(true)}>
              <SlidersHorizontal className="size-4" />
              Điều chỉnh
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: '', label: 'Tất cả danh mục' },
              ...(options?.categories ?? []).map((item) => ({ value: item, label: item })),
            ]}
          />
          <Input
            label="Tìm sản phẩm"
            placeholder="Tên hoặc mã"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            label="Từ ngày (lịch sử)"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="Đến ngày (lịch sử)"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </CardContent>
      </Card>
      {!showMovements && (
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="warning">Sắp hết: {lowCount}</Badge>
          <Badge variant="destructive">Hết hàng: {outCount}</Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {showMovements
              ? 'Lịch sử nhập, xuất và điều chỉnh'
              : `Tồn kho hiện tại · ${stock?.length ?? 0} dòng`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!showMovements ? (
            isLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isError ? (
              <div className="p-4">
                <ErrorState title="Không tải được tồn kho" onRetry={refetch} />
              </div>
            ) : !stock?.length ? (
              <EmptyState
                icon={Boxes}
                title="Chưa có tồn kho"
                description="Chọn bộ lọc khác hoặc nhập hàng vào kho."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-y border-line text-xs uppercase text-muted">
                    <tr>
                      {['Sản phẩm', 'Danh mục', 'Tồn hiện tại', 'Tối thiểu', 'Trạng thái'].map(
                        (h) => (
                          <th key={h} className="px-4 py-3">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {stock.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-3 text-chalk">
                          {item.productName}
                          <p className="text-xs text-muted">{item.productCode}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{item.category || '—'}</td>
                        <td
                          className={`px-4 py-3 font-bold ${item.stockStatus === 'OUT_OF_STOCK' || item.stockStatus === 'LOW_STOCK' ? 'text-danger' : 'text-neon'}`}
                        >
                          {item.stockQuantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-muted">{item.minStock}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              item.stockStatus === 'IN_STOCK'
                                ? 'success'
                                : item.stockStatus === 'LOW_STOCK'
                                  ? 'warning'
                                  : 'destructive'
                            }
                          >
                            {item.stockStatus === 'IN_STOCK'
                              ? 'Đủ hàng'
                              : item.stockStatus === 'LOW_STOCK'
                                ? 'Sắp hết'
                                : 'Hết hàng'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : movementsLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : movementsError ? (
            <div className="p-4">
              <ErrorState title="Không tải được lịch sử kho" onRetry={refetchMovements} />
            </div>
          ) : !movements?.length ? (
            <EmptyState
              icon={ClipboardList}
              title="Chưa có biến động kho"
              description="Các lần nhập, bán và điều chỉnh sẽ hiển thị tại đây."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-y border-line text-xs uppercase text-muted">
                  <tr>
                    {['Thời gian', 'Sản phẩm', 'Loại', 'Thay đổi', 'Người thực hiện / lý do'].map(
                      (h) => (
                        <th key={h} className="px-4 py-3">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {movements.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-muted">{formatDateTime(item.createdAt)}</td>
                      <td className="px-4 py-3 text-chalk">
                        {item.productName}
                        <p className="text-xs text-muted">{item.productCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.quantityChange > 0 ? 'success' : 'outline'}>
                          {MOVEMENT_LABEL[item.movementType] || item.movementType}
                        </Badge>
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${item.quantityChange > 0 ? 'text-neon' : 'text-danger'}`}
                      >
                        {item.quantityChange > 0 ? '+' : ''}
                        {item.quantityChange}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {item.createdByName || '—'}
                        <p className="max-w-xs truncate text-xs">{item.notes || '—'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Điều chỉnh tồn kho">
        <form className="space-y-4" onSubmit={adjust}>
          <Select
            label="Sản phẩm"
            required
            value={adjustment.productId}
            onChange={(e) => setAdjustment({ ...adjustment, productId: e.target.value })}
            options={[
              { value: '', label: 'Chọn sản phẩm' },
              ...(stock ?? []).map((item) => ({
                value: item.productId,
                label: `${item.productCode} — ${item.productName} (${item.stockQuantity})`,
              })),
            ]}
          />
          <Input
            label="Số lượng thay đổi (+ nhập / - giảm)"
            type="number"
            step="0.001"
            required
            value={adjustment.quantityChange}
            onChange={(e) => setAdjustment({ ...adjustment, quantityChange: e.target.value })}
          />
          <Input
            label="Lý do điều chỉnh"
            required
            value={adjustment.reason}
            onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
          />
          <p className="text-xs text-muted">
            Tồn kho sau điều chỉnh không được nhỏ hơn 0. Người thực hiện được lưu tự động.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={adjustmentMutation.isPending}>
              {adjustmentMutation.isPending ? 'Đang ghi...' : 'Ghi điều chỉnh'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
