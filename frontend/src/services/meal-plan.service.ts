import apiClient from '@/lib/axios';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
type MealPlanScope = 'DAY' | 'WEEK';
export type MealPlanStatus = 'DRAFT' | 'SENT' | 'CONFIRMED';

interface MealItem {
  id: string;
  mealId: string;
  foodId: string | null;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  orderIndex: number;
}

interface Meal {
  id: string;
  mealPlanId: string;
  type: MealType;
  dayIndex: number | null;
  time: string | null;
  note: string | null;
  imageData: string | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  orderIndex: number;
  items: MealItem[];
}

export interface MealPlan {
  id: string;
  trainerId: string;
  memberId: string | null;
  title: string;
  description: string | null;
  scope: MealPlanScope;
  startDate: string | null;
  status: MealPlanStatus;
  isTemplate: boolean;
  templateName: string | null;
  imageData: string | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  version: number;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  member?: { id: string; fullName: string; avatarUrl: string | null; code: string } | null;
  trainer?: {
    id: string;
    user?: { id: string; fullName: string; avatarUrl: string | null };
  } | null;
  meals: Meal[];
  _count?: { meals: number };
}

export interface MealPlanListResponse {
  data: MealPlan[];
  total: number;
  page: number;
  limit: number;
}

export const mealPlanApi = {
  listTrainer: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    memberId?: string;
    status?: MealPlanStatus;
    isTemplate?: boolean;
  }): Promise<MealPlanListResponse> => {
    const res = await apiClient.get<MealPlanListResponse>('/meal-plans', { params });
    return res.data;
  },

  listMember: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<MealPlanListResponse> => {
    const res = await apiClient.get<MealPlanListResponse>('/meal-plans/me', { params });
    return res.data;
  },

  get: async (id: string): Promise<MealPlan> => {
    const res = await apiClient.get<MealPlan>(`/meal-plans/${id}`);
    return res.data;
  },

  create: async (payload: any): Promise<MealPlan> => {
    const res = await apiClient.post<MealPlan>('/meal-plans', payload);
    return res.data;
  },

  update: async (id: string, payload: any): Promise<MealPlan> => {
    const res = await apiClient.patch<MealPlan>(`/meal-plans/${id}`, payload);
    return res.data;
  },

  remove: async (id: string): Promise<{ success: boolean; id: string }> => {
    const res = await apiClient.delete<{ success: boolean; id: string }>(`/meal-plans/${id}`);
    return res.data;
  },

  duplicate: async (
    id: string,
    payload?: { memberId?: string; title?: string },
  ): Promise<MealPlan> => {
    const res = await apiClient.post<MealPlan>(`/meal-plans/${id}/duplicate`, payload || {});
    return res.data;
  },

  send: async (
    id: string,
    payload?: { content?: string },
  ): Promise<{ planId: string; message: any }> => {
    const res = await apiClient.post<{ planId: string; message: any }>(
      `/meal-plans/${id}/send`,
      payload || {},
    );
    return res.data;
  },

  confirm: async (id: string): Promise<MealPlan> => {
    const res = await apiClient.post<MealPlan>(`/meal-plans/${id}/confirm`);
    return res.data;
  },
};
