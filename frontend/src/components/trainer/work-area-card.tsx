'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import BranchAddressPicker from '@/components/partners/branch-address-picker';
import { trainerWorkAreaApi } from '@/services/trainer.service';

/** PT khai khu vực / địa điểm dạy để hội viên biết PT có gần mình không */
export function WorkAreaCard() {
  const toast = useToast();
  const qc = useQueryClient();
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-work-area'],
    queryFn: trainerWorkAreaApi.get,
  });

  useEffect(() => {
    if (!data) return;
    setAddress(data.workAddress ?? '');
    setPin(
      data.workLatitude != null && data.workLongitude != null
        ? { lat: data.workLatitude, lng: data.workLongitude }
        : null,
    );
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      trainerWorkAreaApi.update({
        workAddress: address.trim(),
        workLatitude: pin?.lat ?? null,
        workLongitude: pin?.lng ?? null,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.setQueryData(['trainer-work-area'], res.area);
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message;
      toast.error('Không lưu được', Array.isArray(m) ? m.join(', ') : m);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 text-neon" />
          Khu vực dạy
        </CardTitle>
        <p className="text-[11px] text-muted">
          Phòng gym hoặc khu vực bạn thường dạy. Hội viên thấy địa chỉ này và khoảng cách từ vị trí
          của họ; điểm ghim chỉ hiển thị gần đúng (~1 km), không lộ vị trí chính xác.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          // Picker chỉ đọc giá trị ban đầu khi mount → mount sau khi đã có dữ liệu
          <BranchAddressPicker
            key={data ? 'loaded' : 'empty'}
            initialAddress={data?.workAddress ?? ''}
            initialLatitude={data?.workLatitude ?? undefined}
            initialLongitude={data?.workLongitude ?? undefined}
            onAddressChange={setAddress}
            onCoordinatesChange={setPin}
          />
        )}
        <Button size="sm" isLoading={save.isPending} onClick={() => save.mutate()}>
          Lưu khu vực dạy
        </Button>
      </CardContent>
    </Card>
  );
}
