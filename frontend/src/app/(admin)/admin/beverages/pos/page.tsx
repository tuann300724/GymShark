'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { beverageApi, type BeverageProduct, type BeverageSale } from '@/services/beverage.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Minus, Plus, Printer, Search, ShoppingCart, UserRound, X } from 'lucide-react';

interface Member {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email: string | null;
}

interface CartLine {
  product: BeverageProduct;
  quantity: number;
}

function message(error: unknown) {
  const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message || 'Không thể hoàn tất yêu cầu.';
}

export default function BeveragePosPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [branchId, setBranchId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [receipt, setReceipt] = useState<BeverageSale | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const requestIdRef = useRef<{ fingerprint: string; id: string } | null>(null);

  const { data: options } = useQuery({
    queryKey: ['beverage-options'],
    queryFn: beverageApi.options,
    retry: 0,
  });
  useEffect(() => {
    if (!branchId && options?.branches.length) {
      setBranchId(options.activeShift?.branchId || options.branches[0].id);
    }
  }, [branchId, options]);
  const { data: members, isFetching: membersLoading } = useQuery({
    queryKey: ['beverage-member-search', memberSearch],
    queryFn: () => beverageApi.searchMembers(memberSearch),
    enabled: memberSearch.trim().length >= 2,
    retry: 0,
  });
  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    refetch,
  } = useQuery({
    queryKey: ['beverage-pos-products', branchId, productSearch],
    queryFn: () =>
      beverageApi.products({ branchId, search: productSearch || undefined, limit: 100 }),
    enabled: Boolean(branchId),
    retry: 0,
  });
  const { data: sales } = useQuery({
    queryKey: ['beverage-sales'],
    queryFn: () => beverageApi.sales({ limit: 20 }),
    retry: 0,
  });
  const saleMutation = useMutation({
    mutationFn: beverageApi.createSale,
    onSuccess: (sale) => {
      toast.success('Thanh toán thành công', `${sale.code} · ${formatCurrency(sale.totalAmount)}`);
      setReceipt(sale);
      setCart([]);
      setMember(null);
      setMemberSearch('');
      setDiscount('0');
      requestIdRef.current = null;
      queryClient.invalidateQueries({ queryKey: ['beverage-sales'] });
      queryClient.invalidateQueries({ queryKey: ['beverage-pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['beverage-stock'] });
      queryClient.invalidateQueries({ queryKey: ['beverage-dashboard'] });
    },
    onError: (error) => toast.error('Thanh toán thất bại', message(error)),
  });

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * line.product.sellingPrice, 0),
    [cart],
  );
  const discountAmount = Number(discount || 0);
  const total = Math.max(0, subtotal - discountAmount);
  const addProduct = (product: BeverageProduct) => {
    const stock = product.stockQuantity ?? 0;
    if (stock <= 0) {
      toast.error('Sản phẩm hết hàng', 'Không thể thêm sản phẩm đã hết tồn kho.');
      return;
    }
    setCart((current) => {
      const line = current.find((item) => item.product.id === product.id);
      if (line && line.quantity >= stock) {
        toast.error('Không đủ tồn kho', `Chỉ còn ${stock} ${product.unit}.`);
        return current;
      }
      return line
        ? current.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...current, { product, quantity: 1 }];
    });
  };
  const changeQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.product.id !== productId) return [line];
        const quantity = line.quantity + delta;
        if (quantity <= 0) return [];
        if (quantity > (line.product.stockQuantity ?? 0)) {
          toast.error(
            'Không đủ tồn kho',
            `Chỉ còn ${line.product.stockQuantity ?? 0} ${line.product.unit}.`,
          );
          return [line];
        }
        return [{ ...line, quantity }];
      }),
    );
  };
  const checkout = () => {
    if (!member)
      return toast.error('Chưa chọn hội viên', 'Tìm và chọn hội viên trước khi thanh toán.');
    if (!branchId || !cart.length)
      return toast.error('Hóa đơn chưa đủ thông tin', 'Chọn chi nhánh và ít nhất một sản phẩm.');
    if (discountAmount < 0 || discountAmount > subtotal)
      return toast.error('Giảm giá không hợp lệ', 'Giảm giá không được lớn hơn tổng tiền hàng.');
    const fingerprint = JSON.stringify({
      memberId: member.id,
      branchId,
      paymentMethod,
      discountAmount,
      items: cart.map((line) => [line.product.id, line.quantity]),
    });
    if (requestIdRef.current?.fingerprint !== fingerprint) {
      requestIdRef.current = { fingerprint, id: crypto.randomUUID() };
    }
    saleMutation.mutate({
      requestId: requestIdRef.current.id,
      memberId: member.id,
      branchId,
      paymentMethod,
      discountAmount,
      items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Quầy lễ tân</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk">Bán nước</h1>
        </div>
        <Button variant="outline" onClick={() => setHistoryOpen((open) => !open)}>
          <ShoppingCart className="size-4" />
          {historyOpen ? 'Ẩn lịch sử' : 'Lịch sử bán'}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hội viên và chi nhánh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Chi nhánh bán"
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setCart([]);
                }}
                options={[
                  { value: '', label: 'Chọn chi nhánh' },
                  ...(options?.branches ?? []).map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  })),
                ]}
              />
              <div className="relative">
                <Input
                  label="Tìm hội viên"
                  placeholder="Tên, mã hội viên hoặc điện thoại"
                  value={member ? `${member.fullName} · ${member.code}` : memberSearch}
                  onChange={(e) => {
                    setMember(null);
                    setMemberSearch(e.target.value);
                  }}
                />
                {memberSearch.trim().length >= 2 && !member && (
                  <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface shadow-xl">
                    {membersLoading ? (
                      <p className="p-3 text-xs text-muted">Đang tìm hội viên...</p>
                    ) : members?.length ? (
                      members.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="block w-full border-b border-line px-3 py-2 text-left hover:bg-ink"
                          onClick={() => {
                            setMember(item);
                            setMemberSearch('');
                          }}
                        >
                          <span className="block text-sm font-semibold text-chalk">
                            {item.fullName}
                          </span>
                          <span className="text-xs text-muted">
                            {item.code} · {item.phone}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-xs text-muted">
                        Không tìm thấy hội viên đang hoạt động.
                      </p>
                    )}
                  </div>
                )}
              </div>
              {member && (
                <div className="flex items-center justify-between rounded-xl border border-neon/25 bg-neon/5 p-3 sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <UserRound className="size-5 text-neon" />
                    <div>
                      <p className="font-semibold text-chalk">{member.fullName}</p>
                      <p className="text-xs text-muted">
                        {member.code} · {member.phone}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Bỏ chọn hội viên"
                    onClick={() => setMember(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              {options?.activeShift && (
                <p className="text-xs text-muted sm:col-span-2">
                  Ca làm hiện tại đã được ghi tự động vào hóa đơn.
                </p>
              )}
              {options && !options.activeShift && (
                <p className="text-xs text-muted sm:col-span-2">
                  Nhân viên lễ tân cần bắt đầu ca làm trước khi thanh toán.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Chọn sản phẩm</CardTitle>
              <div className="w-full max-w-xs">
                <Input
                  aria-label="Tìm sản phẩm nước"
                  placeholder="Tên hoặc mã sản phẩm..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : productsError ? (
                <ErrorState title="Không tải được sản phẩm" onRetry={refetch} />
              ) : !products?.data.length ? (
                <EmptyState
                  icon={Search}
                  title="Không có sản phẩm phù hợp"
                  description="Thử từ khóa khác hoặc chọn chi nhánh."
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {products.data
                    .filter((product) => product.status === 'ACTIVE')
                    .map((product) => {
                      const stock = product.stockQuantity ?? 0;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={stock <= 0}
                          onClick={() => addProduct(product)}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:border-neon/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-chalk">
                              {product.name}
                            </span>
                            <span className="block text-xs text-muted">
                              {product.code} · Còn {stock} {product.unit}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-bold text-neon">
                              {formatCurrency(product.sellingPrice)}
                            </span>
                            <Plus className="ml-auto mt-1 size-4 text-muted" />
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Hóa đơn tạm tính ({cart.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!cart.length ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                Chọn sản phẩm để tạo hóa đơn.
              </p>
            ) : (
              <div className="max-h-[360px] space-y-3 overflow-y-auto">
                {cart.map((line) => (
                  <div
                    key={line.product.id}
                    className="flex items-center justify-between gap-2 border-b border-line pb-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-chalk">
                        {line.product.name}
                      </p>
                      <p className="text-xs text-muted">
                        {formatCurrency(line.product.sellingPrice)} / {line.product.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Giảm số lượng"
                        onClick={() => changeQuantity(line.product.id, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm text-chalk">{line.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Tăng số lượng"
                        onClick={() => changeQuantity(line.product.id, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <span className="w-24 shrink-0 text-right text-sm font-semibold text-chalk">
                      {formatCurrency(line.quantity * line.product.sellingPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 border-t border-line pt-4">
              <div className="flex justify-between text-sm text-muted">
                <span>Tạm tính</span>
                <span className="text-chalk">{formatCurrency(subtotal)}</span>
              </div>
              <Input
                label="Giảm giá (VNĐ)"
                type="number"
                min="0"
                max={subtotal}
                step="1"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              <Select
                label="Phương thức thanh toán"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                options={[
                  { value: 'CASH', label: 'Tiền mặt' },
                  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
                ]}
              />
              <div className="flex justify-between border-t border-line pt-3 font-display text-xl font-bold text-chalk">
                <span>Thành tiền</span>
                <span className="text-neon">{formatCurrency(total)}</span>
              </div>
              <Button
                className="w-full"
                disabled={saleMutation.isPending || !cart.length || !member || !branchId}
                onClick={checkout}
              >
                {saleMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
              </Button>
              <p className="text-center text-[11px] text-muted">
                Tồn kho được kiểm tra và trừ trong giao dịch SQL Server.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {historyOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử bán hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!sales?.length ? (
              <EmptyState
                icon={ShoppingCart}
                title="Chưa có giao dịch"
                description="Hóa đơn bán nước sẽ xuất hiện tại đây."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-y border-line text-xs uppercase text-muted">
                    <tr>
                      {['Mã hóa đơn', 'Hội viên', 'Nhân viên', 'Thời gian', 'Tổng tiền', ''].map(
                        (h) => (
                          <th key={h} className="px-4 py-3">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {sales.map((sale) => (
                      <tr key={sale.saleId}>
                        <td className="px-4 py-3 font-semibold text-chalk">{sale.saleCode}</td>
                        <td className="px-4 py-3 text-chalk">
                          {sale.memberName}
                          <p className="text-xs text-muted">{sale.memberCode}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{sale.staffName}</td>
                        <td className="px-4 py-3 text-muted">{formatDateTime(sale.saleDate)}</td>
                        <td className="px-4 py-3 font-semibold text-chalk">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const detail = await beverageApi.saleDetail(sale.saleId!);
                                setReceipt(detail);
                              } catch (error) {
                                toast.error('Không tải được hóa đơn', message(error));
                              }
                            }}
                          >
                            Hóa đơn
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="Hóa đơn bán nước"
        className="max-w-2xl"
      >
        {receipt && (
          <div className="space-y-4">
            <div id="beverage-print" className="space-y-4 rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="meta-label">GymMaster · Hóa đơn</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-chalk">
                    {receipt.code || receipt.saleCode}
                  </h2>
                </div>
                <Badge variant="success">Đã thanh toán</Badge>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-muted">
                  Hội viên: <b className="text-chalk">{receipt.memberName}</b>
                </p>
                <p className="text-muted">
                  Mã hội viên: <b className="text-chalk">{receipt.memberCode}</b>
                </p>
                <p className="text-muted">
                  Nhân viên: <b className="text-chalk">{receipt.staffName}</b>
                </p>
                <p className="text-muted">
                  Chi nhánh: <b className="text-chalk">{receipt.branchName}</b>
                </p>
                <p className="text-muted">
                  Ca làm: <b className="text-chalk">{receipt.shiftTitle || 'Không gán ca'}</b>
                </p>
                <p className="text-muted">
                  Thanh toán:{' '}
                  <b className="text-chalk">
                    {receipt.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                  </b>
                </p>
                <p className="text-muted sm:col-span-2">
                  Thời gian: <b className="text-chalk">{formatDateTime(receipt.saleDate)}</b>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="border-y border-line text-left text-xs text-muted">
                    <tr>
                      <th className="py-2">Sản phẩm</th>
                      <th className="py-2">SL</th>
                      <th className="py-2">Đơn giá</th>
                      <th className="py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {receipt.items.map((item) => (
                      <tr key={item.productId}>
                        <td className="py-2 text-chalk">{item.productName}</td>
                        <td className="py-2 text-chalk">{item.quantity}</td>
                        <td className="py-2 text-chalk">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-right text-chalk">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-1 border-t border-line pt-3 text-right text-sm">
                <p className="text-muted">Tạm tính: {formatCurrency(receipt.subtotal)}</p>
                <p className="text-muted">Giảm giá: {formatCurrency(receipt.discountAmount)}</p>
                <p className="font-bold text-neon">
                  Thành tiền: {formatCurrency(receipt.totalAmount)}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => window.print()}>
                <Printer className="size-4" />
                In hóa đơn
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #beverage-print,
          #beverage-print * {
            visibility: visible !important;
          }
          #beverage-print {
            position: absolute !important;
            inset: 0 auto auto 0;
            width: 100%;
            color: #111 !important;
            background: #fff !important;
            border: 0 !important;
          }
          #beverage-print * {
            color: #111 !important;
            border-color: #ddd !important;
          }
        }
      `}</style>
    </div>
  );
}
