import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  /** Danh sách gói tập (admin: trả tất cả kèm số lượng đã bán) */
  async findAll() {
    return this.prisma.membershipPackage.findMany({
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.membershipPackage.findUnique({
      where: { id },
      include: {
        _count: { select: { memberships: true } },
      },
    });
    if (!pkg) throw new NotFoundException('Không tìm thấy gói tập');
    return pkg;
  }

  /** Tạo gói tập mới — backend tự sinh mã gói, không tin frontend */
  async create(dto: CreatePackageDto) {
    let code = `PKG-${Date.now().toString(36).toUpperCase()}`;
    // Đảm bảo mã không trùng
    for (let i = 0; i < 5; i++) {
      const exists = await this.prisma.membershipPackage.findUnique({ where: { code } });
      if (!exists) break;
      code = `PKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    if (dto.features && typeof dto.features === 'object') {
      if (!Array.isArray(dto.features.items)) {
        throw new BadRequestException('features.items phải là mảng các chuỗi');
      }
    }

    return this.prisma.membershipPackage.create({
      data: {
        code,
        name: dto.name,
        description: dto.description ?? null,
        features: (dto.features as any) ?? Prisma.JsonNull,
        durationDays: dto.durationDays,
        price: new Prisma.Decimal(dto.price.toFixed(2)),
        sessions: dto.sessions ?? null,
        type: dto.type || 'FIXED_TERM',
        status: dto.status || 'ACTIVE',
      },
    });
  }

  /** Cập nhật gói tập */
  async update(id: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Không tìm thấy gói tập');

    const data: Prisma.MembershipPackageUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.features !== undefined) data.features = dto.features as any;
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price.toFixed(2));
    if (dto.sessions !== undefined) data.sessions = dto.sessions;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.membershipPackage.update({ where: { id }, data });
  }

  /** Xoá gói tập — chỉ khi gói CHƯA được bán cho bất kỳ membership nào */
  async remove(id: string) {
    const pkg = await this.prisma.membershipPackage.findUnique({
      where: { id },
      include: { _count: { select: { memberships: true } } },
    });
    if (!pkg) throw new NotFoundException('Không tìm thấy gói tập');

    if (pkg._count.memberships > 0) {
      throw new ConflictException(
        'Không thể xoá gói tập vì đã có hội viên đăng ký. Hãy chuyển trạng thái sang ngừng bán (INACTIVE).',
      );
    }

    await this.prisma.membershipPackage.delete({ where: { id } });
    return { message: 'Đã xoá gói tập' };
  }
}