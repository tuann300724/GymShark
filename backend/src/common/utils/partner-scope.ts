import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Role } from "../enums/role.enum";

/**
 * Phạm vi dữ liệu theo đối tác (phòng gym tự quản lý).
 *
 * - Tài khoản PARTNER chỉ thấy/sửa dữ liệu có `ownerPartnerId = partner.id`.
 * - Tài khoản hệ thống (ADMIN/MANAGER/STAFF/TRAINER) chỉ thấy dữ liệu của Gym Master
 *   (`ownerPartnerId = null`) — sổ sách đối tác không lẫn vào doanh thu hệ thống.
 *
 * `null` = phạm vi hệ thống, chuỗi = id đối tác.
 */
export type OwnerScope = string | null;

export interface ScopeActor {
  id?: string;
  role?: string;
}

/**
 * Đối tác của một tài khoản PARTNER: chủ đối tác (Partner.userId) hoặc nhân viên
 * của đối tác (User.ownerPartnerId). Trả null nếu tài khoản không gắn đối tác nào.
 */
export async function resolvePartnerIdForUser(
  prisma: PrismaService,
  userId: string | undefined,
): Promise<string | null> {
  if (!userId) return null;
  const own = await prisma.partner.findUnique({ where: { userId }, select: { id: true } });
  if (own) return own.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, ownerPartnerId: true },
  });
  return user?.role === Role.PARTNER ? (user.ownerPartnerId ?? null) : null;
}

/** Chỉ chủ đối tác (không phải nhân viên) được quản lý nhân viên, cơ sở, hợp đồng. */
export async function assertPartnerOwner(
  prisma: PrismaService,
  userId: string | undefined,
): Promise<void> {
  if (!userId) throw new ForbiddenException("Phiên đăng nhập không hợp lệ");
  const own = await prisma.partner.findUnique({ where: { userId }, select: { id: true } });
  if (!own) {
    throw new ForbiddenException("Chỉ chủ tài khoản đối tác được thực hiện thao tác này");
  }
}

export async function resolveOwnerScope(
  prisma: PrismaService,
  actor: ScopeActor | undefined,
): Promise<OwnerScope> {
  if (actor?.role !== Role.PARTNER) return null;
  if (!actor.id) throw new ForbiddenException("Phiên đăng nhập không hợp lệ");
  const partnerId = await resolvePartnerIdForUser(prisma, actor.id);
  const partner = partnerId
    ? await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { id: true, status: true },
      })
    : null;
  if (!partner) throw new ForbiddenException("Không tìm thấy hồ sơ đối tác của tài khoản này");
  if (partner.status !== "APPROVED") {
    throw new ForbiddenException("Tài khoản đối tác chưa được duyệt hoặc đang bị khóa");
  }
  return partner.id;
}

/** Điều kiện where cho bảng có cột ownerPartnerId (Member, MembershipPackage). */
export function ownerWhere(scope: OwnerScope) {
  return { ownerPartnerId: scope };
}

/** Điều kiện where cho bảng gắn với hội viên (Membership, Payment, Invoice). */
export function memberOwnerWhere(scope: OwnerScope) {
  return { member: { is: { ownerPartnerId: scope } } };
}

/** Bản ghi không thuộc phạm vi → coi như không tồn tại (không lộ dữ liệu đối tác khác). */
export function assertInScope(
  ownerPartnerId: string | null | undefined,
  scope: OwnerScope,
  message = "Không tìm thấy dữ liệu",
): void {
  if ((ownerPartnerId ?? null) !== scope) throw new NotFoundException(message);
}
