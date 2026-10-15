import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Food, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { CreateFoodDto, FoodQueryDto, UpdateFoodDto } from './dto/food.dto';

/**
 * FoodsService — thư viện thực phẩm dùng chung cho công cụ tạo thực đơn.
 * Xoá là xoá mềm (isActive=false) để không phá dữ liệu thực đơn đã gửi;
 * MealItem vẫn giữ snapshot dinh dưỡng nên thực đơn cũ không đổi.
 */
@Injectable()
export class FoodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private toNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  async create(dto: CreateFoodDto, actor: { userId: string; ip?: string }): Promise<Food> {
    const food = await this.prisma.food.create({
      data: {
        name: dto.name.trim(),
        category: dto.category ?? 'PROTEIN',
        imageUrl: dto.imageUrl ?? null,
        description: dto.description ?? null,
        servingSize: dto.servingSize ?? 100,
        servingUnit: dto.servingUnit ?? 'g',
        caloriesPer100g: this.toNumber(dto.caloriesPer100g),
        proteinPer100g: this.toNumber(dto.proteinPer100g),
        carbsPer100g: this.toNumber(dto.carbsPer100g),
        fatPer100g: this.toNumber(dto.fatPer100g),
        createdById: actor.userId,
      },
    });

    await this.audit.log({
      userId: actor.userId,
      action: 'FOOD_CREATE',
      entity: 'Food',
      entityId: food.id,
      metadata: { name: food.name, category: food.category },
      ip: actor.ip,
    });

    return food;
  }

  async findAll(query: FoodQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const where: Prisma.FoodWhereInput = {};
    if (!query.includeInactive) where.isActive = true;
    if (query.category) where.category = query.category;
    if (query.search) where.name = { contains: query.search.trim(), mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.food.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.food.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Food> {
    const food = await this.prisma.food.findUnique({ where: { id } });
    if (!food) throw new NotFoundException('Không tìm thấy thực phẩm.');
    return food;
  }

  async update(
    id: string,
    dto: UpdateFoodDto,
    actor: { userId: string; ip?: string },
  ): Promise<Food> {
    await this.findOne(id);

    const food = await this.prisma.food.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.servingSize !== undefined ? { servingSize: dto.servingSize } : {}),
        ...(dto.servingUnit !== undefined ? { servingUnit: dto.servingUnit } : {}),
        ...(dto.caloriesPer100g !== undefined
          ? { caloriesPer100g: this.toNumber(dto.caloriesPer100g) }
          : {}),
        ...(dto.proteinPer100g !== undefined
          ? { proteinPer100g: this.toNumber(dto.proteinPer100g) }
          : {}),
        ...(dto.carbsPer100g !== undefined ? { carbsPer100g: this.toNumber(dto.carbsPer100g) } : {}),
        ...(dto.fatPer100g !== undefined ? { fatPer100g: this.toNumber(dto.fatPer100g) } : {}),
      },
    });

    await this.audit.log({
      userId: actor.userId,
      action: 'FOOD_UPDATE',
      entity: 'Food',
      entityId: food.id,
      metadata: { name: food.name },
      ip: actor.ip,
    });

    return food;
  }

  /** Xoá mềm — thực phẩm đã dùng trong thực đơn gửi đi vẫn nguyên vẹn nhờ snapshot ở MealItem. */
  async remove(id: string, actor: { userId: string; ip?: string }) {
    const food = await this.findOne(id);
    if (!food.isActive) {
      throw new ForbiddenException('Thực phẩm này đã được ẩn trước đó.');
    }

    await this.prisma.food.update({ where: { id }, data: { isActive: false } });

    await this.audit.log({
      userId: actor.userId,
      action: 'FOOD_DELETE',
      entity: 'Food',
      entityId: id,
      metadata: { name: food.name },
      ip: actor.ip,
    });

    return { success: true, id };
  }

  /** Đếm nhanh số thực phẩm đang hoạt động (dùng cho dashboard thư viện). */
  countActive() {
    return this.prisma.food.count({ where: { isActive: true } });
  }
}
