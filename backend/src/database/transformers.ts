import { ValueTransformer } from 'typeorm';

/**
 * Transformer dùng chung khi map TypeORM (SQL Server) <-> TypeScript.
 * SQL Server không có kiểu Json/Float[]/Decimal map thẳng sang JS như PostgreSQL
 * nên ta lưu dạng nvarchar/decimal và tự serialize/sang phía service.
 */

/** nvarchar(max) JSON <-> object/array (Prisma Json -> JS object) */
export const JsonTransformer: ValueTransformer = {
  to: (value?: unknown) => (value === null || value === undefined ? null : JSON.stringify(value)),
  from: (value?: string | null) =>
    value === null || value === undefined ? null : safeParse(value),
};

/** nvarchar(max) JSON lưu mảng số (vector embedding khuôn mặt) <-> number[] */
export const FloatArrayTransformer: ValueTransformer = {
  to: (value?: number[] | null) =>
    value === null || value === undefined ? null : JSON.stringify(value),
  from: (value?: string | null): number[] | null => {
    if (value === null || value === undefined) return null;
    const parsed = safeParse(value);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  },
};

/** decimal(12,2) <-> number (mssql trả về string) */
export const DecimalTransformer: ValueTransformer = {
  to: (value?: number | null) => (value === null || value === undefined ? null : value),
  from: (value?: string | number | null) =>
    value === null || value === undefined ? null : Number(value),
};

function safeParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
