import { PaymentMethod } from '@prisma/client';

/**
 * Khai báo kiểu phương thức thanh toán được gateway hỗ trợ.
 * Ở bước này chỉ CASH / BANK_TRANSFER được xác nhận thủ công; MOMO / VNPAY
 * là nền tảng (architecture) sẵn sàng cho cổng thanh toán thật ở Step 7.
 */
export type GatewayMethod = Exclude<PaymentMethod, 'CREDIT_CARD'>;

export interface GatewayCreateOrderInput {
  paymentId: string;
  code: string;
  amount: number;
  currency: string;
  memberCode: string;
  memberName: string;
}

export interface GatewayCreateOrderResult {
  /** true = cổng tự động redirect/return URL; false = xác nhận thủ công tại quầy */
  requiresRedirect: boolean;
  redirectUrl?: string;
  /** Mã giao dịch bên ngoài nếu cổng thanh toán tự cấp */
  externalRef?: string;
  /** Hướng dẫn hiển thị cho hội viên (nội dung chuyển khoản, số tài khoản…) */
  instructions?: string;
}

/**
 * Trừu tượng hóa cổng thanh toán — không nhúng logic gateway trực tiếp vào
 * PaymentsService. Step sau implement: MomoPaymentGateway, VNPayPaymentGateway.
 */
export interface PaymentGateway {
  readonly method: GatewayMethod;
  /** true = ADMIN/MANAGER/STAFF đối soát & xác nhận thủ công (CASH, BANK_TRANSFER) */
  readonly manualConfirmation: boolean;
  /** false = cổng chưa được tích hợp thật, chỉ dựng nền tảng */
  readonly integrated: boolean;
  createOrder(
    input: GatewayCreateOrderInput,
  ): Promise<GatewayCreateOrderResult> | GatewayCreateOrderResult;
}