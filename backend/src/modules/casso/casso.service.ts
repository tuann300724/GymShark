import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CassoRow {
  [key: string]: string | number | boolean | null;
}

export interface CassoMatch {
  matchedPaymentCode?: string;
  matchedMemberCode?: string;
  row: CassoRow;
  amount?: number;
  memo?: string;
  maGd?: string;
  ngayDienRa?: string;
  soTaiKhoan?: string;
}

@Injectable()
export class CassoService {
  private readonly url: string;
  private readonly logger = new Logger(CassoService.name);
  private cache = new Map<string, { ts: number; rows: CassoRow[] }>();
  private readonly TTL_MS = 15_000;

  constructor(private config: ConfigService) {
    this.url = this.config.get<string>('CASSO_SHEET_URL') || '';
  }

  async poll(): Promise<CassoRow[]> {
    if (!this.url) {
      this.logger.warn('CASSO_SHEET_URL chưa cấu hình');
      return [];
    }
    const key = 'poll';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.ts < this.TTL_MS) {
      return cached.rows;
    }
    try {
      const res = await fetch(this.url, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!res.ok) {
        this.logger.error('CASSO poll HTTP ' + res.status);
        return cached?.rows ?? [];
      }
      const body = (await res.json()) as { data?: CassoRow[]; error?: boolean; rows?: CassoRow[] };
      const rows = (body?.data || body?.rows || []) as CassoRow[];
      // Bỏ dòng header (dòng có "Ma GD" bằng chữ "Ma GD") và giữ dòng thực
      const clean = rows.filter(
        (r) => {
          const ma = r['Ma GD'] ?? r['Ma GD'] ?? '';
          return typeof ma === 'string' && ma !== 'Ma GD' && ma.trim().length > 0;
        },
      );
      this.cache.set(key, { ts: Date.now(), rows: clean });
      return clean;
    } catch (e: any) {
      this.logger.error('CASSO poll lỗi: ' + e.message);
      return cached?.rows ?? [];
    }
  }

  findMatch(rows: CassoRow[], memberCode: string, paymentCode: string, amountExpected: number): CassoMatch | null {
    const codeNorm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const targetCode = codeNorm(paymentCode);
    const targetMember = codeNorm(memberCode);

    for (const row of rows) {
      const moTa = String(row['Mô tả'] ?? row['Mo ta'] ?? row['Mô Tả'] ?? row['Mo Ta'] ?? '');
      const giaTriRaw = row['Giá trị'] ?? row['Gia tri'] ?? row['Gia Tri'] ?? 0;
      const maGd = String(row['Ma GD'] ?? row['Ma GD'] ?? row['Mã GD'] ?? '');
      const ngay = String(row['Ngày diễn ra'] ?? row['Ngay dien ra'] ?? row['Ngày Diễn Ra'] ?? '');
      const tk = String(row['Số tài khoản'] ?? row['So tai khoan'] ?? row['Số Tài Khoản'] ?? '');

      // Lọc dòng header sót lại
      if (typeof giaTriRaw === 'string' && giaTriRaw.trim() === 'Giá trị') continue;
      const amount = typeof giaTriRaw === 'number' ? giaTriRaw : Number(String(giaTriRaw).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

      const moTaNorm = codeNorm(moTa);
      // Khớp khi mô tả chứa cả member code + payment code (chuẩn hóa)
      const hasMember = targetMember.length > 0 ? moTaNorm.includes(targetMember) : true;
      const hasPayment = moTaNorm.includes(targetCode);
      const hasAmount = Math.abs(amount - amountExpected) < 100; // sai số 100 đ (phí chuyển)

      // Nếu khớp mô tả + mã giao dịch gần đúng (tùy chọn) hoặc chỉ khớp nội dung
      if ((hasMember || targetMember.length === 0) && hasPayment && hasAmount) {
        return {
          matchedPaymentCode: paymentCode,
          matchedMemberCode: memberCode,
          row,
          amount,
          memo: moTa,
          maGd,
          ngayDienRa: ngay,
          soTaiKhoan: tk,
        };
      }
    }
    return null;
  }
}
