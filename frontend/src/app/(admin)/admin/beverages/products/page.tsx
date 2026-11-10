'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { beverageApi, type BeverageProduct } from '@/services/beverage.service';
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
import { formatCurrency } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import { Eye, Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

interface ProductForm {
  code: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  volumeMl: string;
  costPrice: string;
  sellingPrice: string;
  minStock: string;
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
  initialStock: string;
  initialStockReason: string;
}

const EMPTY_FORM: ProductForm = {
  code: '',
  name: '',
  category: '',
  brand: '',
  unit: 'CHAI',
  volumeMl: '',
  costPrice: '0',
  sellingPrice: '0',
  minStock: '0',
  status: 'ACTIVE',
  description: '',
  initialStock: '0',
  initialStockReason: '',
};

function message(error: unknown) {
  const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  const value = data?.message;
  return Array.isArray(value) ? value.join(', ') : value || 'Không thể hoàn tất yêu cầu.';
}

function formFrom(product: BeverageProduct): ProductForm {
  return {
    code: product.code,
    name: product.name,
    category: product.category || '',
    brand: product.brand || '',
    unit: product.unit,
    volumeMl: product.volumeMl ? String(product.volumeMl) : '',
    costPrice: String(product.costPrice),
    sellingPrice: String(product.sellingPrice),
    minStock: String(product.minStock),
    status: product.status,
    description: product.description || '',
    initialStock: '0',
    initialStockReason: '',
  };
}

export default function BeverageProductsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BeverageProduct | null>(null);
  const [detailId, setDetailId] = useState('');
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    setCanManage(['ADMIN', 'MANAGER'].includes(getStoredUser()?.role || ''));
  }, []);

  const { data: options } = useQuery({
    queryKey: ['beverage-options'],
    queryFn: beverageApi.options,
    retry: 0,
  });
  const query = {
    search: search || undefined,
    category: category || undefined,
    includeInactive,
    page,
    limit: 30,
  };
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['beverage-products', query],
    queryFn: () => beverageApi.products(query),
    retry: 0,
  });
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['beverage-product', detailId],
    queryFn: () => beverageApi.product(detailId),
    enabled: Boolean(detailId),
    retry: 0,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['beverage-products'] });
    queryClient.invalidateQueries({ queryKey: ['beverage-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['beverage-stock'] });
  };
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => beverageApi.createProduct(payload),
    onSuccess: () => {
      toast.success('Đã thêm sản phẩm');
      refresh();
      closeEditor();
    },
    onError: (error) => toast.error('Thêm sản phẩm thất bại', message(error)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      beverageApi.updateProduct(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật sản phẩm');
      refresh();
      closeEditor();
    },
    onError: (error) => toast.error('Cập nhật thất bại', message(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: beverageApi.deleteProduct,
    onSuccess: () => {
      toast.success('Đã ngừng kinh doanh sản phẩm');
      refresh();
    },
    onError: (error) => toast.error('Không thể ngừng kinh doanh', message(error)),
  });

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim() || null,
      brand: form.brand.trim() || null,
      unit: form.unit.trim(),
      volumeMl: form.volumeMl ? Number(form.volumeMl) : null,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      minStock: Number(form.minStock),
      status: form.status,
      description: form.description.trim() || null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else
      createMutation.mutate({
        ...payload,
        initialStock: Number(form.initialStock || 0),
        initialStockReason: form.initialStockReason.trim() || undefined,
      });
  }
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }
  function openEdit(product: BeverageProduct) {
    setEditing(product);
    setForm(formFrom(product));
    setEditorOpen(true);
  }

  const busy = createMutation.isPending || updateMutation.isPending;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 30));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Danh mục kinh doanh</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk">
            Sản phẩm nước uống
          </h1>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            aria-label="Tìm sản phẩm"
            placeholder="Tên, mã, thương hiệu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            aria-label="Lọc danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: '', label: 'Tất cả danh mục' },
              ...(options?.categories ?? []).map((value) => ({ value, label: value })),
            ]}
          />
          <label className="flex h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="accent-lime-500"
            />
            Hiển thị ngừng kinh doanh
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{data?.total ?? 0} sản phẩm</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Tải lại" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState title="Không tải được sản phẩm" onRetry={refetch} />
            </div>
          ) : !data?.data.length ? (
            <EmptyState
              icon={Package}
              title="Chưa có sản phẩm"
              description="Thêm sản phẩm nước uống để bắt đầu quản lý."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-y border-line text-xs uppercase text-muted">
                  <tr>
                    {[
                      'Sản phẩm',
                      'Danh mục / thương hiệu',
                      'Giá bán',
                      'Tồn kho',
                      'Trạng thái',
                      '',
                    ].map((title) => (
                      <th key={title} className="px-4 py-3 font-semibold">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.data.map((product) => (
                    <tr key={product.id} className="hover:bg-ink/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-chalk">{product.name}</p>
                        <p className="text-xs text-muted">
                          {product.code} · {product.volumeMl ? `${product.volumeMl} ml · ` : ''}
                          {product.unit}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {product.category || '—'}
                        {product.brand ? ` · ${product.brand}` : ''}
                      </td>
                      <td className="px-4 py-3 font-semibold text-chalk">
                        {formatCurrency(product.sellingPrice)}
                        <p className="text-xs font-normal text-muted">
                          Giá vốn {formatCurrency(product.costPrice)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            (product.stockQuantity ?? 0) <= product.minStock
                              ? 'font-semibold text-danger'
                              : 'text-chalk'
                          }
                        >
                          {product.stockQuantity ?? 0} {product.unit}
                        </span>
                        <p className="text-xs text-muted">Tối thiểu {product.minStock}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={product.status === 'ACTIVE' ? 'success' : 'outline'}>
                          {product.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Chi tiết"
                            onClick={() => setDetailId(product.id)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Sửa"
                              onClick={() => openEdit(product)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {canManage && product.status === 'ACTIVE' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Ngừng kinh doanh"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Ngừng kinh doanh "${product.name}"? Lịch sử kho sẽ được giữ lại.`,
                                  )
                                )
                                  deleteMutation.mutate(product.id);
                              }}
                            >
                              <Trash2 className="size-4 text-danger" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-line p-3 text-xs text-muted">
                <span>
                  Trang {page}/{totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editorOpen}
        onClose={closeEditor}
        title={editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        className="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Mã sản phẩm"
              required
              maxLength={50}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <Input
              label="Tên sản phẩm"
              required
              maxLength={255}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Danh mục"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              label="Thương hiệu"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
            <Input
              label="Dung tích (ml)"
              type="number"
              min="1"
              step="1"
              value={form.volumeMl}
              onChange={(e) => setForm({ ...form, volumeMl: e.target.value })}
            />
            <Input
              label="Đơn vị tính"
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
            <Input
              label="Giá nhập"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
            <Input
              label="Giá bán"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
            />
            <Input
              label="Mức tồn tối thiểu"
              type="number"
              min="0"
              step="0.001"
              required
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
            />
            <Select
              label="Trạng thái"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ProductForm['status'] })
              }
              options={[
                { value: 'ACTIVE', label: 'Đang kinh doanh' },
                { value: 'INACTIVE', label: 'Ngừng kinh doanh' },
              ]}
            />
            {!editing && (
              <>
                <Input
                  label="Tồn kho đầu kỳ (không bắt buộc)"
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.initialStock}
                  onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                />
                {Number(form.initialStock) > 0 && (
                  <div className="sm:col-span-2">
                    <Input
                      label="Lý do ghi nhận tồn đầu kỳ"
                      required
                      value={form.initialStockReason}
                      onChange={(e) => setForm({ ...form, initialStockReason: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <Input
            label="Mô tả"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeEditor}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={Boolean(detailId)} onClose={() => setDetailId('')} title="Chi tiết sản phẩm">
        {detailLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : detail ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-chalk">{detail.name}</p>
              <p className="text-muted">
                {detail.code} · {detail.category || 'Chưa phân loại'} ·{' '}
                {detail.brand || 'Không có thương hiệu'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-line p-3">
              <p className="text-muted">
                Giá nhập <b className="block text-chalk">{formatCurrency(detail.costPrice)}</b>
              </p>
              <p className="text-muted">
                Giá bán <b className="block text-chalk">{formatCurrency(detail.sellingPrice)}</b>
              </p>
              <p className="text-muted">
                Dung tích / đơn vị{' '}
                <b className="block text-chalk">
                  {detail.volumeMl || '—'} ml / {detail.unit}
                </b>
              </p>
              <p className="text-muted">
                Mức tồn tối thiểu <b className="block text-chalk">{detail.minStock}</b>
              </p>
            </div>
            <div>
              <p className="font-semibold text-chalk">Tồn kho hiện tại</p>
              <p className="mt-1 text-muted">
                {detail.stockQuantity ?? 0} · {detail.stockStatus}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Không tải được chi tiết sản phẩm.</p>
        )}
      </Dialog>
    </div>
  );
}
