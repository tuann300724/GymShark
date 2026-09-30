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
function layout(content: string): string {
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
                Nếu bạn không yêu cầu đăng ký tài khoản này, hãy bỏ qua email và không cần làm gì.
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
    subject: `${params.code} là mã xác minh đăng ký tài khoản GymMaster Pro`,
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
