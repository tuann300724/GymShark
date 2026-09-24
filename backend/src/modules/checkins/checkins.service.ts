import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.checkIn.findMany({
      include: {
        member: { select: { id: true, code: true, fullName: true, phone: true, avatarUrl: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { checkInTime: 'desc' },
      take: 50,
    });
  }

  async checkInByCode(memberCode: string, branchId?: string) {
    const member = await this.prisma.member.findUnique({
      where: { code: memberCode },
      include: {
        branch: true,
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Không tìm thấy hội viên với mã: ${memberCode}`);
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestException(`Tài khoản hội viên đang ở trạng thái ${member.status}`);
    }

    const targetBranchId = branchId || member.branchId;

    const checkIn = await this.prisma.checkIn.create({
      data: {
        memberId: member.id,
        branchId: targetBranchId,
        checkInTime: new Date(),
        status: 'CHECKED_IN',
      },
      include: {
        member: true,
        branch: true,
      },
    });

    return {
      message: 'Check-in thành công',
      checkIn,
      activeMembership: member.memberships[0] || null,
    };
  }
}
