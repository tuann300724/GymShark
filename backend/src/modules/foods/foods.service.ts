import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Food } from '@prisma/client';
import { AuditService } from '../audit-logs/audit-logs.service';
import { CreateFoodDto, FoodQueryDto, UpdateFoodDto } from './dto/food.dto';
import { FoodsRepository, FoodRow } from './repository/foods.repository';
import { FOODS_REPOSITORY } from './repository/foods.tokens';

/**
 * FoodsService — thư viện thực phẩm dùng chung cho công cụ tạo thực đơn.
 * Xoá là xoá mềm (isActive=false) để không phá dữ liệu thực đơn đã gửi;
 * MealItem vẫn giữ snapshot dinh dưỡng nên thực đơn cũ không đổi.
 */
@Injectable()
export class FoodsService {
  constructor(
    @Inject(FOODS_REPOSITORY) private readonly repo: FoodsRepository,
    private readonly audit: AuditService,
  ) {}

  private toNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  /** Chuyển row từ SP sang shape Food (khớp Prisma Food). */
  private toFood(row: FoodRow): Food {
    return {
      id: row.id,
      name: row.name,
      category: row.category as Food['category'],
      imageUrl: row.imageUrl,
      description: row.description,
      servingSize: Number(row.servingSize),
      servingUnit: row.servingUnit,
      caloriesPer100g: Number(row.caloriesPer100g),
      proteinPer100g: Number(row.proteinPer100g),
      carbsPer100g: Number(row.carbsPer100g),
      fatPer100g: Number(row.fatPer100g),
      isActive: !!row.isActive,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    } as Food;
  }

  async create(dto: CreateFoodDto, actor: { userId: string; ip?: string }): Promise<Food> {
    const created = await this.repo.create({
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
    });

    const food = this.toFood(created);

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

    const filter = {
      category: query.category ?? null,
      search: query.search ? query.search.trim() : null,
      includeInactive: !!query.includeInactive,
    };

    const [rows, total] = await Promise.all([
      this.repo.list({ ...filter, page, limit }),
      this.repo.count(filter),
    ]);

    const data = rows.map((r) => this.toFood(r));

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Food> {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException('Không tìm thấy thực phẩm.');
    return this.toFood(row);
  }

  async update(
    id: string,
    dto: UpdateFoodDto,
    actor: { userId: string; ip?: string },
  ): Promise<Food> {
    await this.findOne(id);

    const updated = await this.repo.update(id, {
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
    });

    const food = this.toFood(updated as FoodRow);

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

    await this.repo.deactivate(id);

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
    return this.repo.count({ includeInactive: false });
  }
}
