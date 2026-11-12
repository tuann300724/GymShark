/**
 * Cấu hình tài khoản ngân hàng nhận tiền (dùng cho phương thức BANK_TRANSFER).
 * Đây là tài khoản nhận chuyển khoản — giao dịch được đối soát qua CASSO theo
 * nội dung chuyển khoản (GYM + MEMBER_CODE + PAYMENT_CODE).
 */
export const BANK_INFO = {
  bankName: 'Ngân hàng TMCP Quân đội (MB Bank)',
  shortName: 'MB',
  bankCode: '970436',
  accountName: 'CÔNG TY TNHH GYM MASTER PRO',
  accountNumber: '0799951104',
  branch: 'CN Đồng Nai',
  note: 'Vui lòng ghi đúng nội dung chuyển khoản (GYM + Mã hội viên + Mã thanh toán) để lễ tân xác nhận nhanh nhất.',
  transferContentFormat: 'GYM {MEMBER_CODE} {PAYMENT_CODE}',
} as const;
