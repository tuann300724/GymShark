'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  beverageApi,
  type BeverageImport,
  type BeverageProduct,
} from '@/services/beverage.service';
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
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ClipboardList, Eye, PackageCheck, Plus, Trash2 } from 'lucide-react';

interface ImportLine {
  productId: string;
  quantity: string;
  unitCost: string;
  batchNumber: string;
  expiryDate: string;
}

function message(error: unknown) {
  const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message || 'Không thể hoàn tất yêu cầu.';
}

const EMPTY_LINE: ImportLine = {
  productId: '',
  quantity: '1',
  unitCost: '',
  batchNumber: '',
  expiryDate: '',
};
const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function BeverageImportsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [branchId, setBranchId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [importDate, setImportDate] = useState(localDate());
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ImportLine[]>([{ ...EMPTY_LINE }]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState('');

  const { data: options } = useQuery({
    queryKey: ['beverage-options'],
    queryFn: beverageApi.options,
    retry: 0,
  });
  const { data: products } = useQuery({
    queryKey: ['beverage-products', 'imports'],
    queryFn: () => beverageApi.products({ limit: 100 }),
    retry: 0,
  });
  const {
    data: imports,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['beverage-imports', branchId],
    queryFn: () => beverageApi.imports({ branchId: branchId || undefined }),
    retry: 0,
  });
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['beverage-import-detail', detailId],
    queryFn: () => beverageApi.importDetail(detailId),
    enabled: Boolean(detailId),
    retry: 0,
  });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['beverage-imports'] });
    queryClient.invalidateQueries({ queryKey: ['beverage-stock'] });
    queryClient.invalidateQueries({ queryKey: ['beverage-products'] });
    queryClient.invalidateQueries({ queryKey: ['beverage-dashboard'] });
  };
  const createMutation = useMutation({
    mutationFn: beverageApi.createImport,
    onSuccess: (data) => {
      toast.success('Đã tạo phiếu nhập', `${data.code} đang ở trạng thái nháp.`);
      invalidate();
      closeCreate();
    },
    onError: (error) => toast.error('Tạo phiếu nhập thất bại', message(error)),
  });
  const receiveMutation = useMutation({
    mutationFn: beverageApi.receiveImport,
    onSuccess: (data) => {
      toast.success('Đã xác nhận nhập kho', `${data.code} đã cập nhật tồn kho.`);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['beverage-import-detail', data.id] });
    },
    onError: (error) => toast.error('Không thể xác nhận phiếu nhập', message(error)),
  });

  function closeCreate() {
    setCreateOpen(false);
    setSupplierName('');
    setSupplierPhone('');
    setImportDate(localDate());
    setNotes('');
    setLines([{ ...EMPTY_LINE }]);
  }
  function setLine(index: number, patch: Partial<ImportLine>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }
  function selectedProduct(id: string): BeverageProduct | undefined {
    return products?.data.find((item) => item.id === id);
  }
  const total = lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitCost || 0),
    0,
  );
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!branchId) {
      toast.error('Thiếu chi nhánh', 'Hãy chọn chi nhánh nhận hàng.');
      return;
    }
    if (
      lines.some(
        (line) => !line.productId || Number(line.quantity) <= 0 || Number(line.unitCost) < 0,
      )
    ) {
      toast.error(
        'Thông tin sản phẩm chưa hợp lệ',
        'Chọn sản phẩm và nhập số lượng, đơn giá đúng.',
      );
      return;
    }
    createMutation.mutate({
      branchId,
      supplierName: supplierName.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      importDate,
      notes: notes.trim() || undefined,
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost),
        batchNumber: line.batchNumber.trim() || undefined,
        expiryDate: line.expiryDate || undefined,
      })),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Quản lý kho</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk">
            Phiếu nhập nước uống
          </h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Tạo phiếu nhập
        </Button>
      </div>
      <div className="max-w-sm">
        <Select
          label="Chi nhánh"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          options={[
            { value: '', label: 'Tất cả chi nhánh' },
            ...(options?.branches ?? []).map((branch) => ({
              value: branch.id,
              label: branch.name,
            })),
          ]}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nhập kho</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState title="Không tải được phiếu nhập" onRetry={refetch} />
            </div>
          ) : !imports?.length ? (
            <EmptyState
              icon={ClipboardList}
              title="Chưa có phiếu nhập"
              description="Tạo phiếu để ghi nhận hàng nhập vào kho."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-y border-line text-xs uppercase text-muted">
                  <tr>
                    {[
                      'Mã phiếu',
                      'Chi nhánh / nhà cung cấp',
                      'Ngày nhập',
                      'Sản phẩm / số lượng',
                      'Tổng tiền',
                      'Trạng thái',
                      '',
                    ].map((h) => (
                      <th key={h} className="px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {imports.map((item) => (
                    <tr key={item.importId} className="hover:bg-ink/50">
                      <td className="px-4 py-3 font-semibold text-chalk">
                        {item.importCode}
                        <p className="text-xs font-normal text-muted">
                          {item.createdByName || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-chalk">
                        {item.branchName}
                        <p className="text-xs text-muted">
                          {item.supplierName || 'Chưa có nhà cung cấp'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(item.importDate)}</td>
                      <td className="px-4 py-3 text-chalk">
                        {item.productLineCount} dòng
                        <p className="text-xs text-muted">{item.totalImportedQuantity} sản phẩm</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-chalk">
                        {formatCurrency(item.calculatedImportCost || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.status === 'RECEIVED'
                              ? 'success'
                              : item.status === 'CANCELLED'
                                ? 'destructive'
                                : 'warning'
                          }
                        >
                          {item.status === 'RECEIVED'
                            ? 'Đã nhập'
                            : item.status === 'CANCELLED'
                              ? 'Đã hủy'
                              : 'Nháp'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Chi tiết phiếu nhập"
                            onClick={() => setDetailId(item.importId)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {item.status === 'DRAFT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={receiveMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Xác nhận nhận hàng ${item.importCode}? Tồn kho sẽ được cập nhật một lần.`,
                                  )
                                )
                                  receiveMutation.mutate(item.importId);
                              }}
                            >
                              <PackageCheck className="size-4" />
                              Nhận hàng
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onClose={closeCreate}
        title="Tạo phiếu nhập hàng"
        className="max-w-4xl"
      >
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Chi nhánh nhận hàng"
              required
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              options={[
                { value: '', label: 'Chọn chi nhánh' },
                ...(options?.branches ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ]}
            />
            <Input
              label="Ngày nhập"
              type="date"
              required
              value={importDate}
              onChange={(e) => setImportDate(e.target.value)}
            />
            <Input
              label="Nhà cung cấp"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
            <Input
              label="Số điện thoại nhà cung cấp"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2 lg:grid-cols-[2fr_0.8fr_1fr_1fr_1fr_auto]"
              >
                <Select
                  aria-label="Sản phẩm nhập"
                  value={line.productId}
                  onChange={(e) => {
                    const product = selectedProduct(e.target.value);
                    setLine(index, {
                      productId: e.target.value,
                      unitCost: product ? String(product.costPrice) : '',
                    });
                  }}
                  options={[
                    { value: '', label: 'Chọn sản phẩm' },
                    ...(products?.data ?? [])
                      .filter((p) => p.status === 'ACTIVE')
                      .map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
                  ]}
                />
                <Input
                  aria-label="Số lượng nhập"
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder="Số lượng"
                  value={line.quantity}
                  onChange={(e) => setLine(index, { quantity: e.target.value })}
                />
                <Input
                  aria-label="Đơn giá nhập"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Đơn giá"
                  value={line.unitCost}
                  onChange={(e) => setLine(index, { unitCost: e.target.value })}
                />
                <Input
                  aria-label="Số lô"
                  placeholder="Số lô"
                  value={line.batchNumber}
                  onChange={(e) => setLine(index, { batchNumber: e.target.value })}
                />
                <Input
                  aria-label="Hạn sử dụng"
                  type="date"
                  value={line.expiryDate}
                  onChange={(e) => setLine(index, { expiryDate: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Xóa dòng"
                  disabled={lines.length === 1}
                  onClick={() => setLines((items) => items.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLines((items) => [...items, { ...EMPTY_LINE }])}
            >
              <Plus className="size-4" />
              Thêm sản phẩm
            </Button>
          </div>
          <Input label="Ghi chú" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">
              Tổng tiền dự kiến <b className="ml-2 text-lg text-neon">{formatCurrency(total)}</b>
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeCreate}>
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo phiếu nháp'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(detailId)}
        onClose={() => setDetailId('')}
        title={detail?.code || 'Chi tiết phiếu nhập'}
        className="max-w-3xl"
      >
        {detailLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : detail ? (
          <ImportDetails data={detail} />
        ) : (
          <p className="text-sm text-muted">Không tải được chi tiết phiếu.</p>
        )}
      </Dialog>
    </div>
  );
}

function ImportDetails({ data }: { data: BeverageImport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p className="text-muted">
          Chi nhánh: <b className="text-chalk">{data.branchName}</b>
        </p>
        <p className="text-muted">
          Trạng thái: <b className="text-chalk">{data.status}</b>
        </p>
        <p className="text-muted">
          Nhà cung cấp: <b className="text-chalk">{data.supplierName || '—'}</b>
        </p>
        <p className="text-muted">
          Ngày nhập: <b className="text-chalk">{formatDateTime(data.importDate)}</b>
        </p>
        <p className="text-muted">
          Người tạo: <b className="text-chalk">{data.createdByName || '—'}</b>
        </p>
        <p className="text-muted">
          Người nhận: <b className="text-chalk">{data.receivedByName || 'Chưa xác nhận'}</b>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-y border-line text-left text-xs text-muted">
            <tr>
              <th className="py-2">Sản phẩm / lô</th>
              <th className="py-2">SL</th>
              <th className="py-2">Đơn giá</th>
              <th className="py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.items.map((item) => (
              <tr key={item.productId}>
                <td className="py-2 text-chalk">
                  {item.productName}
                  <p className="text-xs text-muted">
                    {item.batchNumber || 'Không có số lô'}
                    {item.expiryDate ? ` · HSD ${item.expiryDate.slice(0, 10)}` : ''}
                  </p>
                </td>
                <td className="py-2 text-chalk">{item.quantity}</td>
                <td className="py-2 text-chalk">{formatCurrency(item.unitCost)}</td>
                <td className="py-2 text-right text-chalk">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-right font-semibold text-neon">
        Tổng tiền: {formatCurrency(data.subtotal)}
      </div>
    </div>
  );
}
