import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}
  create(d: any) { return this.prisma.exercise.create({ data: d }); }
  findAll() { return this.prisma.exercise.findMany({ orderBy: { createdAt: 'desc' } }); }
  findOne(id: string) { return this.prisma.exercise.findUnique({ where: { id } }); }
  update(id: string, d: any) { return this.prisma.exercise.update({ where: { id }, data: d }); }
  remove(id: string) { return this.prisma.exercise.delete({ where: { id } }); }
}
