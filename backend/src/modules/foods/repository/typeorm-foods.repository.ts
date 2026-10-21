import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FoodsRepository, FoodRow, FoodListQuery, CreateFoodInput, UpdateFoodInput } from './foods.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class TypeOrmFoodsRepository implements FoodsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(query?: FoodListQuery): Promise<FoodRow[]> {
    const rows = await this.dataSource.query(
      'EXEC sp_foods_list @category=@0, @search=@1, @isActive=@2, @page=@3, @limit=@4',
      [
        query?.category ?? null,
        query?.search ?? null,
        query?.includeInactive ? null : 1,
        query?.page ?? 1,
        query?.limit ?? 20,
      ],
    );
    return (rows as FoodRow[]) ?? [];
  }

  async count(query?: Omit<FoodListQuery, 'page' | 'limit'>): Promise<number> {
    const rows = await this.dataSource.query(
      'EXEC sp_foods_list_count @category=@0, @search=@1, @isActive=@2',
      [
        query?.category ?? null,
        query?.search ?? null,
        query?.includeInactive ? null : 1,
      ],
    );
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }

  async findOne(id: string): Promise<FoodRow | null> {
    const rows = await this.dataSource.query('EXEC sp_foods_find_one @id=@0', [id]);
    return this.first<FoodRow>(rows);
  }

  async create(input: CreateFoodInput): Promise<FoodRow> {
    const id = randomUUID();
    const rows = await this.dataSource.query(
      'EXEC sp_foods_create @id=@0, @name=@1, @category=@2, @imageUrl=@3, @description=@4, @servingSize=@5, @servingUnit=@6, @caloriesPer100g=@7, @proteinPer100g=@8, @carbsPer100g=@9, @fatPer100g=@10, @createdById=@11',
      [
        id,
        input.name.trim(),
        input.category ?? 'PROTEIN',
        input.imageUrl ?? null,
        input.description ?? null,
        input.servingSize ?? 100,
        input.servingUnit ?? 'g',
        input.caloriesPer100g ?? 0,
        input.proteinPer100g ?? 0,
        input.carbsPer100g ?? 0,
        input.fatPer100g ?? 0,
        input.createdById ?? null,
      ],
    );
    return this.first<FoodRow>(rows) as FoodRow;
  }

  async update(id: string, input: UpdateFoodInput): Promise<FoodRow | null> {
    const rows = await this.dataSource.query(
      'EXEC sp_foods_update @id=@0, @name=@1, @category=@2, @imageUrl=@3, @description=@4, @servingSize=@5, @servingUnit=@6, @caloriesPer100g=@7, @proteinPer100g=@8, @carbsPer100g=@9, @fatPer100g=@10, @isActive=@11',
      [
        id,
        input.name ?? null,
        input.category ?? null,
        input.imageUrl === undefined ? null : input.imageUrl,
        input.description === undefined ? null : input.description,
        input.servingSize ?? null,
        input.servingUnit ?? null,
        input.caloriesPer100g ?? null,
        input.proteinPer100g ?? null,
        input.carbsPer100g ?? null,
        input.fatPer100g ?? null,
        input.isActive === undefined ? null : (input.isActive ? 1 : 0),
      ],
    );
    return this.first<FoodRow>(rows);
  }

  async deactivate(id: string): Promise<void> {
    await this.dataSource.query('EXEC sp_foods_delete @id=@0', [id]);
  }
}
