import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { EnrollFaceDto } from './dto/faces.dto';

export interface FaceMatchResult {
  memberId: string;
  memberCode: string;
  similarity: number;
}

/**
 * Dịch vụ sinh trắc học — đăng ký / rút lui / so khớp khuôn mặt.
 *
 * Nguyên tắc thiết kế:
 * - CHỈ lưu vector embedding (Float[]), KHÔNG lưu ảnh gốc → đúng Nghị định 13/2023
 *   (dữ liệu sinh trắc học = dữ liệu cá nhân nhạy cảm, không thể tái tạo ảnh gốc từ vector).
 * - So khớp bằng cosine similarity, ngưỡng lấy từ env (FACE_MATCH_THRESHOLD /
 *   FACE_MATCH_THRESHOLD_1N) để dễ hiệu chỉnh khi test với khuôn mặt thật.
 * - Service KHÔNG tự tạo check-in — trả về kết quả match, CheckinsService lo phần
 *   validate thẻ/chi nhánh + tạo lượt tập (tái dùng pipeline sẵn có).
 */
@Injectable()
export class FacesService {
  /** Ngưỡng cho hội viên tự quét (1:1) — nới lỏng hơn để giảm nhận nhầm "không phải tôi" */
  private readonly thresholdSelf: number;
  /** Ngưỡng cho lễ tân quét 1:N — CHẶT hơn vì chọn nhầm hội viên = ghi sai lượt tập */
  private readonly thresholdGlobal: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private auditService: AuditService,
  ) {
    this.thresholdSelf = this.readThreshold('FACE_MATCH_THRESHOLD', 0.6);
    this.thresholdGlobal = this.readThreshold('FACE_MATCH_THRESHOLD_1N', 0.7);
  }

  private readThreshold(key: string, fallback: number): number {
    const raw = Number(this.config.get<string>(key));
    return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : fallback;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Map user đang đăng nhập → hồ sơ Member (không tin memberId từ client) */
  private async resolveMemberByUserId(userId: string) {
    if (!userId) throw new ForbiddenException('Không xác định được tài khoản đăng nhập');
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true, code: true, fullName: true, status: true },
    });
    if (!member) {
      throw new ForbiddenException('Tài khoản này không gắn với hồ sơ hội viên.');
    }
    return member;
  }

  /**
   * Kiểm tra 1 vector khuôn mặt hợp lệ:
   * là mảng số, độ dài 64..2048 (mô hình embedding phổ biến 128/512/1024),
   * toàn bộ là số hữu hạn. Làm tròn 6 chữ số thập phân để gọn payload/lưu trữ.
   */
  private assertValidEmbedding(embedding: unknown, label = 'khuôn mặt'): number[] {
    if (!Array.isArray(embedding) || embedding.length < 64 || embedding.length > 2048) {
      throw new BadRequestException(`Dữ liệu ${label} không hợp lệ (thiếu vector khuôn mặt).`);
    }
    const values = embedding.map((v) => (typeof v === 'number' ? v : Number(v)));
    if (!values.every((v) => Number.isFinite(v))) {
      throw new BadRequestException(`Dữ liệu ${label} không hợp lệ (chứa giá trị không phải số).`);
    }
    return values.map((v) => Number(v.toFixed(6)));
  }

  /** Kiểm tra 1 mẫu vector đơn lẻ cho mục đích đăng ký */
  private sanitizeSample(embedding: unknown): number[] {
    return this.assertValidEmbedding(embedding, 'mẫu khuôn mặt');
  }

  /** Cosine similarity giữa 2 vector (khác độ dài hoặc vector rỗng = 0) */
  private cosine(a: number[], b: number[]): number {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      dot += x * y;
      na += x * x;
      nb += y * y;
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  // ---------------------------------------------------------------------------
  // Đăng ký / trạng thái / rút lui
  // ---------------------------------------------------------------------------

  /** GET /faces/me — trạng thái đăng ký của hội viên đang đăng nhập */
  async getMyStatus(userId: string) {
    const member = await this.resolveMemberByUserId(userId);
    const [sampleCount, latest] = await Promise.all([
      this.prisma.faceEmbedding.count({ where: { memberId: member.id } }),
      this.prisma.faceEmbedding.findFirst({
        where: { memberId: member.id },
        orderBy: { consentAt: 'desc' },
        select: { consentAt: true },
      }),
    ]);
    return {
      enrolled: sampleCount > 0,
      sampleCount,
      consentAt: latest?.consentAt ?? null,
    };
  }

  /** POST /faces/enroll — đăng ký (ghi đè toàn bộ mẫu cũ), yêu cầu đồng ý tường minh */
  async enroll(userId: string, dto: EnrollFaceDto) {
    const member = await this.resolveMemberByUserId(userId);

    // Validate + sanitize từng mẫu; tất cả mẫu phải cùng độ dài
    const samples = dto.embeddings.map((e) => this.sanitizeSample(e));
    const dim = samples[0].length;
    if (samples.some((s) => s.length !== dim)) {
      throw new BadRequestException('Tất cả mẫu khuôn mặt phải cùng độ dài vector.');
    }

    const consentAt = new Date();
    await this.prisma.$transaction([
      this.prisma.faceEmbedding.deleteMany({ where: { memberId: member.id } }),
      this.prisma.faceEmbedding.createMany({
        data: samples.map((embedding) => ({ memberId: member.id, embedding, consentAt })),
      }),
    ]);

    await this.auditService.log({
      userId,
      action: 'FACE_ENROLL',
      entity: 'Face',
      entityId: member.id,
      metadata: { memberCode: member.code, sampleCount: samples.length, dimensions: dim },
    });

    return {
      success: true,
      message: 'Đăng ký khuôn mặt thành công',
      data: { enrolled: true, sampleCount: samples.length, consentAt },
    };
  }

  /** DELETE /faces/enroll — hội viên rút lui đồng ý (xoá toàn bộ vector) */
  async withdraw(userId: string) {
    const member = await this.resolveMemberByUserId(userId);
    const count = await this.prisma.faceEmbedding.count({ where: { memberId: member.id } });
    if (count === 0) {
      throw new BadRequestException('Bạn chưa đăng ký khuôn mặt.');
    }

    await this.prisma.faceEmbedding.deleteMany({ where: { memberId: member.id } });

    await this.auditService.log({
      userId,
      action: 'FACE_DELETE',
      entity: 'Face',
      entityId: member.id,
      metadata: { memberCode: member.code, sampleCount: count, via: 'self' },
    });

    return {
      success: true,
      message: 'Đã xoá dữ liệu khuôn mặt của bạn',
      data: { enrolled: false, sampleCount: 0 },
    };
  }

  /** GET /faces/member/:memberId — admin/manager xem trạng thái đăng ký của 1 hội viên */
  async getMemberFace(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, code: true, fullName: true, status: true },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên.');

    const [sampleCount, latest] = await Promise.all([
      this.prisma.faceEmbedding.count({ where: { memberId } }),
      this.prisma.faceEmbedding.findFirst({
        where: { memberId },
        orderBy: { consentAt: 'desc' },
        select: { consentAt: true },
      }),
    ]);
    return {
      member,
      enrolled: sampleCount > 0,
      sampleCount,
      consentAt: latest?.consentAt ?? null,
    };
  }

  /** DELETE /faces/member/:memberId — admin/manager xoá đăng ký thay hội viên */
  async adminWithdraw(memberId: string, actorId?: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, code: true, fullName: true },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên.');

    const count = await this.prisma.faceEmbedding.count({ where: { memberId } });
    if (count === 0) {
      throw new BadRequestException('Hội viên này chưa đăng ký khuôn mặt.');
    }

    await this.prisma.faceEmbedding.deleteMany({ where: { memberId } });

    await this.auditService.log({
      userId: actorId,
      action: 'FACE_DELETE',
      entity: 'Face',
      entityId: memberId,
      metadata: { memberCode: member.code, sampleCount: count, via: 'admin' },
    });

    return {
      success: true,
      message: `Đã xoá dữ liệu khuôn mặt của ${member.fullName}`,
      data: { enrolled: false, sampleCount: 0 },
    };
  }

  // ---------------------------------------------------------------------------
  // So khớp (dùng bởi CheckinsService)
  // ---------------------------------------------------------------------------

  /**
   * 1:1 — so vector quét với toàn bộ mẫu ĐĂNG KÝ của chính hội viên đó.
   * Trả về similarity nếu đạt ngưỡng; null nếu chưa khớp.
   * Ném BadRequest nếu hội viên CHƯA đăng ký (để trả thông báo đúng nghĩa).
   */
  async matchForMember(
    memberId: string,
    embedding: unknown,
  ): Promise<{ similarity: number } | null> {
    const probe = this.assertValidEmbedding(embedding);
    const samples = await this.prisma.faceEmbedding.findMany({
      where: { memberId },
      select: { embedding: true },
    });
    if (samples.length === 0) {
      throw new BadRequestException(
        'Bạn chưa đăng ký khuôn mặt. Hãy đăng ký khuôn mặt trước khi quét check-in.',
      );
    }

    let best = -1;
    for (const sample of samples) {
      const sim = this.cosine(probe, sample.embedding);
      if (sim > best) best = sim;
    }
    return best >= this.thresholdSelf ? { similarity: best } : null;
  }

  /**
   * 1:N — quét toàn bộ mẫu của các hội viên đang ACTIVE, trả về người khớp nhất
   * nếu vượt ngưỡng chặt (FACE_MATCH_THRESHOLD_1N); null nếu không ai đạt.
   * Quy mô phòng gym (vài nghìn hội viên × vài mẫu) nên so mạng phẳng là đủ.
   */
  async matchGlobal(embedding: unknown): Promise<FaceMatchResult | null> {
    const probe = this.assertValidEmbedding(embedding);
    const rows = await this.prisma.faceEmbedding.findMany({
      where: { member: { status: 'ACTIVE' } },
      select: { memberId: true, embedding: true, member: { select: { code: true } } },
    });
    if (rows.length === 0) return null;

    let best: FaceMatchResult | null = null;
    for (const row of rows) {
      const sim = this.cosine(probe, row.embedding);
      if (sim >= this.thresholdGlobal && (!best || sim > best.similarity)) {
        best = { memberId: row.memberId, memberCode: row.member.code, similarity: sim };
      }
    }
    return best;
  }
}
