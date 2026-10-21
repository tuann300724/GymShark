import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesRepository, PackageRow } from './repository/packages.repository';
import { PACKAGES_REPOSITORY } from './repository/packages.tokens';

@Injectable()
export class PackagesService {
  constructor(
    @Inject(PACKAGES_REPOSITORY) private readonly repo: PackagesRepository,
  ) {}

  private toShape(row: PackageRow) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      features: row.features,
      durationDays: row.durationDays,
      price: String(Number(row.price) || row.price),
      sessions: row.sessions,
      type: row.type,
      status: row.status,
      allowedBranches: row.allowedBranches,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _count: { memberships: row.membershipsCount ?? 0 },
    };
  }

  async findAll() {
    const rows = await this.repo.list({ limit: 100 });
    return rows.map((r) => this.toShape(r));
  }

  async findOne(id: string) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException('Không tìm thấy gói tập');
    return this.toShape(row);
  }

  async create(dto: CreatePackageDto) {
    if (dto.features && typeof dto.features === 'object') {
      if (!Array.isArray((dto.features as any).items)) {
        throw new BadRequestException('features.items phải là mảng các chuỗi');
      }
    }

    let code = `PKG-${Date.now().toString(36).toUpperCase()}`;
    for (let i = 0; i < 5; i++) {
      const exists = await this.repo.findByCode(code);
      if (!exists) break;
      code = `PKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    const created = await this.repo.create({
      id: undefined,
      code,
      name: dto.name,
      description: dto.description ?? null,
      features: (dto.features as any) ?? null,
      durationDays: dto.durationDays,
      price: dto.price,
      sessions: dto.sessions ?? null,
      type: dto.type || 'FIXED_TERM',
      status: dto.status || 'ACTIVE',
      allowedBranches: null,
    });
    return this.toShape(created);
  }

  async update(id: string, dto: UpdatePackageDto) {
    const pkg = await this.repo.findOne(id);
    if (!pkg) throw new NotFoundException('Không tìm thấy gói tập');
    const updated = await this.repo.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.features !== undefined ? { features: dto.features } : {}),
      ...(dto.durationDays !== undefined ? { durationDays: dto.durationDays } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.sessions !== undefined ? { sessions: dto.sessions } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    });
    return this.toShape(updated as PackageRow);
  }

  async remove(id: string) {
    const pkg = await this.repo.findOne(id);
    if (!pkg) throw new NotFoundException('Không tìm thấy gói tập');
    if ((pkg.membershipsCount ?? 0) > 0) {
      throw new ConflictException('Không thể xoá gói tập vì đã có hội viên đăng ký. Hãy chuyển trạng thái sang ngừng bán (INACTIVE).');
    }
    await this.repo.delete(id);
    return { message: 'Đã xoá gói tập' };
  }
}
