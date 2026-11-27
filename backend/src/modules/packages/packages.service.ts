import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { GYM_TIER_VALUES, PackageType } from "../../common/constants/db-enums";
import { parseJsonText, serializeJsonText } from "../../common/utils/json-text";
import { PrismaService } from "../../prisma/prisma.service";
import { assertInScope, ownerWhere, type OwnerScope } from "../../common/utils/partner-scope";
import { CreatePackageDto } from "./dto/create-package.dto";
import { UpdatePackageDto } from "./dto/update-package.dto";

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  private withFeatures<
    T extends {
      features: string | null;
      gymTierAccess: string | null;
      status: string;
      type?: string;
    },
  >(pkg: T) {
    return {
      ...pkg,
      status: pkg.type === PackageType.SESSION_BASED ? "INACTIVE" : pkg.status,
      features: parseJsonText<{ title?: string; items: string[] }>(pkg.features),
      gymTierAccess: parseJsonText<string[]>(pkg.gymTierAccess) ?? [],
    };
  }

  /** Danh sách gói tập theo phạm vi: hệ thống (admin) hoặc gói riêng của đối tác */
  async findAll(scope: OwnerScope = null) {
    const packages = await this.prisma.membershipPackage.findMany({
      where: { type: { not: PackageType.SESSION_BASED }, ...ownerWhere(scope) },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return packages.map((pkg) => this.withFeatures(pkg));
  }

  async findOne(id: string, scope: OwnerScope = null) {
    const pkg = await this.prisma.membershipPackage.findUnique({
      where: { id },
      include: {
        _count: { select: { memberships: true } },
      },
    });
    if (!pkg) throw new NotFoundException("Không tìm thấy gói tập");
    assertInScope(pkg.ownerPartnerId, scope, "Không tìm thấy gói tập");
    return this.withFeatures(pkg);
  }

  /**
   * Ràng buộc nghiệp vụ theo loại hình gói:
   * - CREDIT_BASED (theo số lượt): bắt buộc có tổng số lượt > 0
   * - FIXED_TERM (theo thời hạn): số lượt/tháng là tuỳ chọn (null = không giới hạn)
   */
  private assertVisitRule(type: string, visitLimit: number | null | undefined) {
    if (type === PackageType.CREDIT_BASED && (visitLimit == null || visitLimit < 1)) {
      throw new BadRequestException(
        "Gói theo số lượt phải có tổng số lượt tập lớn hơn 0",
      );
    }
    if (visitLimit != null && visitLimit < 1) {
      throw new BadRequestException("Giới hạn số lượt phải lớn hơn 0");
    }
  }

  private assertTierList(tiers: string[] | undefined) {
    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw new BadRequestException("Phải chọn ít nhất một hạng phòng gym");
    }
    const invalid = tiers.filter((tier) => !GYM_TIER_VALUES.includes(tier));
    if (invalid.length > 0) {
      throw new BadRequestException(`Hạng phòng gym không hợp lệ: ${invalid.join(", ")}`);
    }
  }

  /** Tạo gói tập mới — backend tự sinh mã gói, không tin frontend */
  async create(dto: CreatePackageDto, scope: OwnerScope = null) {
    const type = dto.type ?? PackageType.FIXED_TERM;
    this.assertVisitRule(type, dto.visitLimit);
    // Gói hệ thống bắt buộc chọn hạng phòng đối tác; gói riêng của đối tác chỉ dùng tại phòng đó
    if (scope === null) this.assertTierList(dto.gymTierAccess);

    if (dto.features && typeof dto.features === "object") {
      if (!Array.isArray(dto.features.items)) {
        throw new BadRequestException("features.items phải là mảng các chuỗi");
      }
    }

    let code = `PKG-${Date.now().toString(36).toUpperCase()}`;
    // Đảm bảo mã không trùng
    for (let i = 0; i < 5; i++) {
      const exists = await this.prisma.membershipPackage.findUnique({
        where: { code },
      });
      if (!exists) break;
      code = `PKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    const pkg = await this.prisma.membershipPackage.create({
      data: {
        code,
        name: dto.name,
        description: dto.description ?? null,
        features: serializeJsonText(dto.features),
        durationDays: dto.durationDays,
        price: new Prisma.Decimal(dto.price.toFixed(2)),
        type,
        visitLimit: dto.visitLimit ?? null,
        dailyVisitLimit: dto.dailyVisitLimit ?? 1,
        gymTierAccess: scope === null ? serializeJsonText(dto.gymTierAccess) : null,
        status: dto.status || "ACTIVE",
        ownerPartnerId: scope,
      },
    });
    return this.withFeatures(pkg);
  }

  /** Cập nhật gói tập */
  async update(id: string, dto: UpdatePackageDto, scope: OwnerScope = null) {
    const pkg = await this.prisma.membershipPackage.findUnique({
      where: { id },
    });
    if (!pkg) throw new NotFoundException("Không tìm thấy gói tập");
    assertInScope(pkg.ownerPartnerId, scope, "Không tìm thấy gói tập");
    if (pkg.type === PackageType.SESSION_BASED) {
      if (dto.status === "ACTIVE") {
        throw new BadRequestException(
          "Gói tập theo buổi cũ đã ngừng hỗ trợ và không thể mở bán lại.",
        );
      }
      if (Object.keys(dto).some((key) => key !== "status")) {
        throw new BadRequestException(
          "Gói tập theo buổi cũ không thể chỉnh sửa. Hãy tạo gói mới theo thời hạn hoặc theo số lượt.",
        );
      }
    }

    const type = dto.type ?? pkg.type;
    const visitLimit = dto.visitLimit !== undefined ? dto.visitLimit : pkg.visitLimit;
    this.assertVisitRule(type, visitLimit);
    if (dto.gymTierAccess !== undefined && scope === null) this.assertTierList(dto.gymTierAccess);

    const data: Prisma.MembershipPackageUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.features !== undefined) data.features = serializeJsonText(dto.features);
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.price !== undefined)
      data.price = new Prisma.Decimal(dto.price.toFixed(2));
    if (dto.visitLimit !== undefined) data.visitLimit = dto.visitLimit;
    if (dto.dailyVisitLimit !== undefined) data.dailyVisitLimit = dto.dailyVisitLimit;
    if (dto.gymTierAccess !== undefined && scope === null)
      data.gymTierAccess = serializeJsonText(dto.gymTierAccess);
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.membershipPackage.update({
      where: { id },
      data,
    });
    return this.withFeatures(updated);
  }

  /** Xoá gói tập — chỉ khi gói CHƯA được bán cho bất kỳ membership nào */
  async remove(id: string, scope: OwnerScope = null) {
    const pkg = await this.prisma.membershipPackage.findUnique({
      where: { id },
      include: { _count: { select: { memberships: true } } },
    });
    if (!pkg) throw new NotFoundException("Không tìm thấy gói tập");
    assertInScope(pkg.ownerPartnerId, scope, "Không tìm thấy gói tập");

    if (pkg._count.memberships > 0) {
      throw new ConflictException(
        "Không thể xoá gói tập vì đã có hội viên đăng ký. Hãy chuyển trạng thái sang ngừng bán (INACTIVE).",
      );
    }

    await this.prisma.membershipPackage.delete({ where: { id } });
    return { message: "Đã xoá gói tập" };
  }
}
