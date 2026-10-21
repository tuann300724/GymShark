export interface PromotionRow {
  id: string; code: string; name: string; description: string | null;
  discountType: string; discountValue: number; minOrderValue: number | null;
  maxDiscount: number | null; startDate: Date; endDate: Date;
  usageLimit: number | null; perMemberLimit: number | null; usedCount: number; status: string;
  createdAt: Date; updatedAt: Date;
}
export interface PromotionsRepository {
  list(query?: any): Promise<{ data: PromotionRow[]; total: number }>;
  findOne(id: string): Promise<PromotionRow | null>;
  findByCode(code: string): Promise<PromotionRow | null>;
  create(input: any): Promise<PromotionRow>;
  update(id: string, data: Partial<any>): Promise<PromotionRow | null>;
  delete(id: string): Promise<void>;
  setStatus(id: string, status: string): Promise<void>;
  updateMany(where: any, data: any): Promise<number>;
}
