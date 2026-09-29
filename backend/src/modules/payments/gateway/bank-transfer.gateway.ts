import { Injectable } from '@nestjs/common';
import { BANK_INFO } from '../bank-info';
import {
  GatewayCreateOrderInput,
  GatewayCreateOrderResult,
  GatewayMethod,
  PaymentGateway,
} from './payment-gateway.interface';

/**
 * Chuyển khoản ngân hàng — member tự chuyển khoản theo nội dung
 * `GYM {MEMBER_CODE} {PAYMENT_CODE}`, lễ tân đối soát sao kê rồi xác nhận PAID.
 * KHÔNG tự động đánh dấu PAID khi member chọn BANK_TRANSFER.
 */
@Injectable()
export class BankTransferGateway implements PaymentGateway {
  readonly method: GatewayMethod = 'BANK_TRANSFER';
  readonly manualConfirmation = true;
  readonly integrated = true;

  createOrder(input: GatewayCreateOrderInput): GatewayCreateOrderResult {
    return {
      requiresRedirect: false,
      instructions: [
        `Chuyển khoản tới ${BANK_INFO.bankName}`,
        `Số tài khoản: ${BANK_INFO.accountNumber} - ${BANK_INFO.accountName}`,
        `Nội dung chuyển khoản: GYM ${input.memberCode} ${input.code}`,
        'Sau khi chuyển, mang sao kê/hóa đơn lên quầy để lễ tân xác nhận.',
      ].join(' | '),
    };
  }
}