import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto, SetRoomStatusDto, UpdateRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  private buildRoomInclude() {
    return {
      _count: { select: { schedules: true } },
    } satisfies Prisma.RoomInclude;
  }

  async findAll() {
    return this.prisma.room.findMany({
      include: this.buildRoomInclude(),
      orderBy: [{ code: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: this.buildRoomInclude(),
    });
    if (!room) throw new NotFoundException('Không tìm thấy phòng tập.');
    return room;
  }

  async create(dto: CreateRoomDto) {
    const dup = await this.prisma.room.findFirst({
      where: { code: dto.code },
      select: { id: true },
    });
    if (dup) {
      throw new ConflictException(`Mã phòng ${dto.code} đã tồn tại.`);
    }

    const room = await this.prisma.room.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type ?? 'GYM_AREA',
        capacity: dto.capacity ?? 20,
        floor: dto.floor ?? null,
        description: dto.description ?? null,
        status: dto.status ?? 'AVAILABLE',
      },
      include: this.buildRoomInclude(),
    });

    return { message: 'Tạo phòng tập thành công.', room };
  }

  async update(id: string, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({ where: { id }, select: { id: true } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng tập.');

    if (dto.code) {
      const dup = await this.prisma.room.findFirst({
        where: { code: dto.code, id: { not: id } },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`Mã phòng ${dto.code} đã được sử dụng bởi phòng khác.`);
    }

    const data: Prisma.RoomUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.floor !== undefined) data.floor = dto.floor;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.room.update({
      where: { id },
      data,
      include: this.buildRoomInclude(),
    });

    return { message: 'Cập nhật phòng thành công.', room: updated };
  }

  /** Đổi trạng thái phòng — session chỉ tạo được ở phòng AVAILABLE */
  async setRoomStatus(id: string, dto: SetRoomStatusDto) {
    const room = await this.prisma.room.findUnique({ where: { id }, select: { id: true } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng tập.');

    if (dto.status !== 'AVAILABLE') {
      // Không cho đóng phòng nếu còn buổi tập chưa diễn ra
      const upcoming = await this.prisma.trainingSchedule.count({
        where: { roomId: id, status: 'SCHEDULED', startTime: { gte: new Date() } },
      });
      if (upcoming > 0) {
        throw new BadRequestException(
          `Phòng đang có ${upcoming} buổi tập chưa diễn ra. Hãy dời/hủy các buổi này trước khi đóng phòng.`,
        );
      }
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: { status: dto.status },
      include: this.buildRoomInclude(),
    });

    return { message: 'Đã cập nhật trạng thái phòng.', room: updated };
  }

  async remove(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id }, select: { id: true } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng tập.');

    const scheduleCount = await this.prisma.trainingSchedule.count({ where: { roomId: id } });
    if (scheduleCount > 0) {
      throw new BadRequestException(
        `Không thể xóa phòng còn ${scheduleCount} buổi tập liên quan. Hãy chuyển sang trạng thái INACTIVE.`,
      );
    }

    await this.prisma.room.delete({ where: { id } });
    return { message: 'Đã xóa phòng.' };
  }
}
