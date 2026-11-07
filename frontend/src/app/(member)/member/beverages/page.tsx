'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { beverageApi, type BeverageSale } from '@/services/beverage.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CupSoda, Receipt } from 'lucide-react';

export default function MemberBeverageHistoryPage() {
  const [saleId, setSaleId] = useState('');
  const {
    data: sales,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['member-beverage-sales'],
    queryFn: () => beverageApi.mySales(),
    retry: 0,
  });
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['member-beverage-sale', saleId],
    queryFn: () => beverageApi.mySaleDetail(saleId),
    enabled: Boolean(saleId),
    retry: 0,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="meta-label">Giao dịch cá nhân</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase text-chalk">
          Lịch sử mua nước
        </h1>
        <p className="mt-1 text-sm text-muted">
          Chỉ hiển thị hóa đơn nước uống thuộc tài khoản hội viên của bạn.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Hóa đơn đã thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState title="Không tải được lịch sử mua nước" onRetry={refetch} />
            </div>
          ) : !sales?.length ? (
            <EmptyState
              icon={CupSoda}
              title="Chưa có hóa đơn nước uống"
              description="Các giao dịch tại quầy đã thanh toán sẽ xuất hiện tại đây."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-y border-line text-xs uppercase text-muted">
                  <tr>
                    {['Mã hóa đơn', 'Chi nhánh', 'Ngày mua', 'Số lượng', 'Tổng tiền', ''].map(
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
                      <td className="px-4 py-3 text-muted">{sale.branchName}</td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(sale.saleDate)}</td>
                      <td className="px-4 py-3 text-chalk">{sale.totalSoldQuantity}</td>
                      <td className="px-4 py-3 font-semibold text-neon">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setSaleId(sale.saleId!)}>
                          <Receipt className="size-4" />
                          Chi tiết
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
      <Dialog open={Boolean(saleId)} onClose={() => setSaleId('')} title="Chi tiết hóa đơn">
        {detailLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : detail ? (
          <SaleReceipt sale={detail} />
        ) : (
          <p className="text-sm text-muted">Không tải được hóa đơn.</p>
        )}
      </Dialog>
    </div>
  );
}

function SaleReceipt({ sale }: { sale: BeverageSale }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-xl font-bold text-chalk">{sale.code || sale.saleCode}</p>
          <p className="text-xs text-muted">
            {formatDateTime(sale.saleDate)} · {sale.branchName}
          </p>
        </div>
        <span className="text-xs font-semibold text-neon">
          {sale.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
        </span>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {sale.items.map((item) => (
          <div key={item.productId} className="flex justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-semibold text-chalk">{item.productName}</p>
              <p className="text-xs text-muted">
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </p>
            </div>
            <span className="shrink-0 text-chalk">{formatCurrency(item.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-right text-sm">
        <p className="text-muted">Tạm tính: {formatCurrency(sale.subtotal)}</p>
        <p className="text-muted">Giảm giá: {formatCurrency(sale.discountAmount)}</p>
        <p className="font-bold text-neon">Tổng thanh toán: {formatCurrency(sale.totalAmount)}</p>
      </div>
    </div>
  );
}
