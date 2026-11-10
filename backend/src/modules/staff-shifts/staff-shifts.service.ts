import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import { ChatGateway } from "../chat/chat.gateway";
import {
  CreateStaffShiftDto,
  SettleStaffShiftDto,
  StaffShiftQueryDto,
  UpdateStaffShiftDto,
} from "./dto/staff-shift.dto";

interface ShiftActor {
  id: string;
  role: string;
}

export interface ShiftRow {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string | null;
  paidPaymentCount: number | bigint;
  memberCount: number | bigint;
  totalRevenue: Prisma.Decimal | number;
  cashExpected: Prisma.Decimal | number | null;
  cashCounted: Prisma.Decimal | number | null;
  cashDifference: Prisma.Decimal | number | null;
  closedById: string | null;
  closedByName: string | null;
  closedAt: Date | null;
  closeNotes: string | null;
}

export interface ShiftGroupRow {
  id?: string | null;
  label: string;
  totalRevenue: Prisma.Decimal | number;
  transactionCount: number | bigint;
  memberCount: number | bigint;
}

const ADMIN_ROLES = ["ADMIN", "MANAGER"];
const ALLOWED_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

@Injectable()
export class StaffShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private isAdmin(actor: ShiftActor) {
    return ADMIN_ROLES.includes(actor.role);
  }

  private async buildWhere(
    query: StaffShiftQueryDto,
    actor: ShiftActor,
    filterByPaymentDate = false,
  ) {
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException("Ngày bắt đầu không thể sau ngày kết thúc");
    }

    const clauses: Prisma.Sql[] = [];

    if (actor.role === "STAFF") {
      clauses.push(
        Prisma.sql`ss.staffId = CONVERT(uniqueidentifier, ${actor.id})`,
      );
    } else if (query.staffId) {
      clauses.push(
        Prisma.sql`ss.staffId = CONVERT(uniqueidentifier, ${query.staffId})`,
      );
    }

    const dateColumn = filterByPaymentDate
      ? Prisma.sql`p.paidAt`
      : Prisma.sql`ss.startTime`;
    if (query.from)
      clauses.push(Prisma.sql`${dateColumn} >= CAST(${query.from} AS date)`);
    if (query.to)
      clauses.push(
        Prisma.sql`${dateColumn} < DATEADD(day, 1, CAST(${query.to} AS date))`,
      );
    if (query.status) {
      if (!ALLOWED_STATUSES.includes(query.status)) {
        throw new BadRequestException("Trạng thái ca làm không hợp lệ");
      }
      clauses.push(Prisma.sql`UPPER(ss.status) = ${query.status}`);
    }

    return clauses.length
      ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
      : Prisma.empty;
  }

  async list(query: StaffShiftQueryDto, actor: ShiftActor) {
    const where = await this.buildWhere(query, actor);
    const paymentWhere = await this.buildWhere(query, actor, true);
    const rows = await this.prisma.$queryRaw<ShiftRow[]>(Prisma.sql`
      SELECT
        CONVERT(nvarchar(36), ss.id) AS id,
        CONVERT(nvarchar(36), ss.staffId) AS staffId,
        u.fullName AS staffName,
        u.email AS staffEmail,
        ss.title,
        ss.startTime,
        ss.endTime,
        UPPER(ss.status) AS status,
        ss.notes,
        ss.cashExpected,
        ss.cashCounted,
        ss.cashDifference,
        CONVERT(nvarchar(36), ss.closedById) AS closedById,
        closeUser.fullName AS closedByName,
        ss.closedAt,
        ss.closeNotes,
        COALESCE(v.paidPaymentCount, 0) AS paidPaymentCount,
        COALESCE(v.memberCount, 0) AS memberCount,
        COALESCE(v.totalRevenue, 0) AS totalRevenue
      FROM dbo.StaffShift AS ss
      INNER JOIN dbo.[User] AS u ON u.id = ss.staffId
      LEFT JOIN dbo.[User] AS closeUser ON closeUser.id = ss.closedById
      LEFT JOIN dbo.vw_StaffShiftRevenue AS v ON v.staffShiftId = ss.id
      ${where}
      ORDER BY ss.startTime DESC, u.fullName ASC
    `);

    const paidRows = await this.prisma.$queryRaw<
      {
        totalRevenue: Prisma.Decimal | number;
        transactionCount: number | bigint;
        memberCount: number | bigint;
      }[]
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(p.amount), 0) AS totalRevenue,
        COUNT(p.id) AS transactionCount,
        COUNT(DISTINCT p.memberId) AS memberCount
      FROM dbo.StaffShift AS ss
      LEFT JOIN dbo.Payment AS p
        ON p.staffShiftId = ss.id AND UPPER(p.status) = N'PAID'
      ${paymentWhere}
    `);

    const [byDay, byStaff] = await Promise.all([
      this.prisma.$queryRaw<ShiftGroupRow[]>(Prisma.sql`
        SELECT CONVERT(char(10), p.paidAt, 23) AS label,
          COALESCE(SUM(p.amount), 0) AS totalRevenue, COUNT(p.id) AS transactionCount,
          COUNT(DISTINCT p.memberId) AS memberCount
        FROM dbo.StaffShift AS ss
        INNER JOIN dbo.Payment AS p ON p.staffShiftId = ss.id AND UPPER(p.status) = N'PAID'
        ${paymentWhere}
        GROUP BY CONVERT(char(10), p.paidAt, 23)
        ORDER BY label DESC
      `),
      this.prisma.$queryRaw<ShiftGroupRow[]>(Prisma.sql`
        SELECT CONVERT(nvarchar(36), ss.staffId) AS id, u.fullName AS label,
          COALESCE(SUM(p.amount), 0) AS totalRevenue, COUNT(p.id) AS transactionCount,
          COUNT(DISTINCT p.memberId) AS memberCount
        FROM dbo.StaffShift AS ss
        INNER JOIN dbo.[User] AS u ON u.id = ss.staffId
        LEFT JOIN dbo.Payment AS p ON p.staffShiftId = ss.id AND UPPER(p.status) = N'PAID'
        ${paymentWhere}
        GROUP BY ss.staffId, u.fullName
        ORDER BY totalRevenue DESC, label
      `),
    ]);

    return {
      data: rows.map((row) => ({
        ...row,
        paidPaymentCount: Number(row.paidPaymentCount),
        memberCount: Number(row.memberCount),
        totalRevenue: Number(row.totalRevenue),
        cashExpected:
          row.cashExpected === null ? null : Number(row.cashExpected),
        cashCounted: row.cashCounted === null ? null : Number(row.cashCounted),
        cashDifference:
          row.cashDifference === null ? null : Number(row.cashDifference),
      })),
      summary: {
        totalRevenue: Number(paidRows[0]?.totalRevenue ?? 0),
        transactionCount: Number(paidRows[0]?.transactionCount ?? 0),
        memberCount: Number(paidRows[0]?.memberCount ?? 0),
      },
      byDay: this.normalizeGroups(byDay),
      byStaff: this.normalizeGroups(byStaff),
    };
  }

  private normalizeGroups<T extends ShiftGroupRow>(rows: T[]) {
    return rows.map((row) => ({
      ...row,
      totalRevenue: Number(row.totalRevenue),
      transactionCount: Number(row.transactionCount),
      memberCount: Number(row.memberCount),
    }));
  }

  async options(actor: ShiftActor) {
    if (!this.isAdmin(actor)) return { staff: [] };

    const staff = await this.prisma.$queryRaw<
      { id: string; fullName: string; email: string }[]
    >`
      SELECT CONVERT(nvarchar(36), id) AS id, fullName, email
      FROM dbo.[User]
      WHERE role = N'STAFF' AND UPPER(COALESCE(status, N'ACTIVE')) = N'ACTIVE'
      ORDER BY fullName
    `;

    return { staff };
  }

  private async assertStaff(staffId: string) {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT CONVERT(nvarchar(36), id) AS id
      FROM dbo.[User]
      WHERE id = CONVERT(uniqueidentifier, ${staffId})
        AND role = N'STAFF'
        AND UPPER(COALESCE(status, N'ACTIVE')) = N'ACTIVE'
    `;
    if (!rows.length)
      throw new BadRequestException(
        "Nhân viên không tồn tại hoặc đang bị khóa",
      );
  }

  private assertTimes(startTime: string | Date, endTime: string | Date) {
    const end = new Date(endTime);
    if (new Date(startTime).getTime() >= end.getTime()) {
      throw new BadRequestException("Giờ kết thúc phải sau giờ bắt đầu");
    }
    if (end <= new Date()) {
      throw new BadRequestException(
        "Ca làm phải có giờ kết thúc trong tương lai",
      );
    }
  }

  private async assertNoOverlap(
    tx: Prisma.TransactionClient,
    staffId: string,
    startTime: string | Date,
    endTime: string | Date,
    exceptId?: string,
  ) {
    const overlap = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT TOP (1) CONVERT(nvarchar(36), id) AS id
      FROM dbo.StaffShift
      WHERE staffId = CONVERT(uniqueidentifier, ${staffId})
        AND UPPER(status) IN (N'SCHEDULED', N'IN_PROGRESS')
        AND startTime < ${new Date(endTime)}
        AND endTime > ${new Date(startTime)}
        ${exceptId ? Prisma.sql`AND id <> CONVERT(uniqueidentifier, ${exceptId})` : Prisma.empty}
    `);
    if (overlap.length)
      throw new ConflictException("Nhân viên đã có ca khác bị trùng thời gian");
  }

  private async getShift(id: string) {
    const rows = await this.prisma.$queryRaw<ShiftRow[]>(Prisma.sql`
      SELECT CONVERT(nvarchar(36), ss.id) AS id,
        CONVERT(nvarchar(36), ss.staffId) AS staffId,
        u.fullName AS staffName, u.email AS staffEmail,
        ss.title, ss.startTime, ss.endTime,
        UPPER(ss.status) AS status, ss.notes, ss.cashExpected, ss.cashCounted,
        ss.cashDifference, CONVERT(nvarchar(36), ss.closedById) AS closedById,
        closeUser.fullName AS closedByName, ss.closedAt, ss.closeNotes,
        CONVERT(bigint, 0) AS paidPaymentCount, CONVERT(bigint, 0) AS memberCount,
        CONVERT(decimal(12, 2), 0) AS totalRevenue
      FROM dbo.StaffShift ss
      INNER JOIN dbo.[User] u ON u.id = ss.staffId
      LEFT JOIN dbo.[User] AS closeUser ON closeUser.id = ss.closedById
      WHERE ss.id = CONVERT(uniqueidentifier, ${id})
    `);
    if (!rows[0]) throw new NotFoundException("Không tìm thấy ca làm");
    return {
      ...rows[0],
      paidPaymentCount: Number(rows[0].paidPaymentCount),
      memberCount: Number(rows[0].memberCount),
      totalRevenue: Number(rows[0].totalRevenue),
      cashExpected:
        rows[0].cashExpected === null ? null : Number(rows[0].cashExpected),
      cashCounted:
        rows[0].cashCounted === null ? null : Number(rows[0].cashCounted),
      cashDifference:
        rows[0].cashDifference === null ? null : Number(rows[0].cashDifference),
    };
  }

  private assertShiftAccess(shift: ShiftRow, actor: ShiftActor) {
    if (
      actor.role === "STAFF" &&
      shift.staffId.toLowerCase() !== actor.id.toLowerCase()
    ) {
      throw new ForbiddenException(
        "Bạn chỉ có thể chốt ca được phân công cho mình",
      );
    }
  }

  async settlementPreview(id: string, actor: ShiftActor) {
    const shift = await this.getShift(id);
    this.assertShiftAccess(shift, actor);
    if (shift.status !== "IN_PROGRESS") {
      throw new ConflictException("Chỉ có thể kiểm quỹ ca đang diễn ra");
    }

    const marker = `[STAFF_POS:${shift.staffId}:${shift.id}]`;
    const legacyMarker = `[STAFF_POS:${shift.staffId}]`;
    const [cashRows, transferRows, pendingRows] = await Promise.all([
      this.prisma.$queryRaw<
        {
          expectedCash: Prisma.Decimal | number;
          cashPaymentCount: number | bigint;
        }[]
      >(Prisma.sql`
        SELECT COALESCE(SUM(amount), 0) AS expectedCash, COUNT(*) AS cashPaymentCount
        FROM dbo.Payment
        WHERE staffShiftId = CONVERT(uniqueidentifier, ${id})
          AND UPPER(status) = N'PAID'
          AND UPPER(method) = N'CASH'
      `),
      this.prisma.$queryRaw<
        {
          bankTransferExpected: Prisma.Decimal | number;
          bankTransferPaymentCount: number | bigint;
        }[]
      >(Prisma.sql`
        SELECT COALESCE(SUM(amount), 0) AS bankTransferExpected, COUNT(*) AS bankTransferPaymentCount
        FROM dbo.Payment
        WHERE staffShiftId = CONVERT(uniqueidentifier, ${id})
          AND UPPER(status) = N'PAID'
          AND UPPER(method) = N'BANK_TRANSFER'
      `),
      this.prisma.$queryRaw<{ pendingCashCount: number | bigint }[]>(Prisma.sql`
        SELECT COUNT(*) AS pendingCashCount
        FROM dbo.Payment
        WHERE UPPER(status) = N'PENDING'
          AND UPPER(method) = N'CASH'
          AND (
            CHARINDEX(${marker}, notes) > 0
            OR CHARINDEX(${legacyMarker}, notes) > 0
            OR CHARINDEX(N'[STAFF_POS]', notes) > 0
          )
      `),
    ]);

    return {
      shiftId: id,
      expectedCash: Number(cashRows[0]?.expectedCash ?? 0),
      cashPaymentCount: Number(cashRows[0]?.cashPaymentCount ?? 0),
      bankTransferExpected: Number(transferRows[0]?.bankTransferExpected ?? 0),
      bankTransferPaymentCount: Number(
        transferRows[0]?.bankTransferPaymentCount ?? 0,
      ),
      pendingCashCount: Number(pendingRows[0]?.pendingCashCount ?? 0),
    };
  }

  async create(dto: CreateStaffShiftDto, actor: ShiftActor) {
    this.assertTimes(dto.startTime, dto.endTime);
    await this.assertStaff(dto.staffId);

    const { randomUUID } = await import("crypto");
    const id = randomUUID();
    await this.prisma.$transaction(
      async (tx) => {
        await this.assertNoOverlap(tx, dto.staffId, dto.startTime, dto.endTime);
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO dbo.StaffShift (id, staffId, title, startTime, endTime, status, notes)
          VALUES (
            CONVERT(uniqueidentifier, ${id}),
            CONVERT(uniqueidentifier, ${dto.staffId}),
            ${dto.title.trim()},
            ${new Date(dto.startTime)},
            ${new Date(dto.endTime)},
            N'SCHEDULED',
            ${dto.notes?.trim() || null}
          )
        `);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const shift = await this.getShift(id);
    await this.auditService.log({
      userId: actor.id,
      action: "STAFF_SHIFT_CREATE",
      entity: "StaffShift",
      entityId: id,
      metadata: { staffId: dto.staffId },
    });
    return shift;
  }

  async update(id: string, dto: UpdateStaffShiftDto, actor: ShiftActor) {
    const existing = await this.getShift(id);
    if (existing.status !== "SCHEDULED") {
      throw new ConflictException("Chỉ có thể sửa ca đang được lên lịch");
    }
    const staffId = dto.staffId ?? existing.staffId;
    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    this.assertTimes(startTime, endTime);
    await this.assertStaff(staffId);
    const count = await this.prisma.$transaction(
      async (tx) => {
        await this.assertNoOverlap(tx, staffId, startTime, endTime, id);
        return tx.$executeRaw(Prisma.sql`
          UPDATE dbo.StaffShift
          SET staffId = CONVERT(uniqueidentifier, ${staffId}),
              title = ${dto.title?.trim() ?? existing.title},
              startTime = ${new Date(startTime)},
              endTime = ${new Date(endTime)},
              notes = ${dto.notes === undefined ? existing.notes : dto.notes?.trim() || null},
              updatedAt = SYSUTCDATETIME()
          WHERE id = CONVERT(uniqueidentifier, ${id}) AND UPPER(status) = N'SCHEDULED'
        `);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!count)
      throw new ConflictException(
        "Ca đã bắt đầu hoặc đã bị thay đổi, vui lòng tải lại",
      );
    await this.auditService.log({
      userId: actor.id,
      action: "STAFF_SHIFT_UPDATE",
      entity: "StaffShift",
      entityId: id,
      metadata: { staffId },
    });
    return this.getShift(id);
  }

  async remove(id: string, actor: ShiftActor) {
    const count = await this.prisma.$executeRaw(Prisma.sql`
      DELETE ss
      FROM dbo.StaffShift AS ss
      WHERE ss.id = CONVERT(uniqueidentifier, ${id})
        AND UPPER(ss.status) = N'SCHEDULED'
        AND NOT EXISTS (SELECT 1 FROM dbo.Payment AS p WHERE p.staffShiftId = ss.id)
    `);
    if (!count) {
      const shift = await this.getShift(id);
      if (shift.status !== "SCHEDULED") {
        throw new ConflictException("Chỉ có thể xóa ca đang được lên lịch");
      }
      throw new ConflictException(
        "Không thể xóa ca đã phát sinh giao dịch thanh toán",
      );
    }
    await this.auditService.log({
      userId: actor.id,
      action: "STAFF_SHIFT_DELETE",
      entity: "StaffShift",
      entityId: id,
    });
    return { message: "Đã xóa ca làm" };
  }

  async cancel(id: string, actor: ShiftActor) {
    const count = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE ss
      SET status = N'CANCELLED', updatedAt = SYSUTCDATETIME()
      FROM dbo.StaffShift AS ss
      WHERE ss.id = CONVERT(uniqueidentifier, ${id})
        AND UPPER(ss.status) IN (N'SCHEDULED', N'IN_PROGRESS')
        AND NOT EXISTS (
          SELECT 1
          FROM dbo.Payment AS p
          WHERE p.staffShiftId = ss.id
             OR (
               UPPER(p.status) = N'PENDING'
               AND CHARINDEX(
                 CONCAT(
                   N'[STAFF_POS:',
                   CONVERT(nvarchar(36), ss.staffId),
                   N':',
                   CONVERT(nvarchar(36), ss.id),
                   N']'
                 ),
                 p.notes
               ) > 0
             )
        )
    `);
    if (!count) {
      const shift = await this.getShift(id);
      if (shift.status === "SCHEDULED" || shift.status === "IN_PROGRESS") {
        throw new ConflictException(
          "Không thể hủy ca đã phát sinh thanh toán; hãy kết thúc ca để giữ đúng lịch sử doanh thu",
        );
      }
      throw new ConflictException(
        `Không thể hủy ca đang ở trạng thái ${shift.status}`,
      );
    }
    await this.auditService.log({
      userId: actor.id,
      action: "STAFF_SHIFT_CANCEL",
      entity: "StaffShift",
      entityId: id,
    });
    return this.getShift(id);
  }

  async start(id: string, actor: ShiftActor) {
    const shift = await this.getShift(id);
    if (
      actor.role === "STAFF" &&
      shift.staffId.toLowerCase() !== actor.id.toLowerCase()
    ) {
      throw new ForbiddenException(
        "Bạn chỉ có thể bắt đầu ca được phân công cho mình",
      );
    }
    if (shift.status !== "SCHEDULED") {
      throw new ConflictException("Ca làm không ở trạng thái có thể bắt đầu");
    }
    const now = new Date();
    if (shift.startTime > now)
      throw new BadRequestException("Chưa đến giờ bắt đầu ca");
    if (shift.endTime <= now)
      throw new BadRequestException("Ca làm đã quá giờ kết thúc");

    const count = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE dbo.StaffShift
      SET status = N'IN_PROGRESS', updatedAt = SYSUTCDATETIME()
      WHERE id = CONVERT(uniqueidentifier, ${id}) AND UPPER(status) = N'SCHEDULED'
        AND startTime <= ${now} AND endTime > ${now}
    `);
    if (!count)
      throw new ConflictException("Ca làm đã được cập nhật bởi thao tác khác");
    await this.auditService.log({
      userId: actor.id,
      action: "STAFF_SHIFT_START",
      entity: "StaffShift",
      entityId: id,
    });
    const updatedShift = await this.getShift(id);
    this.chatGateway.emitStaffShiftUpdated({
      action: "STARTED",
      id: updatedShift.id,
      staffId: updatedShift.staffId,
      staffName: updatedShift.staffName,
      title: updatedShift.title,
      status: updatedShift.status,
      actorId: actor.id,
    });
    return updatedShift;
  }

  async end(id: string, dto: SettleStaffShiftDto, actor: ShiftActor) {
    const note = dto.note?.trim() || null;
    const result = await this.prisma.$transaction(
      async (tx) => {
        const shifts = await tx.$queryRaw<
          { id: string; staffId: string; status: string }[]
        >(Prisma.sql`
          SELECT CONVERT(nvarchar(36), ss.id) AS id,
            CONVERT(nvarchar(36), ss.staffId) AS staffId,
            UPPER(ss.status) AS status
          FROM dbo.StaffShift AS ss WITH (UPDLOCK, HOLDLOCK)
          WHERE ss.id = CONVERT(uniqueidentifier, ${id})
        `);
        const shift = shifts[0];
        if (!shift) throw new NotFoundException("Không tìm thấy ca làm");
        if (
          actor.role === "STAFF" &&
          shift.staffId.toLowerCase() !== actor.id.toLowerCase()
        ) {
          throw new ForbiddenException(
            "Bạn chỉ có thể chốt ca được phân công cho mình",
          );
        }
        if (shift.status !== "IN_PROGRESS") {
          throw new ConflictException("Chỉ có thể chốt ca đang diễn ra");
        }

        const marker = `[STAFF_POS:${shift.staffId}:${shift.id}]`;
        const legacyMarker = `[STAFF_POS:${shift.staffId}]`;
        const pendingCash = await tx.$queryRaw<
          { pendingCashCount: number | bigint }[]
        >(Prisma.sql`
          SELECT COUNT(*) AS pendingCashCount
          FROM dbo.Payment
          WHERE UPPER(status) = N'PENDING'
            AND UPPER(method) = N'CASH'
            AND (
              CHARINDEX(${marker}, notes) > 0
              OR CHARINDEX(${legacyMarker}, notes) > 0
              OR CHARINDEX(N'[STAFF_POS]', notes) > 0
            )
        `);
        if (Number(pendingCash[0]?.pendingCashCount ?? 0) > 0) {
          throw new ConflictException(
            "Còn khoản thu tiền mặt tại quầy chưa xác nhận; hãy xử lý trước khi chốt ca",
          );
        }

        const cashRows = await tx.$queryRaw<
          { expectedCash: Prisma.Decimal | number }[]
        >(Prisma.sql`
          SELECT COALESCE(SUM(amount), 0) AS expectedCash
          FROM dbo.Payment
          WHERE staffShiftId = CONVERT(uniqueidentifier, ${id})
            AND UPPER(status) = N'PAID'
            AND UPPER(method) = N'CASH'
        `);
        const expectedCash = Number(cashRows[0]?.expectedCash ?? 0);
        const cashDifference = Number(
          (dto.cashCounted - expectedCash).toFixed(2),
        );
        if (cashDifference !== 0 && !note) {
          throw new BadRequestException(
            "Vui lòng ghi lý do khi tiền thực đếm bị thiếu hoặc thừa",
          );
        }

        const updated = await tx.$executeRaw(Prisma.sql`
          UPDATE dbo.StaffShift
          SET status = N'COMPLETED',
              cashExpected = ${expectedCash},
              cashCounted = ${dto.cashCounted},
              cashDifference = ${cashDifference},
              closedById = CONVERT(uniqueidentifier, ${actor.id}),
              closedAt = SYSUTCDATETIME(),
              closeNotes = ${note},
              updatedAt = SYSUTCDATETIME()
          WHERE id = CONVERT(uniqueidentifier, ${id})
            AND UPPER(status) = N'IN_PROGRESS'
        `);
        if (!updated) {
          throw new ConflictException(
            "Ca vừa được cập nhật bởi thao tác khác; hãy tải lại",
          );
        }
        return { expectedCash, cashDifference };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.auditService.log({
      userId: actor.id,
      action: "STAFF_SHIFT_SETTLE",
      entity: "StaffShift",
      entityId: id,
      metadata: {
        expectedCash: result.expectedCash,
        cashCounted: dto.cashCounted,
        cashDifference: result.cashDifference,
        note,
      },
    });
    const shift = await this.getShift(id);
    this.chatGateway.emitStaffShiftUpdated({
      action: "COMPLETED",
      id: shift.id,
      staffId: shift.staffId,
      staffName: shift.staffName,
      title: shift.title,
      status: shift.status,
      actorId: actor.id,
    });
    return {
      ...shift,
      settlement: {
        expectedCash: result.expectedCash,
        cashCounted: dto.cashCounted,
        cashDifference: result.cashDifference,
      },
    };
  }
}
