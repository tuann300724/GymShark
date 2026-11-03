# Prompt — Thay đổi / Nâng cấp gói tập (A + C + UI tính tiền)

## Quy tắc
- Member phải có 1 `Membership` ACTIVE.
- Tính ngày còn lại: `remainingDays = max(0, durationDays - daysUsed)`.
- **Phương án A (Pro-rated)**: `proratedPrice = newPackage.price * remainingDays / newPackage.durationDays`. Nếu > 0 → tạo Payment/Invoice chênh lệch.
- **Phương án C (Reset)**: Cho đổi bất kỳ lúc nào. Gói mới `ACTIVE` từ `today`, giá đầy đủ `newPackage.price`. Gói cũ `CANCELLED`. Tránh phức tạp.
- **UI tính trước**: Trên `/member/membership` thêm nút "Thay đổi gói" → Dialog chọn `newPackageId` → Hiển thị: `Ngày còn lại: X` + `Cần đóng thêm: Y VND` (tính theo A hoặc giá đầy đủ theo C).

## Backend — members.service.ts
```typescript
async changePackage(memberId: string, dto: { newPackageId: string, method: 'PRO_RATED' | 'RESET' }) {
  const current = await this.prisma.membership.findFirst({
    where: { memberId, status: 'ACTIVE' }, include: { package: true },
  });
  if (!current) throw new NotFoundException('Không có gói đang tập');
  const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: dto.newPackageId } });
  if (!pkg) throw new NotFoundException('Gói không tồn tại');

  const start = new Date(current.startDate);
  const now = new Date();
  const daysUsed = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const remaining = Math.max(0, current.package.durationDays - daysUsed);

  let priceToPay = 0;
  if (dto.method === 'PRO_RATED' && pkg.durationDays > 0) {
    priceToPay = Math.round((pkg.price * remaining) / pkg.durationDays);
  } else if (dto.method === 'RESET') {
    priceToPay = pkg.price;
  }

  // Hủy gói cũ
  await this.prisma.membership.update({
    where: { id: current.id }, data: { status: 'CANCELLED', notes: 'Đổi gói: ' + pkg.name },
  });

  // Tạo gói mới
  const newMembership = await this.prisma.membership.create({
    data: {
      memberId, packageId: pkg.id, status: 'ACTIVE',
      startDate: now, notes: 'Đổi từ ' + current.package.name + ' → ' + pkg.name,
    },
  });

  // Nếu có tiền cần đóng thêm → tạo Invoice + Payment (tùy tích hợp)
  if (priceToPay > 0) {
    // Tạo Invoice (optional — dùng module payments)
    const invoice = await this.prisma.invoice.create({
      data: { memberId, totalAmount: priceToPay, status: 'DRAFT', currency: 'VND' },
    });
  }

  return { membership: newMembership, priceToPay, method: dto.method };
}
```

## Controller — members.controller.ts (thêm)
```typescript
@Post(':id/change-package')
@Roles(Role.MEMBER, Role.ADMIN, Role.STAFF)
async changePackage(@Param('id') id: string, @Body() dto: ChangePackageDto) {
  return this.membersService.changePackage(id, dto);
}
```

## Frontend — `/member/membership`
Thêm nút "Thay đổi gói" → Dialog chọn `packageId` mới → Call API → Hiện `Cần đóng thêm: X VND` trước khi xác nhận.

## Schema (nếu cần thêm `changedFromPackageId` cho log)
```prisma
model Membership {
  ...
  changedFromPackageId String? @db.NVarChar(50)
  changedAt            DateTime? @default(now()) @db.DateTime2
}
```
