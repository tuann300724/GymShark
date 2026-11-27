import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import type { OwnerScope } from "../../common/utils/partner-scope";

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Nhân viên theo phạm vi: hệ thống = role STAFF của Gym Master;
   * đối tác = tài khoản PARTNER gắn ownerPartnerId (nhân viên của phòng đó).
   */
  async findStaff(search?: string, scope: OwnerScope = null) {
    const term = search?.trim();
    return this.prisma.user.findMany({
      where: {
        role: scope ? "PARTNER" : "STAFF",
        ownerPartnerId: scope,
        ...(term
          ? {
              OR: [
                { fullName: { contains: term } },
                { email: { contains: term } },
                { phone: { contains: term } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStaffStatus(
    id: string,
    status: "ACTIVE" | "INACTIVE",
    actorId: string,
    scope: OwnerScope = null,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: scope ? "PARTNER" : "STAFF", ownerPartnerId: scope },
      select: { id: true, status: true, email: true },
    });
    if (!user)
      throw new NotFoundException("Không tìm thấy tài khoản nhân viên");

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await this.auditService.log({
      userId: actorId,
      action: "USER_UPDATE",
      entity: "User",
      entityId: id,
      metadata: {
        email: user.email,
        status,
        previousStatus: user.status,
      },
    });

    return {
      message:
        status === "ACTIVE"
          ? "Đã kích hoạt tài khoản nhân viên"
          : "Đã khóa tài khoản nhân viên",
      user: updated,
    };
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        trainer: true,
        createdAt: true,
      },
    });
  }
}
