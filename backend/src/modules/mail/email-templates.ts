/**
 * Template email gửi ra ngoài hệ thống.
 *
 * Email HTML dựng tay (không dùng package template) để giữ đúng bộ nhận diện
 * của sản phẩm: nền tối #0B0D0F, surface #15191D, viền #272C31, chữ #F5F5F5,
 * phụ #9AA0A6, accent neon #B7FF00 (chỉ dùng làm điểm nhấn — nút, số liệu).
 *
 * LƯU Ý bảo mật: nội dung email là dữ liệu người dùng nhập ở form đăng ký
 * (họ tên). Luôn escape HTML trước khi chèn vào template để chống HTML injection.
 */

const BRAND = {
  ink: '#0B0D0F',
  surface: '#15191D',
  line: '#272C31',
  chalk: '#F5F5F5',
  muted: '#9AA0A6',
  neon: '#B7FF00',
} as const;

/** Escape 5 ký tự HTML nguy hiểm trong chuỗi do người dùng nhập. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Khung email dùng chung: nền tối, container 560px, footer nhãn hệ thống. */
function layout(
  content: string,
  footerText = 'Nếu bạn không yêu cầu đăng ký tài khoản này, hãy bỏ qua email và không cần làm gì.',
): string {
  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GymMaster Pro</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.ink};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.surface};border:1px solid ${BRAND.line};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid ${BRAND.line};">
                <div style="font-family:Impact,'Arial Narrow',Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:1px;color:${BRAND.chalk};text-transform:uppercase;">
                  Gym<span style="color:${BRAND.neon};">Master</span> Pro
                </div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:${BRAND.muted};margin-top:4px;">
                  Hệ thống Quản lý Vận hành Phòng Gym
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${BRAND.line};font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:${BRAND.muted};">
                Email tự động từ hệ thống GymMaster Pro — vui lòng không trả lời email này.<br />
                ${escapeHtml(footerText)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface VerificationCodeEmail {
  subject: string;
  html: string;
  text: string;
}

export interface InvoiceEmailParams {
  memberName: string;
  invoiceNumber: string;
  packageName: string;
  amount: number;
  creditAmount: number;
  paymentMethod: string;
  paidAt: Date;
  transactionRef?: string | null;
  upgradeDescription: string;
}

export function packageChangeInvoiceEmail(params: InvoiceEmailParams): VerificationCodeEmail {
  const memberName = escapeHtml(params.memberName);
  const invoiceNumber = escapeHtml(params.invoiceNumber);
  const packageName = escapeHtml(params.packageName);
  const paymentMethod = escapeHtml(params.paymentMethod);
  const transactionRef = params.transactionRef ? escapeHtml(params.transactionRef) : '';
  const upgradeDescription = escapeHtml(params.upgradeDescription);
  const formatMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} VND`;
  const total = formatMoney(params.amount);
  const credit = formatMoney(params.creditAmount);
  const paidAt = params.paidAt.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  return {
    subject: `Hóa đơn thanh toán ${invoiceNumber} — GymMaster Pro`,
    html: layout(
      `
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Xin chào ${memberName},
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        GymMaster Pro xác nhận đã nhận thanh toán nâng cấp gói tập của bạn. Hóa đơn được gửi để bạn lưu lại.
      </p>
      <div style="margin:20px 0;padding:18px;background:${BRAND.ink};border:1px solid ${BRAND.line};border-radius:12px;">
        <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};">Mã hóa đơn</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:16px;font-weight:700;color:${BRAND.neon};">${invoiceNumber}</p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${BRAND.chalk};">
        <tr><td style="padding:8px 0;color:${BRAND.muted};">Nội dung</td><td align="right" style="padding:8px 0;">${upgradeDescription}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">Gói mới</td><td align="right" style="padding:8px 0;">${packageName}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">Giá trị gói mới</td><td align="right" style="padding:8px 0;">${formatMoney(params.amount + params.creditAmount)}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">Khấu trừ giá trị còn lại</td><td align="right" style="padding:8px 0;">− ${credit}</td></tr>
        <tr><td style="padding:12px 0;border-top:1px solid ${BRAND.line};font-weight:700;">Đã thanh toán</td><td align="right" style="padding:12px 0;border-top:1px solid ${BRAND.line};font-weight:700;color:${BRAND.neon};">${total}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};">Phương thức</td><td align="right" style="padding:8px 0;">${paymentMethod}</td></tr>
        ${transactionRef ? `<tr><td style="padding:8px 0;color:${BRAND.muted};">Mã giao dịch</td><td align="right" style="padding:8px 0;">${transactionRef}</td></tr>` : ''}
        <tr><td style="padding:8px 0;color:${BRAND.muted};">Thời gian thanh toán</td><td align="right" style="padding:8px 0;">${escapeHtml(paidAt)}</td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.7;color:${BRAND.muted};">
        Nếu có thắc mắc về hóa đơn, vui lòng liên hệ lễ tân phòng tập.
      </p>
    `,
      'Nếu cần hỗ trợ về hóa đơn này, vui lòng liên hệ lễ tân phòng tập.',
    ),
    text: [
      `Xin chào ${params.memberName},`,
      '',
      'GymMaster Pro xác nhận đã nhận thanh toán nâng cấp gói tập.',
      `Mã hóa đơn: ${params.invoiceNumber}`,
      `Nội dung: ${params.upgradeDescription}`,
      `Gói mới: ${params.packageName}`,
      `Giá trị gói mới: ${formatMoney(params.amount + params.creditAmount)}`,
      `Khấu trừ giá trị còn lại: ${formatMoney(params.creditAmount)}`,
      `Đã thanh toán: ${total}`,
      `Phương thức: ${params.paymentMethod}`,
      ...(params.transactionRef ? [`Mã giao dịch: ${params.transactionRef}`] : []),
      `Thời gian: ${paidAt}`,
      '',
      'Vui lòng lưu email này để đối chiếu khi cần.',
    ].join('\n'),
  };
}

/**
 * Email gửi mã đặt lại mật khẩu 6 số (luồng quên mật khẩu).
 * Không chứa link — người dùng nhập mã + mật khẩu mới ngay trên trang /forgot-password.
 */
export function passwordResetCodeEmail(params: {
  fullName: string;
  code: string;
  expiresInMinutes: number;
}): VerificationCodeEmail {
  const fullName = escapeHtml(params.fullName.trim());
  const code = escapeHtml(params.code);

  return {
    // Subject KHÔNG được chứa mã: MailService ghi subject ra log backend —
    // nếu để mã trong subject thì bất kỳ ai đọc được log cũng lấy được OTP.
    subject: 'Mã đặt lại mật khẩu GymMaster Pro',
    html: layout(`
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Xin chào ${fullName},
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        Bạn vừa yêu cầu đặt lại mật khẩu tài khoản <strong style="color:${BRAND.chalk};">GymMaster Pro</strong>.
        Nhập mã dưới đây vào trang quên mật khẩu để tạo mật khẩu mới.
      </p>
      <div style="margin:24px 0;padding:22px 20px;background:${BRAND.ink};border:1px solid ${BRAND.neon};border-radius:14px;text-align:center;">
        <div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:700;letter-spacing:14px;color:${BRAND.neon};text-indent:14px;">
          ${code}
        </div>
      </div>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:${BRAND.chalk};">
        ⏱ Mã có hiệu lực trong <strong style="color:${BRAND.neon};">${params.expiresInMinutes} phút</strong>.
      </p>
      <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
        Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu của bạn không thay đổi.
      </p>
    `),
    text: [
      `Xin chào ${params.fullName.trim()},`,
      '',
      'Mã đặt lại mật khẩu GymMaster Pro của bạn là:',
      '',
      `    ${params.code}`,
      '',
      `Mã có hiệu lực trong ${params.expiresInMinutes} phút.`,
      '',
      'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    ].join('\n'),
  };
}
/**
 * Email gửi mã xác minh 6 số cho bước đăng ký hội viên.
 * Mã hiển thị dạng khối lớn để đọc không bị nhầm số 0 / O, 1 / l.
 */
export function memberVerificationCodeEmail(params: {
  fullName: string;
  code: string;
  expiresInMinutes: number;
}): VerificationCodeEmail {
  const fullName = escapeHtml(params.fullName.trim());
  const code = escapeHtml(params.code);

  return {
    // Subject KHÔNG được chứa mã: MailService ghi subject ra log backend —
    // nếu để mã trong subject thì bất kỳ ai đọc được log cũng lấy được OTP.
    subject: 'Mã xác minh tài khoản GymMaster Pro',
    html: layout(`
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Xin chào ${fullName},
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        Cảm ơn bạn đã đăng ký tài khoản hội viên tại <strong style="color:${BRAND.chalk};">GymMaster Pro</strong>.
        Nhập mã xác minh dưới đây vào trang đăng ký để hoàn tất tạo tài khoản.
      </p>
      <div style="margin:24px 0;padding:22px 20px;background:${BRAND.ink};border:1px solid ${BRAND.neon};border-radius:14px;text-align:center;">
        <div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:700;letter-spacing:14px;color:${BRAND.neon};text-indent:14px;">
          ${code}
        </div>
      </div>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:${BRAND.chalk};">
        ⏱ Mã có hiệu lực trong <strong style="color:${BRAND.neon};">${params.expiresInMinutes} phút</strong>.
      </p>
      <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
        Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này — tài khoản sẽ không được tạo.
      </p>
    `),
    text: [
      `Xin chào ${params.fullName.trim()},`,
      '',
      'Mã xác minh đăng ký tài khoản GymMaster Pro của bạn là:',
      '',
      `    ${params.code}`,
      '',
      `Mã có hiệu lực trong ${params.expiresInMinutes} phút. Nhập mã này vào trang đăng ký để hoàn tất tạo tài khoản.`,
      '',
      'Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.',
    ].join('\n'),
  };
}

// ===========================================================================
// NHÓM B — template cho email chạy nền (hóa đơn, thông báo, chào mừng...)
// ===========================================================================

/** Định dạng tiền VND: 1500000 → "1.500.000 ₫". */
function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

/** Định dạng ngày giờ Việt Nam: "15:30 02/11/2026". */
function formatDateTimeVi(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Định dạng ngày (không giờ): "02/11/2026". */
function formatDateVi(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Một dòng bảng thông tin (label trái, value phải) — dùng cho hóa đơn/thông báo. */
function kvRow(label: string, value: string, highlight = false): string {
  return `
    <tr>
      <td style="padding:10px 0;font-size:13px;line-height:1.6;color:${BRAND.muted};border-bottom:1px solid ${BRAND.line};">${label}</td>
      <td align="right" style="padding:10px 0;font-size:13px;line-height:1.6;border-bottom:1px solid ${BRAND.line};color:${highlight ? BRAND.neon : BRAND.chalk};font-weight:${highlight ? 700 : 400};">${value}</td>
    </tr>`;
}

/**
 * Email hóa đơn — gửi kèm file PDF đính kèm (do InvoicePdfService sinh ra).
 * Gửi sau khi thanh toán được xác nhận (chạy nền, best-effort).
 */
export function invoiceEmail(params: {
  fullName: string;
  invoiceNumber: string;
  packageName: string;
  amount: number;
  issuedAt: Date;
}): VerificationCodeEmail {
  const fullName = escapeHtml(params.fullName.trim());
  const invoiceNumber = escapeHtml(params.invoiceNumber);
  const packageName = escapeHtml(params.packageName);

  return {
    subject: `Hóa đơn ${params.invoiceNumber} — GymMaster Pro`,
    html: layout(`
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Hóa đơn thanh toán
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        Cảm ơn <strong style="color:${BRAND.chalk};">${fullName}</strong> — hóa đơn chi tiết
        được đính kèm file PDF trong email này.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
        ${kvRow('Số hóa đơn', invoiceNumber)}
        ${kvRow('Gói hội viên', packageName)}
        ${kvRow('Ngày phát hành', formatDateTimeVi(params.issuedAt))}
        ${kvRow('Tổng cộng', formatVnd(params.amount), true)}
      </table>
      <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
        Bạn cũng có thể xem và in hóa đơn bất kỳ lúc nào tại mục <strong style="color:${BRAND.chalk};">Thanh toán</strong> trong tài khoản.
      </p>
    `),
    text: [
      `Xin chào ${params.fullName.trim()},`,
      '',
      'Hóa đơn thanh toán GymMaster Pro (đính kèm PDF):',
      '',
      `    Số hóa đơn   : ${params.invoiceNumber}`,
      `    Gói hội viên  : ${params.packageName}`,
      `    Ngày phát hành: ${formatDateTimeVi(params.issuedAt)}`,
      `    Tổng cộng     : ${formatVnd(params.amount)}`,
      '',
      'Bạn cũng xem hóa đơn tại mục Thanh toán trong tài khoản.',
    ].join('\n'),
  };
}

/**
 * Email xác nhận thanh toán thành công (gửi kèm/gần hóa đơn PDF).
 * Khác invoiceEmail ở chỗ tập trung vào việc "đã nhận được tiền" + trạng thái.
 */
export function paymentConfirmedEmail(params: {
  fullName: string;
  invoiceNumber: string;
  packageName: string;
  amount: number;
  paidAt: Date;
  method: string;
}): VerificationCodeEmail {
  const fullName = escapeHtml(params.fullName.trim());
  const invoiceNumber = escapeHtml(params.invoiceNumber);
  const packageName = escapeHtml(params.packageName);
  const METHOD_LABELS: Record<string, string> = {
    CASH: 'Tiền mặt',
    BANK_TRANSFER: 'Chuyển khoản',
    MOMO: 'Ví MoMo',
    VNPAY: 'VNPay',
  };
  const method = escapeHtml(METHOD_LABELS[params.method] || params.method);

  return {
    subject: 'Thanh toán thành công — GymMaster Pro',
    html: layout(`
      <div style="margin:0 0 16px;padding:10px 16px;background:${BRAND.ink};border:1px solid ${BRAND.neon};border-radius:10px;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.neon};">
        ✓ Đã xác nhận
      </div>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Thanh toán thành công
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        Cảm ơn <strong style="color:${BRAND.chalk};">${fullName}</strong> — chúng tôi đã xác nhận
        khoản thanh toán của bạn cho gói <strong style="color:${BRAND.chalk};">${packageName}</strong>.
        Hội viên của bạn đã được kích hoạt/gia hạn.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
        ${kvRow('Mã hóa đơn', invoiceNumber)}
        ${kvRow('Số tiền', formatVnd(params.amount), true)}
        ${kvRow('Phương thức', method)}
        ${kvRow('Thời gian', formatDateTimeVi(params.paidAt))}
      </table>
      <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
        Hóa đơn chi tiết (PDF) được gửi kèm email này / trong mục <strong style="color:${BRAND.chalk};">Thanh toán</strong>.
      </p>
    `),
    text: [
      `Xin chào ${params.fullName.trim()},`,
      '',
      'Thanh toán GymMaster Pro đã được xác nhận:',
      '',
      `    Mã hóa đơn : ${params.invoiceNumber}`,
      `    Gói hội viên : ${params.packageName}`,
      `    Số tiền      : ${formatVnd(params.amount)}`,
      `    Phương thức  : ${METHOD_LABELS[params.method] || params.method}`,
      `    Thời gian   : ${formatDateTimeVi(params.paidAt)}`,
    ].join('\n'),
  };
}

/**
 * Email cảnh báo gói hội viên sắp hết hạn (≤7 ngày).
 * Nhắc gia hạn kèm ngày hết hạn để hội viên không bị gián đoạn tập luyện.
 */
export function membershipExpiringEmail(params: {
  fullName: string;
  packageName: string;
  expiresAt: Date;
  daysLeft: number;
}): VerificationCodeEmail {
  const fullName = escapeHtml(params.fullName.trim());
  const packageName = escapeHtml(params.packageName);

  return {
    subject: `Gói hội viên sắp hết hạn (${params.daysLeft} ngày) — GymMaster Pro`,
    html: layout(`
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Gói hội viên sắp hết hạn
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        Chào <strong style="color:${BRAND.chalk};">${fullName}</strong> — gói
        <strong style="color:${BRAND.chalk};">${packageName}</strong> của bạn sẽ hết hạn sau
        <strong style="color:${BRAND.neon};">${params.daysLeft} ngày</strong>. Gia hạn để không bị gián đoạn tập luyện.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
        ${kvRow('Gói hội viên', packageName)}
        ${kvRow('Ngày hết hạn', formatDateVi(params.expiresAt))}
        ${kvRow('Còn lại', `${params.daysLeft} ngày`, true)}
      </table>
      <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
        Đăng nhập và chọn <strong style="color:${BRAND.chalk};">Gia hạn gói</strong> trong mục Hội viên để tiếp tục tập luyện.
      </p>
    `),
    text: [
      `Chào ${params.fullName.trim()},`,
      '',
      `Gói ${params.packageName} của bạn sắp hết hạn:`,
      '',
      `    Ngày hết hạn : ${formatDateVi(params.expiresAt)}`,
      `    Còn lại      : ${params.daysLeft} ngày`,
      '',
      'Gia hạn trong mục Hội viên để không bị gián đoạn tập luyện.',
    ].join('\n'),
  };
}

/**
 * Email chào mừng sau khi đăng ký hội viên thành công (sau khi đã xác minh OTP).
 * Không kèm dữ liệu nhạy cảm — chỉ mã hội viên + lời chào.
 */
export function welcomeEmail(params: {
  fullName: string;
  memberCode: string;
}): VerificationCodeEmail {
  const fullName = escapeHtml(params.fullName.trim());
  const memberCode = escapeHtml(params.memberCode);

  return {
    subject: 'Chào mừng bạn đến với GymMaster Pro',
    html: layout(`
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Chào mừng ${fullName}! 🎉
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        Tài khoản hội viên của bạn đã được tạo thành công. Dưới đây là mã hội viên — dùng khi
        tiếp nhận tại lễ tân hoặc liên hệ bộ phận hỗ trợ.
      </p>
      <div style="margin:24px 0;padding:22px 20px;background:${BRAND.ink};border:1px solid ${BRAND.neon};border-radius:14px;text-align:center;">
        <div style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;letter-spacing:6px;color:${BRAND.neon};text-indent:6px;">
          ${memberCode}
        </div>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
        Chọn gói hội viên phù hợp và đăng ký buổi tập đầu tiên ngay trong tài khoản nhé!
      </p>
    `),
    text: [
      `Chào mừng ${params.fullName.trim()} đến với GymMaster Pro!`,
      '',
      `Mã hội viên của bạn: ${params.memberCode}`,
      '',
      'Chọn gói hội viên và đăng ký buổi tập đầu tiên ngay trong tài khoản.',
    ].join('\n'),
  };
}

/**
 * Email xác nhận đăng ký buổi tập thành công (lớp nhóm / kèm riêng PT).
 * Gửi nền ngay sau khi booking được tạo — kèm thời gian + phòng + HLV.
 */
export function bookingConfirmedEmail(params: {
  fullName: string;
  title: string;
  startTime: Date;
  endTime: Date;
  roomName?: string | null;
  trainerName?: string | null;
}): VerificationCodeEmail {
  const fullName = escapeHtml(params.fullName.trim());
  const title = escapeHtml(params.title);
  const roomName = params.roomName ? escapeHtml(params.roomName) : 'Chưa xếp phòng';
  const trainerName = params.trainerName ? escapeHtml(params.trainerName) : 'Chưa phân công';

  return {
    subject: `Đã xác nhận đăng ký buổi tập: ${params.title} — GymMaster Pro`,
    html: layout(`
      <div style="margin:0 0 16px;padding:10px 16px;background:${BRAND.ink};border:1px solid ${BRAND.neon};border-radius:10px;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.neon};">
        ✓ Đã xếp lịch
      </div>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${BRAND.chalk};">
        Đăng ký buổi tập thành công
      </h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
        Chào <strong style="color:${BRAND.chalk};">${fullName}</strong> — bạn đã đăng ký
        <strong style="color:${BRAND.chalk};">${title}</strong> thành công. Có mặt trước giờ tập 10 phút nhé!
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
        ${kvRow('Buổi tập', title)}
        ${kvRow('Thời gian', `${formatDateTimeVi(params.startTime)} – ${formatDateTimeVi(params.endTime)}`)}
        ${kvRow('Phòng tập', roomName)}
        ${kvRow('Huấn luyện viên', trainerName)}
      </table>
      <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
        Bạn có thể xem lại lịch trong mục <strong style="color:${BRAND.chalk};">Lịch tập</strong> của tài khoản.
      </p>
    `),
    text: [
      `Chào ${params.fullName.trim()},`,
      '',
      `Bạn đã đăng ký buổi tập "${params.title}" thành công:`,
      '',
      `    Thời gian : ${formatDateTimeVi(params.startTime)} – ${formatDateTimeVi(params.endTime)}`,
      `    Phòng tập : ${params.roomName || 'Chưa xếp phòng'}`,
      `    HLV       : ${params.trainerName || 'Chưa phân công'}`,
      '',
      'Có mặt trước giờ tập 10 phút. Xem lại trong mục Lịch tập.',
    ].join('\n'),
  };
}
