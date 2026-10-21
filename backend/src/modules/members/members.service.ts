import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuditService } from "../audit-logs/audit-logs.service";
import { MemberService } from "../member/member.service";
import { PaymentsService } from "../payments/payments.service";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { CreateMemberDto } from "./dto/create-member.dto";
import { RegisterCardDto } from "./dto/register-card.dto";
import {
  MembersRepository,
  MemberListRow,
  MembershipRow,
} from "./repository/members.repository";
import { MEMBERS_REPOSITORY } from "./repository/members.tokens";

export interface MemberListQuery {
  search?: string;
  status?: string;
  membershipStatus?: string;
  packageId?: string;
  branchId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface StaffActor {
  id: string;
  role: string;
  branchId?: string | null;
}

/** Phương thức lễ tân có thể xác nhận thủ công tại quầy */
const MANUAL_PAYMENT_METHODS: string[] = ["CASH", "BANK_TRANSFER"];

@Injectable()
export class MembersService {
  constructor(
    @Inject(MEMBERS_REPOSITORY) private readonly repo: MembersRepository,
    private readonly auditService: AuditService,
    private readonly memberService: MemberService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /** Chuyển row phẳng từ SP sang shape nested (branch/user/memberships) khớp Prisma include. */
  private toMemberShape(row: MemberListRow, memberships: MembershipRow[]) {
    return {
      id: row.id,
      code: row.code,
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      gender: row.gender,
      dateOfBirth: row.dateOfBirth,
      address: row.address,
      avatarUrl: row.avatarUrl,
      status: row.status,
      notes: row.notes,
      emergencyContact: row.emergencyContact,
      joinedAt: row.joinedAt,
      branchId: row.branchId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      branch: row.branch_id
        ? { id: row.branch_id, name: row.branch_name, code: row.branch_code }
        : null,
      user: row.user_id
        ? { id: row.user_id, email: row.user_email, status: row.user_status }
        : null,
      memberships: memberships.map((m) => ({
        id: m.id,
        memberId: m.memberId,
        packageId: m.packageId,
        startDate: m.startDate,
        endDate: m.endDate,
        price: Number(m.price),
        discountAmount:
          m.discountAmount != null ? Number(m.discountAmount) : null,
        finalAmount: m.finalAmount != null ? Number(m.finalAmount) : null,
        remainingSessions: m.remainingSessions,
        status: m.status,
        createdAt: m.createdAt,
        package: m.package_id
          ? {
              id: m.package_id,
              name: m.package_name,
              durationDays: m.package_durationDays,
            }
          : null,
      })),
    };
  }

  /**
   * Danh sách hội viên với tìm kiếm, lọc, sắp xếp, phân trang.
   * Trả về { data, total, page, limit }.
   */
  async findAll(query: MemberListQuery = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const status = query.status && query.status !== "ALL" ? query.status : null;
    const branchId =
      query.branchId && query.branchId !== "ALL" ? query.branchId : null;
    const membershipStatus =
      query.membershipStatus && query.membershipStatus !== "ALL"
        ? query.membershipStatus
        : null;
    const packageId =
      query.packageId && query.packageId !== "ALL" ? query.packageId : null;
    const search = query.search ? query.search.trim() : null;

    let sortField = "createdAt";
    let sortDir = "desc";
    if (query.sort) {
      sortDir = query.sort.startsWith("-") ? "desc" : "asc";
      const field = query.sort.replace(/^-/, "");
      if (["name", "code", "joinedAt", "createdAt"].includes(field))
        sortField = field;
    }

    const filter = { search, status, branchId, membershipStatus, packageId };

    const [rows, total] = await Promise.all([
      this.repo.list({ page, limit, ...filter, sortField, sortDir }),
      this.repo.count(filter),
    ]);

    // Gộp membership top-3 mỗi hội viên
    const membershipsByMember = new Map<string, MembershipRow[]>();
    await Promise.all(
      rows.map(async (r) => {
        const ms = await this.repo.memberships(r.id, 3);
        membershipsByMember.set(r.id, ms);
      }),
    );

    const data = rows.map((r) =>
      this.toMemberShape(r, membershipsByMember.get(r.id) ?? []),
    );

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException("Không tìm thấy hội viên");

    const [memberships, payments, checkIns, schedules, stats] =
      await Promise.all([
        this.repo.memberships(id, 100),
        this.repo.payments(id, 50),
        this.repo.checkIns(id, 30),
        this.repo.schedules(id, 20),
        this.repo.attendanceStats(id),
      ]);

    const done = Number(stats.doneCount ?? 0);
    const totalMinutes = Number(stats.totalMinutes ?? 0);
    const avgDuration = done > 0 ? Math.round(totalMinutes / done) : 0;

    return {
      id: row.id,
      code: row.code,
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      gender: row.gender,
      dateOfBirth: row.dateOfBirth,
      address: row.address,
      avatarUrl: row.avatarUrl,
      status: row.status,
      notes: row.notes,
      emergencyContact: row.emergencyContact,
      joinedAt: row.joinedAt,
      branchId: row.branchId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      branch: row.branch_id
        ? {
            id: row.branch_id,
            code: row.branch_code,
            name: row.branch_name,
            address: (row as any).branch_address,
            phone: (row as any).branch_phone,
            email: (row as any).branch_email,
            description: (row as any).branch_description,
            openingTime: (row as any).branch_openingTime,
            closingTime: (row as any).branch_closingTime,
            openingHours: (row as any).branch_openingHours,
            status: (row as any).branch_status,
            createdAt: (row as any).branch_createdAt,
            updatedAt: (row as any).branch_updatedAt,
          }
        : null,
      user: row.user_id
        ? {
            id: row.user_id,
            email: row.user_email,
            role: (row as any).user_role,
            status: (row as any).user_status,
            avatarUrl: (row as any).user_avatarUrl,
          }
        : null,
      memberships: memberships.map((m) => ({
        id: m.id,
        memberId: m.memberId,
        packageId: m.packageId,
        startDate: m.startDate,
        endDate: m.endDate,
        price: Number(m.price),
        discountAmount:
          m.discountAmount != null ? Number(m.discountAmount) : null,
        finalAmount: m.finalAmount != null ? Number(m.finalAmount) : null,
        remainingSessions: m.remainingSessions,
        status: m.status,
        createdAt: m.createdAt,
        updatedAt: (m as any).updatedAt,
        package: m.package_id
          ? {
              id: m.package_id,
              code: m.package_code,
              name: m.package_name,
              description: (m as any).package_description,
              durationDays: m.package_durationDays,
              price:
                (m as any).package_price != null
                  ? Number((m as any).package_price)
                  : null,
              sessions: (m as any).package_sessions,
              type: (m as any).package_type,
              status: (m as any).package_status,
              features: (m as any).package_features,
              allowedBranches: (m as any).package_allowedBranches,
            }
          : null,
        payments: [] as unknown[],
      })),
      payments,
      checkIns,
      schedules: schedules.map((s: any) => ({
        id: s.id,
        title: s.title,
        trainerId: s.trainerId,
        memberId: s.memberId,
        branchId: s.branchId,
        roomId: s.roomId,
        type: s.type,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        description: s.description,
        notes: s.notes,
        cancellationNote: s.cancellationNote,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        trainer: s.trainer_id
          ? {
              id: s.trainer_id,
              specialization: s.trainer_specialization,
              rating: s.trainer_rating,
              user: s.trainerUser_id
                ? {
                    id: s.trainerUser_id,
                    fullName: s.trainerUser_fullName,
                    email: s.trainerUser_email,
                    phone: s.trainerUser_phone,
                    avatarUrl: s.trainerUser_avatarUrl,
                  }
                : null,
            }
          : null,
        room: s.room_id
          ? { id: s.room_id, name: s.room_name, code: s.room_code }
          : null,
      })),
      attendanceStats: {
        totalVisits: Number(stats.totalVisits ?? 0),
        lastVisit: stats.lastVisit ?? null,
        avgDuration,
      },
    };
  }

  /** Admin cập nhật hồ sơ / trạng thái hội viên */
  async update(id: string, dto: UpdateMemberDto, actorId?: string) {
    const member = await this.repo.findById(id);
    if (!member) throw new NotFoundException("Không tìm thấy hội viên");

    const fields: string[] = [];
    const input: {
      fullName?: string;
      phone?: string;
      email?: string;
      gender?: string;
      dateOfBirth?: Date;
      address?: string;
      emergencyContact?: string;
      notes?: string;
      status?: string;
    } = {};

    if (dto.fullName !== undefined)
      ((input.fullName = dto.fullName), fields.push("fullName"));
    if (dto.phone !== undefined)
      ((input.phone = dto.phone), fields.push("phone"));
    if (dto.email !== undefined)
      ((input.email = dto.email.trim().toLowerCase()), fields.push("email"));
    if (dto.gender !== undefined)
      ((input.gender = dto.gender), fields.push("gender"));
    if (dto.dateOfBirth !== undefined)
      ((input.dateOfBirth = new Date(dto.dateOfBirth)),
        fields.push("dateOfBirth"));
    if (dto.address !== undefined)
      ((input.address = dto.address), fields.push("address"));
    if (dto.emergencyContact !== undefined)
      ((input.emergencyContact = dto.emergencyContact),
        fields.push("emergencyContact"));
    if (dto.notes !== undefined)
      ((input.notes = dto.notes), fields.push("notes"));
    if (dto.status !== undefined)
      ((input.status = dto.status), fields.push("status"));

    if (fields.length === 0) {
      throw new BadRequestException("Không có dữ liệu nào để cập nhật");
    }

    // Email là danh tính đăng nhập — chặn email đã thuộc tài khoản khác
    if (dto.email !== undefined && member.userId) {
      const owner = await this.repo.findByEmail(input.email as string);
      if (owner && owner.id !== member.userId) {
        throw new ConflictException(
          "Email này đã được sử dụng cho tài khoản khác",
        );
      }
    }

    // Đồng bộ trạng thái tài khoản đăng nhập
    const userStatusMap: Record<string, string | undefined> = {
      ACTIVE: "ACTIVE",
      INACTIVE: "INACTIVE",
      SUSPENDED: "SUSPENDED",
      EXPIRED: undefined,
    };

    const updated = await this.repo.update(id, input);

    if (dto.status && member.userId) {
      const userStatus = userStatusMap[dto.status];
      if (userStatus) {
        await this.repo.updateUserStatusEmail(member.userId, {
          status: userStatus,
          email: dto.email !== undefined ? (input.email as string) : undefined,
          setEmail: dto.email !== undefined,
        });
      }
      await this.notifyStatus(member.id, member.fullName, dto.status);
    } else if (dto.email !== undefined && member.userId) {
      await this.repo.updateUserStatusEmail(member.userId, {
        email: input.email as string,
        setEmail: true,
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: "MEMBER_UPDATE",
      entity: "Member",
      entityId: id,
      metadata: {
        fields,
        status: dto.status ?? null,
        statusChanged: !!dto.status,
      },
    });

    return { message: "Cập nhật hội viên thành công", member: updated };
  }

  private async notifyStatus(
    memberId: string,
    fullName: string,
    status: string,
  ) {
    const title =
      status === "SUSPENDED"
        ? "Tài khoản của bạn đã bị tạm khóa ⛔"
        : status === "INACTIVE"
          ? "Tài khoản của bạn đã bị vô hiệu hóa ⛔"
          : "Tài khoản của bạn đã được kích hoạt ✅";

    const content =
      status === "SUSPENDED"
        ? `Hội viên ${fullName}: thẻ tập đã bị tạm khóa bởi quản trị viên. Liên hệ lễ tân để biết thêm chi tiết.`
        : status === "INACTIVE"
          ? `Hội viên ${fullName}: tài khoản đã bị vô hiệu hóa. Liên hệ lễ tân để biết thêm chi tiết.`
          : `Chào mừng trở lại ${fullName}! Tài khoản của bạn đã được kích hoạt lại.`;

    await this.repo.createNotification({
      memberId,
      title,
      content,
      type: "SYSTEM",
      link: "/member",
    });
  }

  /** Lịch sử HLV phụ trách của hội viên */
  async getTrainers(memberId: string) {
    const member = await this.repo.findById(memberId);
    if (!member) throw new NotFoundException("Không tìm thấy hội viên");

    const rows = await this.repo.getTrainers(memberId);
    return rows.map((r: any) => ({
      id: r.id,
      trainerId: r.trainerId,
      memberId: r.memberId,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      note: r.note,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      trainer: r.trainer_id
        ? {
            id: r.trainer_id,
            specialization: r.trainer_specialization,
            rating: r.trainer_rating,
            experienceYears: r.trainer_experienceYears,
            hourlyRate: r.trainer_hourlyRate,
            status: r.trainer_status,
            user: r.user_id
              ? {
                  id: r.user_id,
                  fullName: r.user_fullName,
                  phone: r.user_phone,
                  avatarUrl: r.user_avatarUrl,
                  email: r.user_email,
                }
              : null,
          }
        : null,
    }));
  }

  // ---------------------------------------------------------------------------
  // Đăng ký hội viên mới tại quầy
  // ---------------------------------------------------------------------------

  async create(dto: CreateMemberDto, actor: StaffActor) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const phone = dto.phone.trim();

    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email này đã được sử dụng");
    }

    const phoneOwner = await this.repo.findUserByPhone(phone);
    if (phoneOwner) {
      throw new ConflictException(
        `Số điện thoại này đã được dùng cho tài khoản "${phoneOwner.fullName}". Mỗi số điện thoại chỉ được đăng ký 1 hội viên.`,
      );
    }

    const branchId = await this.resolveBranchId(dto.branchId, actor.branchId);

    const typedPassword = dto.password?.trim() || "";
    const isTempPassword = !typedPassword;
    const rawPassword = isTempPassword ? this.genTempPassword() : typedPassword;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const memberCode = await this.genMemberCode();

    const { userId, memberId } = await this.repo.createWithUser({
      email,
      passwordHash,
      fullName,
      phone,
      branchId,
      code: memberCode,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      address: dto.address?.trim() || null,
      emergencyContact: dto.emergencyContact?.trim() || null,
    });

    const createdMember = await this.repo.findById(memberId);
    void createdMember;

    await this.auditService.log({
      userId: actor.id,
      action: "MEMBER_CREATE",
      entity: "Member",
      entityId: memberId,
      metadata: {
        memberCode,
        fullName,
        email,
        phone,
        branchId,
        via: "staff",
        tempPassword: isTempPassword,
      },
    });

    return {
      message: "Đã tạo hội viên mới",
      member: {
        id: memberId,
        code: memberCode,
        fullName,
        email,
        phone,
        status: "ACTIVE",
        branchId,
      },
      user: { id: userId, email, fullName, status: "ACTIVE" },
      ...(isTempPassword ? { tempPassword: rawPassword } : {}),
    };
  }

  /**
   * Lễ tân tạo thẻ tập cho hội viên tại quầy.
   * - payNow = false → Membership PENDING + Payment PENDING + hoá đơn ISSUED
   * - payNow = true  → thu tiền ngay và kích hoạt thẻ
   */
  async registerCard(
    memberId: string,
    dto: RegisterCardDto,
    actor: StaffActor,
  ) {
    const member = await this.repo.findById(memberId);
    if (!member) throw new NotFoundException("Không tìm thấy hội viên");

    const method = dto.paymentMethod ?? "CASH";

    if (dto.payNow && !MANUAL_PAYMENT_METHODS.includes(method)) {
      throw new BadRequestException(
        'Thu tiền tại quầy chỉ áp dụng cho Tiền mặt hoặc Chuyển khoản. Với ví điện tử, hãy chọn "Chờ xác nhận thanh toán".',
      );
    }

    const created = await this.memberService.registerMembershipForMember(
      memberId,
      {
        packageId: dto.packageId,
        paymentMethod: method,
        promotionCode: dto.promotionCode,
        notes: dto.notes,
      },
      actor.id,
    );

    const memberRef = {
      id: member.id,
      code: member.code,
      fullName: member.fullName,
    };

    if (!dto.payNow) {
      return {
        message: "Đã tạo thẻ — chờ xác nhận thanh toán",
        activated: false,
        member: memberRef,
        membership: created.membership,
        payment: created.payment,
      };
    }

    const confirmed = await this.paymentsService.confirm(
      created.payment.id,
      { id: actor.id, role: actor.role },
      { transactionRef: dto.transactionRef },
    );

    return {
      message: "Đã thu tiền và kích hoạt thẻ",
      activated: true,
      member: memberRef,
      membership: confirmed.membership ?? created.membership,
      payment: confirmed.payment,
    };
  }

  /** Sinh mã hội viên dạng MEM-0001, bỏ qua mã đã tồn tại */
  private async genMemberCode(): Promise<string> {
    const count = await this.repo.countAll();
    for (let i = 1; i <= 500; i++) {
      const code = `MEM-${String(count + i).padStart(4, "0")}`;
      const exists = await this.repo.findByCode(code);
      if (!exists) return code;
    }
    return `MEM-${Date.now().toString().slice(-8)}`;
  }

  private genTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 8; i++)
      out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  /** Ưu tiên: chi nhánh được chọn → chi nhánh nhân viên → chi nhánh ACTIVE đầu tiên */
  private async resolveBranchId(
    requested?: string,
    actorBranchId?: string | null,
  ): Promise<string> {
    const candidate = requested || actorBranchId || null;
    if (candidate) {
      const branch = await this.repo.findBranchById(candidate);
      if (!branch) throw new BadRequestException("Chi nhánh không tồn tại");
      if (branch.status !== "ACTIVE")
        throw new BadRequestException("Chi nhánh đã ngừng hoạt động");
      return branch.id;
    }
    const fallback = await this.repo.findActiveBranch();
    if (!fallback)
      throw new BadRequestException("Hệ thống chưa có chi nhánh hoạt động");
    return fallback.id;
  }
}
