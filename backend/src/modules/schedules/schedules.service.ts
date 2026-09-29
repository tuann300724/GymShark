import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SessionType, TrainerStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import {
  CancelSessionDto,
  CreateProgressDto,
  CreateSessionDto,
  SessionQueryDto,
  UpdateProgressDto,
  UpdateSessionDto,
} from './dto/session.dto';

/** Các vai trò được quản lý lịch (create/edit/cancel/complete) */
const MANAGE_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];
/** Chỉ ADMIN/MANAGER mới được tạo lịch trong quá khứ */
const PAST_ALLOWED_ROLES = ['ADMIN', 'MANAGER'];

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async resolveMemberByUserId(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new ForbiddenException('Tài khoản này không gắn với hồ sơ hội viên.');
    return member;
  }

  private async resolveTrainerByUserId(userId: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
    if (!trainer) throw new ForbiddenException('Tài khoản này không gắn với hồ sơ huấn luyện viên.');
    return trainer;
  }

  private assertValidTime(start: Date, end: Date) {
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Thời gian buổi tập không hợp lệ.');
    }
    if (start >= end) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }
  }

  private async checkTrainerConflict(trainerId: string, start: Date, end: Date, excludeId?: string) {
    const conflict = await this.prisma.trainingSchedule.findFirst({
      where: {
        trainerId,
        status: 'SCHEDULED',
        id: excludeId ? { not: excludeId } : undefined,
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
      },
      select: { id: true, title: true, startTime: true, endTime: true },
    });
    if (conflict) {
      const fmt = (d: Date) => d.toLocaleString('vi-VN');
      throw new ConflictException(
        `Huấn luyện viên đã có buổi tập trùng thời gian (${fmt(conflict.startTime)} - ${fmt(conflict.endTime)} - ${conflict.title}).`,
      );
    }
  }

  private async checkMemberConflict(memberId: string, start: Date, end: Date, excludeId?: string) {
    const conflict = await this.prisma.trainingSchedule.findFirst({
      where: {
        memberId,
        status: 'SCHEDULED',
        id: excludeId ? { not: excludeId } : undefined,
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
      },
      select: { id: true, title: true, startTime: true, endTime: true },
    });
    if (conflict) {
      const fmt = (d: Date) => d.toLocaleString('vi-VN');
      throw new ConflictException(
        `Hội viên đã có buổi tập trùng thời gian (${fmt(conflict.startTime)} - ${fmt(conflict.endTime)} - ${conflict.title}).`,
      );
    }
  }

  /** STEP 7 — chặn trùng 2 buổi cùng phòng, cùng khung giờ */
  private async checkRoomConflict(roomId: string, start: Date, end: Date, excludeId?: string) {
    const conflict = await this.prisma.trainingSchedule.findFirst({
      where: {
        roomId,
        status: 'SCHEDULED',
        id: excludeId ? { not: excludeId } : undefined,
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
      },
      select: { id: true, title: true, startTime: true, endTime: true },
    });
    if (conflict) {
      const fmt = (d: Date) => d.toLocaleString('vi-VN');
      throw new ConflictException(
        `Phòng đã có buổi tập trùng thời gian (${fmt(conflict.startTime)} - ${fmt(conflict.endTime)} - ${conflict.title}).`,
      );
    }
  }

  /** STEP 7 — chi nhánh phải tồn tại + ACTIVE thì mới tạo buổi tập mới */
  private async validateBranchActive(branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh.');
    if (branch.status !== 'ACTIVE') {
      throw new BadRequestException('Chi nhánh đang ngừng hoạt động, không thể tạo buổi tập mới.');
    }
    return branch;
  }

  /** STEP 7 — phòng phải tồn tại, thuộc chi nhánh và ở trạng thái AVAILABLE */
  private async validateRoomAvailable(roomId: string, branchId?: string | null) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng tập.');
    if (branchId && room.branchId !== branchId) {
      throw new BadRequestException('Phòng được chọn không thuộc chi nhánh của buổi tập.');
    }
    if (room.status !== 'AVAILABLE') {
      throw new BadRequestException(
        'Phòng tập đang không ở trạng thái sẵn sàng (AVAILABLE), không thể đặt lịch.',
      );
    }
    return room;
  }

  /** STEP 7 — HLV thuộc chi nhánh khác thì không được lên lịch ở chi nhánh này */
  private assertTrainerBranch(trainerBranchId: string | null | undefined, branchId: string | null) {
    if (trainerBranchId && branchId && trainerBranchId !== branchId) {
      throw new BadRequestException(
        'Huấn luyện viên thuộc chi nhánh khác, không thể đặt lịch tại chi nhánh này.',
      );
    }
  }

  private validateStatusTransition(current: string, target: 'cancel' | 'complete') {
    if (current !== 'SCHEDULED') {
      const label = target === 'cancel' ? 'hủy' : 'hoàn thành';
      throw new BadRequestException(
        current === 'CANCELLED'
          ? `Buổi tập này đã bị hủy trước đó.`
          : current === 'COMPLETED'
            ? `Buổi tập này đã được hoàn thành trước đó.`
            : `Chỉ có thể ${label} buổi tập đang ở trạng thái chờ (SCHEDULED).`,
      );
    }
  }

  /** Kiểm tra HLV còn hoạt động + trả về để phục vụ tạo lịch */
  private async getEligibleTrainer(trainerId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
      include: { user: { select: { branchId: true, branch: { select: { id: true, name: true } } } } },
    });
    if (!trainer) throw new NotFoundException('Không tìm thấy huấn luyện viên.');
    if (trainer.status !== TrainerStatus.ACTIVE) {
      throw new BadRequestException('Huấn luyện viên đang không hoạt động, không thể đặt lịch mới.');
    }
    return trainer;
  }

  private async getEligibleMember(memberId?: string) {
    if (!memberId) return null;
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên.');
    if (member.status !== 'ACTIVE') {
      throw new BadRequestException('Hội viên đang không hoạt động, không thể đặt lịch.');
    }
    return member;
  }

  private async ensurePersonalAssignment(trainerId: string, memberId: string) {
    const assignment = await this.prisma.trainerMember.findFirst({
      where: { trainerId, memberId, status: 'ACTIVE' },
    });
    if (!assignment) {
      throw new BadRequestException(
        'Huấn luyện viên chưa được gán cho hội viên này. Hãy phân công HLV trước khi đặt buổi kèm riêng (PT).',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Backward-compatible GET /schedules (trang lịch cũ + public)
  // ---------------------------------------------------------------------------

  async findAll() {
    return this.prisma.trainingSchedule.findMany({
      include: {
        trainer: { include: { user: { select: { fullName: true, phone: true, avatarUrl: true } } } },
        member: { select: { id: true, code: true, fullName: true, phone: true } },
        room: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id },
      include: {
        trainer: { include: { user: true } },
        member: true,
        room: true,
        branch: true,
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi tập.');
    return session;
  }

  // ---------------------------------------------------------------------------
  // Query (admin / staff / trainer)
  // ---------------------------------------------------------------------------

  async findAllSessions(query: SessionQueryDto = {}, role?: string, userId?: string) {
    const { page = 1, limit = 100, search, from, to, trainerId, memberId, branchId, status, type } =
      query;
    const skip = (page - 1) * limit;

    const where: Prisma.TrainingScheduleWhereInput = {};

    // TRAINER chỉ xem được lịch của chính mình — backend enforce
    if (role === 'TRAINER' && userId) {
      const trainer = await this.resolveTrainerByUserId(userId);
      where.trainerId = trainer.id;
    } else if (trainerId) {
      where.trainerId = trainerId;
    }

    if (memberId) where.memberId = memberId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (type) where.type = type;

    if (from && to) {
      where.OR = [{ startTime: { lt: new Date(to) }, endTime: { gt: new Date(from) } }];
    } else if (from) {
      where.OR = [{ endTime: { gte: new Date(from) } }];
    } else if (to) {
      where.OR = [{ startTime: { lte: new Date(to) } }];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { member: { fullName: { contains: search, mode: 'insensitive' } } },
            { member: { code: { contains: search, mode: 'insensitive' } } },
            { trainer: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.trainingSchedule.findMany({
        where,
        include: this.sessionInclude(),
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.trainingSchedule.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  private sessionInclude() {
    return {
      trainer: {
        include: {
          user: {
            select: { id: true, fullName: true, phone: true, avatarUrl: true },
          },
        },
      },
      member: {
        select: { id: true, code: true, fullName: true, phone: true, avatarUrl: true },
      },
      branch: { select: { id: true, name: true } },
      room: { select: { id: true, name: true, capacity: true } },
    } satisfies Prisma.TrainingScheduleInclude;
  }

  async findOneSession(id: string, role?: string, userId?: string) {
    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id },
      include: {
        ...this.sessionInclude(),
        progressNotes: {
          include: {
            trainer: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi tập.');

    // Quyền xem: trainer chỉ xem của mình; member chỉ xem của mình
    if (role === 'TRAINER' && userId) {
      const trainer = await this.resolveTrainerByUserId(userId);
      if (session.trainerId !== trainer.id) {
        throw new ForbiddenException('Bạn không có quyền xem buổi tập của HLV khác.');
      }
    }
    if (role === 'MEMBER' && userId) {
      const member = await this.resolveMemberByUserId(userId);
      if (session.memberId !== member.id) {
        throw new ForbiddenException('Bạn chỉ được xem lịch tập của chính mình.');
      }
    }

    return session;
  }

  // ---------------------------------------------------------------------------
  // Create / Update / Cancel / Complete / Delete
  // ---------------------------------------------------------------------------

  async createSession(dto: CreateSessionDto, role: string, actorId?: string) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    this.assertValidTime(start, end);

    // Chỉ ADMIN/MANAGER mới được tạo lịch trong quá khứ
    if (start < new Date() && !PAST_ALLOWED_ROLES.includes(role)) {
      throw new BadRequestException('Không thể tạo lịch trong quá khứ. Chỉ Admin/Quản lý có quyền này.');
    }

    const trainer = await this.getEligibleTrainer(dto.trainerId);
    const member = await this.getEligibleMember(dto.memberId);

    const type = dto.type ?? SessionType.PERSONAL_TRAINING;
    if (type === SessionType.PERSONAL_TRAINING) {
      if (!member) {
        throw new BadRequestException('Buổi tập kèm riêng (PT) bắt buộc phải chọn hội viên.');
      }
      await this.ensurePersonalAssignment(dto.trainerId, member.id);
    }

    if (member) await this.checkMemberConflict(member.id, start, end);
    await this.checkTrainerConflict(dto.trainerId, start, end);

    // STEP 7 — xác định chi nhánh: ưu tiên DTO → HLV → hội viên
    let branchId = dto.branchId ?? trainer.user?.branchId ?? member?.branchId ?? null;
    let roomId = dto.roomId ?? null;

    if (branchId) await this.validateBranchActive(branchId);
    this.assertTrainerBranch(trainer.user?.branchId ?? null, branchId);

    if (roomId) {
      if (!branchId) {
        const roomInfo = await this.prisma.room.findUnique({
          where: { id: roomId },
          select: { branchId: true },
        });
        branchId = roomInfo?.branchId ?? null;
        if (branchId) await this.validateBranchActive(branchId);
      }
      await this.validateRoomAvailable(roomId, branchId);
      await this.checkRoomConflict(roomId, start, end);
    }

    const session = await this.prisma.trainingSchedule.create({
      data: {
        title: dto.title,
        trainerId: dto.trainerId,
        memberId: member?.id ?? null,
        branchId,
        roomId,
        type,
        startTime: start,
        endTime: end,
        status: 'SCHEDULED',
        description: dto.description ?? null,
        notes: dto.notes ?? null,
      },
      include: this.sessionInclude(),
    });

    // Thông báo cho hội viên nếu có
    if (member) {
      await this.prisma.notification.create({
        data: {
          memberId: member.id,
          title: 'Buổi tập mới đã được đặt 📅',
          content: `${dto.title} cùng ${trainer.user?.branch?.name ?? ''} lúc ${start.toLocaleString('vi-VN')}.`,
          type: 'SCHEDULE',
          link: '/member/schedule',
        },
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: 'SCHEDULE_CREATE',
      entity: 'TrainingSchedule',
      entityId: session.id,
      metadata: {
        title: dto.title,
        type,
        trainerId: dto.trainerId,
        memberId: member?.id ?? null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });

    return { message: 'Tạo buổi tập thành công.', session };
  }

  async updateSession(id: string, dto: UpdateSessionDto, role: string, actorId?: string) {
    const existing = await this.prisma.trainingSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy buổi tập.');
    if (existing.status !== 'SCHEDULED') {
      throw new BadRequestException('Chỉ có thể chỉnh sửa buổi tập đang ở trạng thái chờ (SCHEDULED).');
    }

    const start = dto.startTime ? new Date(dto.startTime) : existing.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : existing.endTime;
    this.assertValidTime(start, end);

    if (start < new Date() && !PAST_ALLOWED_ROLES.includes(role)) {
      throw new BadRequestException('Không thể dời lịch về quá khứ. Chỉ Admin/Quản lý có quyền này.');
    }

    const trainerId = dto.trainerId ?? existing.trainerId;
    if (trainerId !== existing.trainerId) {
      await this.getEligibleTrainer(trainerId);
    }
    const trainer = await this.getEligibleTrainer(trainerId);

    const memberId = dto.memberId !== undefined ? dto.memberId : existing.memberId;
    const member = await this.getEligibleMember(memberId ?? undefined);

    const type = dto.type ?? existing.type;
    if (type === SessionType.PERSONAL_TRAINING && member) {
      await this.ensurePersonalAssignment(trainerId, member.id);
    }
    if (type === SessionType.PERSONAL_TRAINING && !member) {
      throw new BadRequestException('Buổi tập kèm riêng (PT) bắt buộc phải chọn hội viên.');
    }

    if (member) await this.checkMemberConflict(member.id, start, end, id);
    await this.checkTrainerConflict(trainerId, start, end, id);

    // STEP 7 — validate chi nhánh / phòng / trùng phòng khi cập nhật
    const branchId =
      dto.branchId !== undefined ? dto.branchId : (trainer.user?.branchId ?? existing.branchId);
    const roomId = dto.roomId !== undefined ? dto.roomId : existing.roomId;

    if (branchId) await this.validateBranchActive(branchId);
    this.assertTrainerBranch(trainer.user?.branchId ?? null, branchId);

    if (roomId) {
      await this.validateRoomAvailable(roomId, branchId);
      await this.checkRoomConflict(roomId, start, end, id);
    }

    const session = await this.prisma.trainingSchedule.update({
      where: { id },
      data: {
        trainerId,
        memberId: member?.id ?? null,
        branchId,
        roomId,
        type,
        title: dto.title ?? existing.title,
        description: dto.description !== undefined ? dto.description : existing.description,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
        startTime: start,
        endTime: end,
      },
      include: this.sessionInclude(),
    });

    await this.auditService.log({
      userId: actorId,
      action: 'SCHEDULE_UPDATE',
      entity: 'TrainingSchedule',
      entityId: id,
      metadata: {
        fields: Object.keys(dto),
        fromStart: existing.startTime.toISOString(),
        toStart: start.toISOString(),
        fromEnd: existing.endTime.toISOString(),
        toEnd: end.toISOString(),
      },
    });

    return { message: 'Cập nhật buổi tập thành công.', session };
  }

  async cancelSession(id: string, dto: CancelSessionDto, role: string, userId?: string) {
    const existing = await this.prisma.trainingSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy buổi tập.');

    // TRAINER chỉ được hủy buổi của chính mình
    if (role === 'TRAINER') {
      const trainer = await this.resolveTrainerByUserId(userId!);
      if (existing.trainerId !== trainer.id) {
        throw new ForbiddenException('Bạn chỉ được hủy buổi tập của chính mình.');
      }
    } else if (!MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('Không có quyền hủy buổi tập.');
    }

    this.validateStatusTransition(existing.status, 'cancel');

    const session = await this.prisma.trainingSchedule.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationNote: dto.cancellationNote ?? null,
      },
      include: this.sessionInclude(),
    });

    await this.auditService.log({
      userId,
      action: 'SCHEDULE_CANCEL',
      entity: 'TrainingSchedule',
      entityId: id,
      metadata: { from: existing.status, to: 'CANCELLED', reason: dto.cancellationNote ?? null },
    });

    return { message: 'Đã hủy buổi tập. Lịch sử được giữ lại.', session };
  }

  async completeSession(id: string, role: string, userId?: string) {
    const existing = await this.prisma.trainingSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy buổi tập.');

    if (role === 'TRAINER') {
      const trainer = await this.resolveTrainerByUserId(userId!);
      if (existing.trainerId !== trainer.id) {
        throw new ForbiddenException('Bạn chỉ được hoàn thành buổi tập của chính mình.');
      }
    } else if (!MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('Không có quyền hoàn thành buổi tập.');
    }

    this.validateStatusTransition(existing.status, 'complete');

    const session = await this.prisma.trainingSchedule.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: this.sessionInclude(),
    });

    await this.auditService.log({
      userId,
      action: 'SCHEDULE_COMPLETE',
      entity: 'TrainingSchedule',
      entityId: id,
      metadata: { from: existing.status, to: 'COMPLETED' },
    });

    return { message: 'Đã đánh dấu buổi tập hoàn thành.', session };
  }

  async removeSession(id: string, actorId?: string) {
    const existing = await this.prisma.trainingSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy buổi tập.');

    await this.prisma.trainingSchedule.delete({ where: { id } });

    await this.auditService.log({
      userId: actorId,
      action: 'SCHEDULE_DELETE',
      entity: 'TrainingSchedule',
      entityId: id,
      metadata: { title: existing.title, status: existing.status, startTime: existing.startTime.toISOString() },
    });

    return { message: 'Đã xóa buổi tập (chỉ Admin).' };
  }

  // ---------------------------------------------------------------------------
  // Member portal
  // ---------------------------------------------------------------------------

  async getMySessions(userId: string, query: SessionQueryDto = {}) {
    const member = await this.resolveMemberByUserId(userId);

    const where: Prisma.TrainingScheduleWhereInput = { memberId: member.id };
    if (query.status) where.status = query.status;

    if (query.from && query.to) {
      where.OR = [
        { startTime: { lt: new Date(query.to) }, endTime: { gt: new Date(query.from) } },
      ];
    } else if (query.from) {
      where.OR = [{ endTime: { gte: new Date(query.from) } }];
    } else if (query.to) {
      where.OR = [{ startTime: { lte: new Date(query.to) } }];
    }

    const data = await this.prisma.trainingSchedule.findMany({
      where,
      include: this.sessionInclude(),
      orderBy: { startTime: 'asc' },
      take: query.limit ?? 100,
    });

    const now = new Date();
    const upcoming = data.filter((s) => s.startTime >= now && s.status === 'SCHEDULED').length;

    return { data, upcoming };
  }

  async getMyUpcoming(userId: string) {
    const member = await this.resolveMemberByUserId(userId);
    const now = new Date();

    const data = await this.prisma.trainingSchedule.findMany({
      where: { memberId: member.id, startTime: { gte: now }, status: 'SCHEDULED' },
      include: this.sessionInclude(),
      orderBy: { startTime: 'asc' },
      take: 50,
    });

    return { data, upcoming: data.length };
  }

  // ---------------------------------------------------------------------------
  // Trainer portal
  // ---------------------------------------------------------------------------

  async getTrainerSessions(userId: string, query: SessionQueryDto = {}) {
    const trainer = await this.resolveTrainerByUserId(userId);

    const where: Prisma.TrainingScheduleWhereInput = { trainerId: trainer.id };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { member: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { member: { code: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.from && query.to) {
      where.OR = [
        { startTime: { lt: new Date(query.to) }, endTime: { gt: new Date(query.from) } },
      ];
    } else if (query.from) {
      where.OR = [{ endTime: { gte: new Date(query.from) } }];
    } else if (query.to) {
      where.OR = [{ startTime: { lte: new Date(query.to) } }];
    }

    const data = await this.prisma.trainingSchedule.findMany({
      where,
      include: this.sessionInclude(),
      orderBy: { startTime: 'asc' },
      take: query.limit ?? 200,
    });

    const now = new Date();
    return {
      data,
      stats: {
        today: data.filter(
          (s) => s.startTime >= new Date(now.setHours(0, 0, 0, 0)) && s.startTime < new Date(now.setHours(24, 0, 0, 0)),
        ).length,
        upcoming: data.filter((s) => s.startTime >= now && s.status === 'SCHEDULED').length,
        completed: data.filter((s) => s.status === 'COMPLETED').length,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Training progress (ghi chú buổi tập)
  // ---------------------------------------------------------------------------

  async getProgress(sessionId: string, role?: string, userId?: string) {
    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id: sessionId },
      select: { id: true, trainerId: true, memberId: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi tập.');

    if (role === 'TRAINER') {
      const trainer = await this.resolveTrainerByUserId(userId!);
      if (session.trainerId !== trainer.id) {
        throw new ForbiddenException('Bạn chỉ được xem ghi chú buổi tập của chính mình.');
      }
    }
    if (role === 'MEMBER') {
      const member = await this.resolveMemberByUserId(userId!);
      if (session.memberId !== member.id) {
        throw new ForbiddenException('Bạn chỉ được xem ghi chú buổi tập của chính mình.');
      }
    }

    return this.prisma.trainingProgress.findMany({
      where: { sessionId },
      include: {
        trainer: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addProgress(sessionId: string, dto: CreateProgressDto, role: string, userId?: string) {
    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id: sessionId },
      select: { id: true, trainerId: true, memberId: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi tập.');
    if (!session.memberId) {
      throw new BadRequestException('Buổi tập này không gắn với hội viên nào, không thể ghi chú tiến trình.');
    }

    let trainerId = '';
    if (role === 'TRAINER') {
      const trainer = await this.resolveTrainerByUserId(userId!);
      if (session.trainerId !== trainer.id) {
        throw new ForbiddenException('Bạn chỉ được ghi chú buổi tập của chính mình.');
      }
      trainerId = trainer.id;
    } else if (MANAGE_ROLES.includes(role)) {
      trainerId = session.trainerId;
    } else {
      throw new ForbiddenException('Không có quyền ghi chú buổi tập.');
    }

    const progress = await this.prisma.trainingProgress.create({
      data: {
        sessionId,
        memberId: session.memberId,
        trainerId,
        note: dto.note,
        performance: dto.performance ?? null,
        recommendation: dto.recommendation ?? null,
      },
      include: {
        trainer: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      },
    });

    await this.prisma.notification.create({
      data: {
        memberId: session.memberId,
        title: 'HLV đã ghi chú buổi tập của bạn 📝',
        content: dto.performance || dto.note,
        type: 'SCHEDULE',
        link: '/member/schedule',
      },
    });

    return { message: 'Đã lưu ghi chú buổi tập.', progress };
  }

  async updateProgress(progressId: string, dto: UpdateProgressDto, role: string, userId?: string) {
    const progress = await this.prisma.trainingProgress.findUnique({ where: { id: progressId } });
    if (!progress) throw new NotFoundException('Không tìm thấy ghi chú buổi tập.');

    if (role === 'TRAINER') {
      const trainer = await this.resolveTrainerByUserId(userId!);
      if (progress.trainerId !== trainer.id) {
        throw new ForbiddenException('Bạn chỉ được chỉnh sửa ghi chú của chính mình.');
      }
    } else if (role !== 'ADMIN' && role !== 'MANAGER') {
      throw new ForbiddenException('Không có quyền chỉnh sửa ghi chú buổi tập.');
    }

    const updated = await this.prisma.trainingProgress.update({
      where: { id: progressId },
      data: {
        note: dto.note ?? progress.note,
        performance: dto.performance !== undefined ? dto.performance : progress.performance,
        recommendation:
          dto.recommendation !== undefined ? dto.recommendation : progress.recommendation,
      },
      include: {
        trainer: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      },
    });

    return { message: 'Đã cập nhật ghi chú buổi tập.', progress: updated };
  }
}