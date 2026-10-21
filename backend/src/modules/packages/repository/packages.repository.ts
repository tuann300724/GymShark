export interface PackageRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  features: any | null;
  durationDays: number;
  price: number | string;
  sessions: number | null;
  type: string;
  status: string;
  allowedBranches: string[] | null;
  membershipsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackagesRepository {
  list(query?: { status?: string | null; search?: string | null; limit?: number }): Promise<PackageRow[]>;
  findOne(id: string): Promise<PackageRow | null>;
  /** Tìm gói theo mã (kiểm tra trùng mã khi sinh mã mới). */
  findByCode(code: string): Promise<PackageRow | null>;
  countMemberships(id: string): Promise<number>;
  create(input: any): Promise<PackageRow>;
  update(id: string, input: any): Promise<PackageRow | null>;
  delete(id: string): Promise<void>;
}
