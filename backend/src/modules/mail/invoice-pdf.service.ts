import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'node:fs';

/** Thông tin cần có để render hóa đơn PDF. */
export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt: Date;
  memberName: string;
  memberCode: string;
  email: string;
  packageName: string;
  durationLabel: string;
  amount: number;
  method: string;
  paidAt?: Date | null;
  note?: string | null;
}

/**
 * InvoicePdfService — sinh file hóa đơn PDF từ dữ liệu hóa đơn.
 *
 * Dùng pdfkit (pure JS, không cần Chrome/Puppeteer). Font Helvetica mặc định
 * của PDF KHÔNG hỗ trợ dấu tiếng Việt → bắt buộc load font Unicode của hệ
 * thống (Arial/DejaVu); nếu không tìm thấy thì hạ cấp Helvetica và cảnh báo
 * trong log (dấu tiếng Việt có thể hiển thị sai).
 */
@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger('InvoicePdfService');

  /** Font thường + font đậm (tiếng Việt) — resolve 1 lần lúc khởi động. */
  private readonly fontRegular: string | null;
  private readonly fontBold: string | null;

  constructor() {
    const regular = this.resolveFont(false);
    const bold = this.resolveFont(true);
    this.fontRegular = regular;
    this.fontBold = bold ?? regular;
    if (!regular) {
      this.logger.warn(
        'Không tìm thấy font Unicode hỗ trợ tiếng Việt — hóa đơn PDF sẽ dùng Helvetica và dấu tiếng Việt có thể hiển thị sai.',
      );
    }
  }

  /** Sinh buffer PDF cho một hóa đơn. */
  async generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 48 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        this.drawHeader(doc, data);
        this.drawInfo(doc, data);
        this.drawAmount(doc, data);
        this.drawFooter(doc, data);

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Thiết kế PDF — tông in ấn: dải header tối (brand), thân giấy trắng để
  // tiết kiệm mực khi in, accent neon chỉ dùng cho số tiền tổng cộng.
  // -------------------------------------------------------------------------

  private drawHeader(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Dải header tối full-width
    doc.rect(doc.page.margins.left, doc.page.margins.top - 24, pageWidth, 64).fill('#0B0D0F');

    // Tên thương hiệu
    doc.font(this.fontBold ?? 'Helvetica-Bold').fontSize(20).fillColor('#F5F5F5');
    doc.text('GYM', doc.page.margins.left + 20, doc.page.margins.top - 10, { continued: true })
      .fillColor('#B7FF00').text('MASTER')
      .fillColor('#F5F5F5').text(' PRO', { lineBreak: false });

    // Nhãn hóa đơn (phải)
    doc.font(this.fontBold ?? 'Helvetica-Bold').fontSize(14).fillColor('#B7FF00');
    doc.text('HÓA ĐƠN THANH TOÁN', doc.page.margins.left, doc.page.margins.top - 14, {
      width: pageWidth - 40,
      align: 'right',
    });

    // Số hóa đơn
    doc.font(this.fontRegular ?? 'Helvetica').fontSize(10).fillColor('#9AA0A6');
    doc.text(`Số: ${data.invoiceNumber}`, doc.page.margins.left, doc.page.margins.top + 22, {
      width: pageWidth - 40,
      align: 'right',
    });

    doc.y = doc.page.margins.top + 56;
  }

  private drawInfo(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
    const x = doc.page.margins.left;
    const y = doc.y + 8;

    doc.font(this.fontBold ?? 'Helvetica-Bold').fontSize(11).fillColor('#0B0D0F');
    doc.text('THÔNG TIN HỘI VIÊN', x, y);

    doc.font(this.fontRegular ?? 'Helvetica').fontSize(10).fillColor('#333333');
    const rows: Array<[string, string]> = [
      ['Họ và tên', data.memberName],
      ['Mã hội viên', data.memberCode],
      ['Email', data.email],
      ['Ngày phát hành', this.formatDate(data.issuedAt)],
    ];
    if (data.paidAt) rows.push(['Ngày thanh toán', this.formatDate(data.paidAt)]);

    let rowY = y + 22;
    for (const [label, value] of rows) {
      doc.fillColor('#777777').text(label, x, rowY, { width: 140 });
      doc.fillColor('#111111').text(value, x + 150, rowY, { width: 300 });
      rowY += 18;
    }

    doc.y = rowY + 10;
  }

  private drawAmount(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
    const x = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let y = doc.y + 6;

    doc.font(this.fontBold ?? 'Helvetica-Bold').fontSize(11).fillColor('#0B0D0F');
    doc.text('CHI TIẾT GÓI HỘI VIÊN', x, y);
    y += 22;

    doc.font(this.fontRegular ?? 'Helvetica').fontSize(10).fillColor('#333333');
    doc.text('Gói hội viên', x, y, { width: 140 });
    doc.fillColor('#111111').text(data.packageName, x + 150, y, { width: 300 });
    y += 18;
    doc.fillColor('#777777').text('Thời lượng', x, y, { width: 140 });
    doc.fillColor('#111111').text(data.durationLabel, x + 150, y, { width: 300 });
    y += 18;
    doc.fillColor('#777777').text('Phương thức', x, y, { width: 140 });
    doc.fillColor('#111111').text(data.method, x + 150, y, { width: 300 });
    y += 26;

    // Khung tổng cộng
    doc.rect(x, y, pageWidth, 36).fill('#0B0D0F');
    doc.font(this.fontBold ?? 'Helvetica-Bold').fontSize(13).fillColor('#F5F5F5');
    doc.text('TỔNG CỘNG', x + 16, y + 11, { lineBreak: false });
    doc.fillColor('#B7FF00').fontSize(15);
    doc.text(this.formatVnd(data.amount), x, y + 9, { width: pageWidth - 16, align: 'right' });

    doc.y = y + 50;
    if (data.note) {
      doc.font(this.fontRegular ?? 'Helvetica').fontSize(9).fillColor('#777777');
      doc.text(`Ghi chú: ${data.note}`, x, doc.y);
    }
  }

  private drawFooter(doc: PDFKit.PDFDocument, data: InvoicePdfData): void {
    const x = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const y = doc.page.height - doc.page.margins.bottom - 40;

    doc.moveTo(x, y).lineTo(x + pageWidth, y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();

    doc.font(this.fontRegular ?? 'Helvetica').fontSize(8).fillColor('#999999');
    doc.text(
      `Hóa đơn điện tử ${data.invoiceNumber} — phát hành bởi hệ thống GymMaster Pro. ` +
        'Đây là bản in máy tính, không cần đóng dấu.',
      x,
      y + 10,
      { width: pageWidth, align: 'center' },
    );
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private formatVnd(amount: number): string {
    return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  /**
   * Tìm font Unicode hỗ trợ tiếng Việt theo nền tảng. Trả null nếu không
   * thấy (MailService sẽ dùng Helvetica).
   */
  private resolveFont(bold: boolean): string | null {
    const candidates = bold
      ? [
          // Dự án (nếu có bundled font — không bắt buộc)
          'fonts/Roboto-Bold.ttf',
          // Windows
          'C:/Windows/Fonts/arialbd.ttf',
          'C:/Windows/Fonts/arial.ttf',
          // Linux
          '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
          // macOS
          '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
          '/Library/Fonts/Arial Bold.ttf',
        ]
      : [
          'fonts/Roboto-Regular.ttf',
          'C:/Windows/Fonts/arial.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
          '/System/Library/Fonts/Supplemental/Arial.ttf',
          '/Library/Fonts/Arial.ttf',
        ];

    for (const path of candidates) {
      try {
        if (fs.existsSync(path)) return path;
      } catch {
        // bỏ qua — thử candidate tiếp theo
      }
    }
    return null;
  }
}
