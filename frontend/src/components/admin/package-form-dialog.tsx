'use client';

import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  GYM_TIERS,
  PACKAGE_TYPE_OPTIONS,
  normalizeTiers,
  type CreatablePackageType,
} from '@/lib/package-options';
import { cn } from '@/lib/utils';
import { getStoredUser, isPartnerRole } from '@/lib/auth';
import { Check, Info, Plus, X } from 'lucide-react';
import type { GymTier, MembershipPackage, MembershipPackageInput } from '@/services/types';

type EditableType = CreatablePackageType;

interface PackageFormState {
  name: string;
  type: EditableType;
  durationDays: string;
  visitLimit: string;
  unlimitedVisits: boolean;
  gymTierAccess: GymTier[];
  price: string;
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
}

const DEFAULT_FEATURES = [
  'Tập luyện tại tất cả phòng gym thuộc hạng đã chọn',
  'Check-in QR không giới hạn khung giờ',
  'Tối đa 1 lượt check-in/ngày',
];

function initialState(pkg?: MembershipPackage | null): PackageFormState {
  const isCredit = pkg?.type === 'CREDIT_BASED';
  return {
    name: pkg?.name ?? '',
    type: isCredit ? 'CREDIT_BASED' : 'FIXED_TERM',
    durationDays: String(pkg?.durationDays ?? 30),
    visitLimit: pkg?.visitLimit != null ? String(pkg.visitLimit) : '',
    unlimitedVisits: !isCredit && (pkg?.visitLimit == null || pkg.visitLimit <= 0),
    gymTierAccess: normalizeTiers(pkg?.gymTierAccess),
    price: pkg?.price != null ? String(pkg.price) : '',
    status: pkg?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    description: pkg?.description ?? '',
  };
}

type FormErrors = Partial<Record<keyof PackageFormState | 'features', string>>;

function validate(form: PackageFormState, features: string[], isPartner = false): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Tên gói tập không được để trống';

  const durationDays = Number(form.durationDays);
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    errors.durationDays = 'Thời hạn phải là số ngày lớn hơn 0';
  }

  const price = Number(form.price);
  if (form.price === '' || Number.isNaN(price) || price < 0) {
    errors.price = 'Giá bán không hợp lệ';
  }

  // Gói riêng của phòng gym đối tác không áp dụng hạng phòng
  if (!isPartner && form.gymTierAccess.length === 0) {
    errors.gymTierAccess = 'Phải chọn ít nhất một hạng phòng gym';
  }

  if (form.type === 'CREDIT_BASED') {
    const visits = Number(form.visitLimit);
    if (form.visitLimit === '' || !Number.isInteger(visits) || visits < 1) {
      errors.visitLimit = 'Gói theo số lượt bắt buộc phải có tổng số lượt';
    }
  } else if (!form.unlimitedVisits) {
    const visits = Number(form.visitLimit);
    if (form.visitLimit === '' || !Number.isInteger(visits) || visits < 1) {
      errors.visitLimit = 'Nhập số lượt tối đa mỗi tháng hoặc chọn Không giới hạn lượt';
    }
  }

  if (features.some((item) => !item.trim())) {
    errors.features = 'Không được để trống dòng tính năng';
  }

  return errors;
}

interface PackageFormDialogProps {
  open: boolean;
  pkg?: MembershipPackage | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PackageFormDialog({ open, pkg, onClose, onSaved }: PackageFormDialogProps) {
  const toast = useToast();
  const isEdit = Boolean(pkg?.id);

  const [form, setForm] = useState<PackageFormState>(() => initialState(pkg));
  const [features, setFeatures] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  useEffect(() => setIsPartner(isPartnerRole(getStoredUser()?.role)), []);

  // Đồng bộ form mỗi khi mở hộp thoại (tạo mới hoặc sửa gói khác)
  useEffect(() => {
    if (!open) return;
    setForm(initialState(pkg));
    setFeatures(pkg?.features?.items?.length ? [...pkg.features.items] : [...DEFAULT_FEATURES]);
    setShowErrors(false);
  }, [open, pkg]);

  const errors = validate(form, features, isPartner);
  const canSubmit = Object.keys(errors).length === 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const visitLimit =
        form.type === 'CREDIT_BASED' || !form.unlimitedVisits ? Number(form.visitLimit) : null;

      const body: MembershipPackageInput = {
        name: form.name.trim(),
        type: form.type,
        durationDays: Number(form.durationDays),
        visitLimit,
        dailyVisitLimit: 1,
        gymTierAccess: isPartner ? undefined : form.gymTierAccess,
        price: Number(form.price),
        status: form.status,
        description: form.description.trim() || undefined,
        features: {
          title: form.name.trim(),
          items: features.map((item) => item.trim()).filter(Boolean),
        },
      };

      if (isEdit) {
        const res = await apiClient.patch(`/membership-packages/${pkg!.id}`, body);
        return res.data;
      }
      const res = await apiClient.post('/membership-packages', body);
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        isEdit ? 'Cập nhật thành công' : 'Tạo gói thành công',
        `Gói tập ${form.name.trim()} đã được lưu.`,
      );
      onSaved();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Thao tác thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const toggleTier = (tier: GymTier) => {
    setForm((prev) => ({
      ...prev,
      gymTierAccess: prev.gymTierAccess.includes(tier)
        ? prev.gymTierAccess.filter((item) => item !== tier)
        : normalizeTiers([...prev.gymTierAccess, tier]),
    }));
  };

  const isCredit = form.type === 'CREDIT_BASED';
  const visitLimitDisabled = !isCredit && form.unlimitedVisits;

  const submit = () => {
    if (!canSubmit) {
      setShowErrors(true);
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa gói tập' : 'Tạo gói tập mới'}
      description="Mã gói được hệ thống tự sinh. Gói tập mở khóa phòng gym theo hạng đã chọn."
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Tên gói */}
        <Input
          label="Tên gói tập *"
          value={form.name}
          placeholder="VD: Gói Standard 1 Tháng, Gói Pass 15 Lượt, Gói VIP Toàn Hệ Thống"
          error={showErrors ? errors.name : undefined}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Loại hình gói */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Loại hình gói *
          </p>
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Loại hình gói"
          >
            {PACKAGE_TYPE_OPTIONS.map((option) => {
              const active = form.type === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'cursor-pointer rounded-xl border p-3.5 transition-colors',
                    active ? 'border-neon/70 bg-neon/5' : 'border-line bg-ink hover:border-neon/30',
                  )}
                >
                  <input
                    type="radio"
                    name="packageType"
                    value={option.value}
                    checked={active}
                    onChange={() =>
                      setForm({
                        ...form,
                        type: option.value,
                        // Gói lượt luôn bắt buộc nhập tổng số lượt
                        unlimitedVisits:
                          option.value === 'CREDIT_BASED' ? false : form.unlimitedVisits,
                      })
                    }
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex size-3.5 shrink-0 items-center justify-center rounded-full border',
                        active ? 'border-neon' : 'border-muted',
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-neon" />}
                    </span>
                    <span
                      className={cn('text-sm font-semibold', active ? 'text-chalk' : 'text-muted')}
                    >
                      {option.label}
                    </span>
                  </span>
                  <span className="mt-1.5 block pl-6 text-xs leading-relaxed text-muted">
                    {option.hint}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Thời hạn + Giới hạn lượt */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Thời hạn sử dụng (Ngày) *"
            type="number"
            min={1}
            value={form.durationDays}
            placeholder="30, 90, 180, 365"
            error={showErrors ? errors.durationDays : undefined}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
          />

          <div className="space-y-1.5 min-w-0">
            <Input
              label={isCredit ? 'Tổng số lượt tập *' : 'Giới hạn số lượt tập (mỗi tháng)'}
              type="number"
              min={1}
              value={form.visitLimit}
              placeholder={isCredit ? '10, 15, 30 lượt' : 'VD: 16 lượt/tháng'}
              disabled={visitLimitDisabled}
              error={showErrors ? errors.visitLimit : undefined}
              onChange={(e) => setForm({ ...form, visitLimit: e.target.value })}
            />
            {!isCredit && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={form.unlimitedVisits}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unlimitedVisits: e.target.checked,
                      visitLimit: e.target.checked ? '' : form.visitLimit,
                    })
                  }
                  className="size-4 accent-neon"
                />
                Không giới hạn lượt
              </label>
            )}
          </div>
        </div>

        {/* Chống gian lận */}
        <p className="flex items-start gap-2 rounded-sm border border-line bg-ink px-3.5 py-2.5 text-xs leading-relaxed text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-neon" />
          Hệ thống luôn giới hạn tối đa <strong className="text-chalk">
            1 lượt check-in/ngày
          </strong>{' '}
          để chống gian lận, áp dụng cho mọi loại hình gói.
        </p>

        {/* Hạng phòng gym — chỉ gói của hệ thống; gói riêng của đối tác dùng tại chính phòng đó */}
        {isPartner ? (
          <p className="rounded-xl border border-line bg-ink p-3 text-xs text-muted">
            Gói riêng của phòng bạn: chỉ hội viên của phòng mua được và chỉ check-in tại phòng bạn.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Hạng phòng gym đối tác được phép tập *
            </p>
            <div className="space-y-2">
              {GYM_TIERS.map((tier) => {
                const checked = form.gymTierAccess.includes(tier.value);
                return (
                  <label
                    key={tier.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors',
                      checked
                        ? 'border-neon/70 bg-neon/5'
                        : 'border-line bg-ink hover:border-neon/30',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTier(tier.value)}
                      className="size-4 shrink-0 accent-neon"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-chalk">{tier.label}</span>
                      <span className="block text-xs text-muted">{tier.hint}</span>
                    </span>
                    {checked && <Check className="size-4 shrink-0 text-neon" />}
                  </label>
                );
              })}
            </div>
            {showErrors && errors.gymTierAccess && (
              <p className="mt-1.5 text-xs font-medium text-danger">{errors.gymTierAccess}</p>
            )}
            <p className="mt-2 text-xs text-muted">
              Gói giá càng cao thì mở khóa được các phòng hạng cao hơn.
            </p>
          </div>
        )}

        {/* Giá + Trạng thái */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Giá bán (VND) *"
            type="number"
            min={0}
            value={form.price}
            placeholder="450000"
            error={showErrors ? errors.price : undefined}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Select
            label="Trạng thái *"
            value={form.status}
            options={[
              { value: 'ACTIVE', label: 'Đang bán' },
              { value: 'INACTIVE', label: 'Ngừng bán' },
            ]}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as PackageFormState['status'] })
            }
          />
        </div>

        {/* Mô tả */}
        <Textarea
          label="Mô tả ngắn"
          rows={2}
          value={form.description}
          placeholder="Tập luyện linh hoạt tại mạng lưới phòng gym đối tác trên toàn hệ thống"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Tính năng nổi bật */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Danh sách tính năng nổi bật của gói
          </p>
          <div className="space-y-2">
            {features.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={item}
                  placeholder="VD: Tập luyện tại tất cả phòng gym thuộc hạng Standard & Plus"
                  onChange={(e) => {
                    const next = [...features];
                    next[idx] = e.target.value;
                    setFeatures(next);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Xóa tính năng này"
                  onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setFeatures([...features, ''])}>
              <Plus className="size-3.5 mr-1" /> Thêm tính năng
            </Button>
            {showErrors && errors.features && (
              <p className="text-xs font-medium text-danger">{errors.features}</p>
            )}
          </div>
        </div>

        {/* Hành động */}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            isLoading={saveMutation.isPending}
            disabled={!canSubmit}
            onClick={submit}
            title={!canSubmit ? 'Kiểm tra lại các trường bắt buộc' : undefined}
          >
            <Check className="size-4" />
            {isEdit ? 'Lưu thay đổi' : 'Tạo gói tập'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
