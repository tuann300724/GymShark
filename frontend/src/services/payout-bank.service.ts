import apiClient from '@/lib/axios';
import type { PayoutBank } from './types';

export type PayoutBankOwner = 'trainer' | 'partner';

export type PayoutBankInput = {
  bankCode: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  /** data URL ảnh QR; chuỗi rỗng = xoá ảnh */
  bankQrImage: string;
};

const PATH: Record<PayoutBankOwner, string> = {
  trainer: '/trainers/me/bank',
  partner: '/partners/me/bank',
};

/** Tài khoản nhận tiền của PT / đối tác đang đăng nhập (admin chuyển khoản theo thông tin này) */
export const payoutBankApi = {
  get: async (owner: PayoutBankOwner) => {
    const res = await apiClient.get<PayoutBank | null>(PATH[owner]);
    return res.data;
  },
  update: async (owner: PayoutBankOwner, data: PayoutBankInput) => {
    const res = await apiClient.patch<{ message: string; bank: PayoutBank }>(PATH[owner], data);
    return res.data;
  },
};
