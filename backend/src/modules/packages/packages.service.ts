import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.membershipPackage.findMany({
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.membershipPackage.findUnique({
      where: { id },
    });
  }
}
