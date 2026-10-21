export interface FoodRow {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  description: string | null;
  servingSize: number;
  servingUnit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isActive: boolean;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodListQuery {
  category?: string | null;
  search?: string | null;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateFoodInput {
  name: string;
  category?: string;
  imageUrl?: string | null;
  description?: string | null;
  servingSize?: number;
  servingUnit?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  createdById?: string | null;
}

export interface UpdateFoodInput {
  name?: string;
  category?: string;
  imageUrl?: string | null;
  description?: string | null;
  servingSize?: number;
  servingUnit?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  isActive?: boolean;
}

export interface FoodsRepository {
  list(query?: FoodListQuery): Promise<FoodRow[]>;
  count(query?: Omit<FoodListQuery, 'page' | 'limit'>): Promise<number>;
  findOne(id: string): Promise<FoodRow | null>;
  create(input: CreateFoodInput): Promise<FoodRow>;
  update(id: string, input: UpdateFoodInput): Promise<FoodRow | null>;
  deactivate(id: string): Promise<void>;
}
