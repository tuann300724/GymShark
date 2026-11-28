/** Ngân hàng phổ biến — `code` là mã ngắn dùng được với img.vietqr.io để sinh mã VietQR */
export const VN_BANKS: { code: string; name: string }[] = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'LPB', name: 'LPBank' },
  { code: 'NAB', name: 'Nam A Bank' },
  { code: 'BAB', name: 'Bac A Bank' },
  { code: 'ABB', name: 'ABBANK' },
  { code: 'VCCB', name: 'BVBank' },
  { code: 'PVCB', name: 'PVcomBank' },
  { code: 'SCB', name: 'SCB' },
  { code: 'KLB', name: 'KienlongBank' },
  { code: 'CAKE', name: 'CAKE by VPBank' },
];

export const bankNameOf = (code?: string | null) =>
  VN_BANKS.find((b) => b.code === code)?.name ?? code ?? '';

/** Ảnh VietQR có sẵn số tiền + nội dung (chỉ sinh được khi có mã ngân hàng + STK) */
export function vietQrUrl(opts: {
  bankCode: string;
  accountNumber: string;
  accountName?: string | null;
  amount?: number;
  content?: string;
}) {
  const params = new URLSearchParams();
  if (opts.amount && opts.amount > 0) params.set('amount', String(Math.round(opts.amount)));
  if (opts.content) params.set('addInfo', opts.content);
  if (opts.accountName) params.set('accountName', opts.accountName);
  return `https://img.vietqr.io/image/${encodeURIComponent(opts.bankCode)}-${encodeURIComponent(
    opts.accountNumber,
  )}-compact2.png?${params}`;
}
