import apiClient from '@/lib/axios';

export type FoodCategory =
  | 'PROTEIN'
  | 'CARBOHYDRATE'
  | 'VEGETABLE'
  | 'FRUIT'
  | 'DAIRY'
  | 'FAT'
  | 'DRINK'
  | 'SNACK'
  | 'OTHER';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  imageUrl: string | null;
  description: string | null;
  servingSize: number;
  servingUnit: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodListResponse {
  data: FoodItem[];
  total: number;
  page: number;
  limit: number;
}

export const foodApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: FoodCategory;
    includeInactive?: boolean;
  }): Promise<FoodListResponse> => {
    const res = await apiClient.get<FoodListResponse>('/foods', { params });
    return res.data;
  },

  get: async (id: string): Promise<FoodItem> => {
    const res = await apiClient.get<FoodItem>(`/foods/${id}`);
    return res.data;
  },

  create: async (payload: Partial<FoodItem>): Promise<FoodItem> => {
    const res = await apiClient.post<FoodItem>('/foods', payload);
    return res.data;
  },

  update: async (id: string, payload: Partial<FoodItem>): Promise<FoodItem> => {
    const res = await apiClient.patch<FoodItem>(`/foods/${id}`, payload);
    return res.data;
  },

  remove: async (id: string): Promise<{ success: boolean; id: string }> => {
    const res = await apiClient.delete<{ success: boolean; id: string }>(`/foods/${id}`);
    return res.data;
  },
};
