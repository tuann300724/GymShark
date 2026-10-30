import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProgramExerciseDto {
  exerciseId: string;
  sets?: number;
  reps?: number;
  restSeconds?: number;
  order?: number;
}

/** Ép payload từ FE (reps số, restSeconds số, order) về đúng schema Prisma (reps string, rest, orderIndex). */
function mapExercises(list?: ProgramExerciseDto[]) {
  return (list || []).map((e, idx) => ({
    exerciseId: e.exerciseId,
    sets: e.sets || 3,
    reps: String(e.reps ?? 12),
    rest: e.restSeconds ? `${e.restSeconds}s` : '60s',
    orderIndex: e.order ?? idx,
  }));
}

import { ChatService } from '../chat/chat.service';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService, private readonly chat: ChatService) {}

  /** user.id trong JWT là User id — Program.trainerId cần Trainer profile id. */
  private async resolveTrainer(userId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!trainer) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ huấn luyện viên.');
    return trainer;
  }

  private async resolveMember(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ hội viên.');
    return member;
  }

  async create(user: { id: string; role: string }, data: any) {
    const trainer = await this.resolveTrainer(user.id);
    const program = await this.prisma.program.create({
      data: {
        slug: data.slug,
        name: data.name,
        group: data.group || null,
        duration: data.duration || null,
        summary: data.summary || null,
        img: data.img || null,
        alt: data.alt || null,
        trainerId: trainer.id,
        isTemplate: data.isTemplate || false,
        status: 'DRAFT',
        programExercises: {
          create: mapExercises(data.exercises),
        },
      },
      include: { programExercises: { include: { exercise: true } } },
    });
    return program;
  }

  async listForTrainer(trainerUserId: string, query?: any) {
    const trainer = await this.resolveTrainer(trainerUserId);
    return this.prisma.program.findMany({
      where: { trainerId: trainer.id },
      include: { programExercises: { include: { exercise: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForMember(memberId: string, query?: any) {
    return this.prisma.program.findMany({
      where: { memberId },
      include: { programExercises: { include: { exercise: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: { id: string; role: string }, id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: { programExercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } }, member: true, trainer: { include: { user: true } } },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async update(user: { id: string; role: string }, id: string, data: any) {
    const existing = await this.prisma.program.findUnique({ where: { id }, include: { programExercises: true } });
    if (!existing) throw new NotFoundException('Không tìm thấy bài tập.');
    await this.prisma.programExercise.deleteMany({ where: { programId: id } });
    const nextExercises = data.exercises
      ? mapExercises(data.exercises)
      : existing.programExercises.map((e, idx) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          orderIndex: e.orderIndex ?? idx,
        }));
    return this.prisma.program.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        group: data.group !== undefined ? data.group : existing.group,
        duration: data.duration !== undefined ? data.duration : existing.duration,
        summary: data.summary !== undefined ? data.summary : existing.summary,
        img: data.img !== undefined ? data.img : existing.img,
        alt: data.alt !== undefined ? data.alt : existing.alt,
        isTemplate: data.isTemplate !== undefined ? data.isTemplate : existing.isTemplate,
        programExercises: { create: nextExercises },
      },
      include: { programExercises: { include: { exercise: true } } },
    });
  }

  async remove(user: { id: string; role: string }, id: string) {
    await this.prisma.programExercise.deleteMany({ where: { programId: id } });
    return this.prisma.program.delete({ where: { id } });
  }

  async duplicate(user: { id: string; role: string }, id: string, dto?: any) {
    const trainer = await this.resolveTrainer(user.id);
    const original = await this.prisma.program.findUnique({ where: { id }, include: { programExercises: true } });
    if (!original) throw new NotFoundException('Không tìm thấy bài tập.');
    if (original.trainerId && original.trainerId !== trainer.id) {
      throw new ForbiddenException('Bạn không có quyền nhân bản bài tập này.');
    }
    return this.prisma.program.create({
      data: {
        slug: original.slug + '-copy-' + Date.now(),
        name: original.name + ' (bản sao)',
        group: original.group,
        duration: original.duration,
        summary: original.summary,
        img: original.img,
        alt: original.alt,
        trainerId: trainer.id,
        isTemplate: dto?.isTemplate || original.isTemplate,
        status: 'DRAFT',
        programExercises: {
          create: original.programExercises.map((e, idx) => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest,
            orderIndex: e.orderIndex ?? idx,
          })),
        },
      },
      include: { programExercises: { include: { exercise: true } } },
    });
  }

  /**
   * Gửi bài tập cho hội viên qua tin nhắn chat.
   * - Bắt buộc HLV chọn hội viên (memberIds); chỉ nhận hội viên đang phân công ACTIVE.
   * - Mỗi hội viên nhận 1 tin nhắn TEXT đầy đủ danh sách bài tập + thông báo.
   */
  async send(user: { id: string; role: string }, id: string, content?: string, memberIds?: string[]) {
    const trainer = await this.resolveTrainer(user.id);
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: { programExercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } } },
    });
    if (!program) throw new NotFoundException('Không tìm thấy bài tập.');
    if (program.trainerId !== trainer.id) {
      throw new ForbiddenException('Bạn không có quyền gửi bài tập này.');
    }

    // Chỉ hội viên đang được phân công ACTIVE mới được nhận bài
    const assignments = await this.prisma.trainerMember.findMany({
      where: { trainerId: trainer.id, status: 'ACTIVE' },
      select: { memberId: true },
    });
    const activeIds = assignments.map((a) => a.memberId);
    if (!activeIds.length) {
      throw new BadRequestException('Bạn chưa có hội viên ACTIVE nào được phân công để nhận bài.');
    }

    const targets = memberIds?.length
      ? [...new Set(memberIds)].filter((m) => activeIds.includes(m))
      : activeIds;
    if (!targets.length) {
      throw new BadRequestException('Hội viên được chọn không nằm trong danh sách phân công ACTIVE của bạn.');
    }

    const result = await this.prisma.program.update({
      where: { id },
      data: {
        status: program.status === 'CONFIRMED' ? 'CONFIRMED' : 'ASSIGNED',
        ...(targets.length === 1 ? { memberId: targets[0] } : {}),
      },
      include: { member: true },
    });

    // Nội dung tin nhắn: lời nhắn + danh sách bài tập đầy đủ (chat hiển thị newline)
    const lines = program.programExercises.map(
      (pe, i) =>
        `${i + 1}. ${pe.exercise.name} — ${pe.sets}x${pe.reps}${pe.rest ? ` (nghỉ ${pe.rest})` : ''}`,
    );
    const header =
      (content || '').trim() || `Bài tập "${program.name}" từ huấn luyện viên của bạn:`;
    const message = [
      header,
      '',
      lines.length ? 'DANH SÁCH BÀI TẬP:' : 'Chưa có bài tập nào trong chương trình.',
      ...lines,
      '',
      'Nếu có thắc mắc về bài tập, hãy nhắn lại cho em anh nhé — mình trao đổi luôn trong đây.',
    ].join('\n');

    let sentTo = 0;
    let failed = 0;
    for (const memberId of targets) {
      try {
        await this.chat.sendProgramMessage({
          trainerUserId: user.id,
          memberId,
          programId: program.id,
          content: message,
        });
        sentTo += 1;
      } catch {
        failed += 1;
      }
    }
    if (sentTo === 0) {
      throw new BadRequestException('Không gửi được bài tập cho hội viên đã chọn — thử lại sau.');
    }

    return { ...result, sentTo, failed };
  }

  async confirm(user: { id: string; role: string }, id: string) {
    const member = await this.resolveMember(user.id);
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) throw new NotFoundException('Không tìm thấy bài tập.');
    if (program.memberId && program.memberId !== member.id) {
      throw new ForbiddenException('Bài tập này không được gửi cho bạn.');
    }
    return this.prisma.program.update({
      where: { id },
      data: { status: 'CONFIRMED', memberId: member.id },
    });
  }
}
