import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { ChatService } from '../chat/chat.service';
import {
  CreateMealPlanDto,
  DuplicateMealPlanDto,
  MealInputDto,
  MealPlanQueryDto,
  UpdateMealPlanDto,
} from './dto/meal-plan.dto';

const detailInclude = {
  member: { select: { id: true, fullName: true, avatarUrl: true, code: true } },
  trainer: {
    select: { id: true, user: { select: { id: true, fullName: true, avatarUrl: true } } },
  },
  meals: {
    orderBy: { orderIndex: 'asc' as const },
    include: { items: { orderBy: { orderIndex: 'asc' as const } } },
  },
} satisfies Prisma.MealPlanInclude;

const listInclude = {
  member: { select: { id: true, fullName: true, avatarUrl: true, code: true } },
  trainer: {
    select: { id: true, user: { select: { fullName: true, avatarUrl: true } } },
  },
  _count: { select: { meals: true } },
} satisfies Prisma.MealPlanInclude;

@Injectable()
export class MealPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly chat: ChatService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }

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

  /** Chỉ HLV phụ trách hội viên mới được tạo/gửi thực đơn cho họ. */
  private async assertActiveAssignment(trainerId: string, memberId: string) {
    const assignment = await this.prisma.trainerMember.findFirst({
      where: { trainerId, memberId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!assignment) {
      throw new ForbiddenException('Hội viên này không thuộc quyền phụ trách của bạn.');
    }
  }

  private async getOwnedTrainerPlan(userId: string, id: string) {
    const trainer = await this.resolveTrainer(userId);
    const plan = await this.prisma.mealPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Không tìm thấy thực đơn.');
    if (plan.trainerId !== trainer.id) {
      throw new ForbiddenException('Bạn không có quyền với thực đơn này.');
    }
    return plan;
  }

  // ---------------------------------------------------------------------------
  // Tính dinh dưỡng
  // ---------------------------------------------------------------------------

  /**
   * Quy đổi từng thành phần và bữa ăn. Khi có `foodId`, lấy dinh dưỡng trên 100g
   * của thực phẩm trong thư viện; ngược lại dùng số liệu HLV tự nhập.
   * Mọi giá trị được lưu lại (snapshot) để thực đơn không đổi khi thư viện thay đổi.
   */
  private async buildPlanMeals(input: MealInputDto[]) {
    const foodIds = [
      ...new Set(
        input.flatMap((m) => (m.items ?? []).map((i) => i.foodId).filter((x): x is string => !!x)),
      ),
    ];

    const foods = foodIds.length
      ? await this.prisma.food.findMany({ where: { id: { in: foodIds } } })
      : [];
    const foodMap = new Map(foods.map((f) => [f.id, f]));

    const meals: Prisma.MealCreateWithoutMealPlanInput[] = input.map((meal, mi) => {
      const items = meal.items.map((item, ii) => {
        const food = item.foodId ? foodMap.get(item.foodId) : undefined;
        const name = (food?.name ?? item.name ?? '').trim();
        if (!name) {
          throw new BadRequestException(
            'Mỗi thành phần cần có tên hoặc được chọn từ thư viện thực phẩm.',
          );
        }

        const quantity = Number(item.quantity) || 0;
        const factor = quantity / 100;

        const calories = food ? this.round(food.caloriesPer100g * factor) : this.round(item.calories ?? 0);
        const protein = food ? this.round(food.proteinPer100g * factor) : this.round(item.protein ?? 0);
        const carbs = food ? this.round(food.carbsPer100g * factor) : this.round(item.carbs ?? 0);
        const fat = food ? this.round(food.fatPer100g * factor) : this.round(item.fat ?? 0);

        return {
          foodId: food?.id ?? null,
          name,
          imageUrl: food?.imageUrl ?? item.imageUrl ?? null,
          quantity,
          unit: item.unit ?? food?.servingUnit ?? 'g',
          calories,
          protein,
          carbs,
          fat,
          orderIndex: ii,
        };
      });

      const totals = items.reduce(
        (acc, it) => ({
          calories: acc.calories + it.calories,
          protein: acc.protein + it.protein,
          carbs: acc.carbs + it.carbs,
          fat: acc.fat + it.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );

      return {
        type: meal.type,
        dayIndex: meal.dayIndex ?? null,
        time: meal.time ?? null,
        note: meal.note ?? null,
        imageData: meal.imageData ?? null,
        orderIndex: mi,
        totalCalories: this.round(totals.calories),
        totalProtein: this.round(totals.protein),
        totalCarbs: this.round(totals.carbs),
        totalFat: this.round(totals.fat),
        items: { create: items },
      };
    });

    const planTotals = meals.reduce(
      (acc, m) => ({
        totalCalories: acc.totalCalories + (m.totalCalories as number),
        totalProtein: acc.totalProtein + (m.totalProtein as number),
        totalCarbs: acc.totalCarbs + (m.totalCarbs as number),
        totalFat: acc.totalFat + (m.totalFat as number),
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    );

    return {
      meals,
      totals: {
        totalCalories: this.round(planTotals.totalCalories),
        totalProtein: this.round(planTotals.totalProtein),
        totalCarbs: this.round(planTotals.totalCarbs),
        totalFat: this.round(planTotals.totalFat),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Nghiệp vụ
  // ---------------------------------------------------------------------------

  async create(user: { id: string; role: string }, dto: CreateMealPlanDto) {
    const trainer = await this.resolveTrainer(user.id);

    const isTemplate = Boolean(dto.isTemplate);
    const memberId = isTemplate ? null : dto.memberId ?? null;

    if (memberId) await this.assertActiveAssignment(trainer.id, memberId);
    if (!isTemplate && !memberId) {
      throw new BadRequestException('Cần chọn hội viên nhận thực đơn hoặc lưu ở dạng mẫu.');
    }

    const { meals, totals } = await this.buildPlanMeals(dto.meals);

    const plan = await this.prisma.mealPlan.create({
      data: {
        trainerId: trainer.id,
        memberId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        scope: dto.scope ?? 'DAY',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        status: dto.status ?? 'DRAFT',
        isTemplate,
        templateName: dto.templateName ?? null,
        imageData: dto.imageData ?? null,
        ...totals,
        meals: { create: meals },
      },
      include: detailInclude,
    });

    await this.audit.log({
      userId: user.id,
      action: 'MEALPLAN_CREATE',
      entity: 'MealPlan',
      entityId: plan.id,
      metadata: { title: plan.title, memberId: plan.memberId, isTemplate },
    });

    return plan;
  }

  async listForTrainer(userId: string, query: MealPlanQueryDto) {
    const trainer = await this.resolveTrainer(userId);
    return this.findMany({ trainerId: trainer.id }, query);
  }

  async listForMember(userId: string, query: MealPlanQueryDto) {
    const member = await this.resolveMember(userId);
    return this.findMany({ memberId: member.id, isTemplate: false }, query);
  }

  private async findMany(base: Prisma.MealPlanWhereInput, query: MealPlanQueryDto) {
    const where: Prisma.MealPlanWhereInput = { ...base };

    if (query.memberId) where.memberId = query.memberId;
    if (query.status) where.status = query.status;
    if (query.isTemplate !== undefined) where.isTemplate = query.isTemplate;
    if (query.search) where.title = { contains: query.search.trim() };

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const [data, total] = await this.prisma.$transaction([
      this.prisma.mealPlan.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mealPlan.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(user: { id: string; role: string }, id: string) {
    const plan = await this.prisma.mealPlan.findUnique({ where: { id }, include: detailInclude });
    if (!plan) throw new NotFoundException('Không tìm thấy thực đơn.');

    if (user.role === 'TRAINER') {
      const trainer = await this.resolveTrainer(user.id);
      if (plan.trainerId !== trainer.id) {
        throw new ForbiddenException('Bạn không có quyền với thực đơn này.');
      }
      return plan;
    }

    const member = await this.resolveMember(user.id);
    if (plan.memberId !== member.id) {
      throw new ForbiddenException('Bạn không có quyền với thực đơn này.');
    }
    return plan;
  }

  async update(user: { id: string; role: string }, id: string, dto: UpdateMealPlanDto) {
    const plan = await this.getOwnedTrainerPlan(user.id, id);

    if (dto.memberId) await this.assertActiveAssignment(plan.trainerId, dto.memberId);

    const data: Prisma.MealPlanUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.scope !== undefined) data.scope = dto.scope;
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.memberId !== undefined) {
      data.member = dto.memberId ? { connect: { id: dto.memberId } } : { disconnect: true };
    }
    if (dto.isTemplate !== undefined) data.isTemplate = dto.isTemplate;
    if (dto.templateName !== undefined) data.templateName = dto.templateName;
    if (dto.imageData !== undefined) data.imageData = dto.imageData;
    if (dto.status !== undefined) data.status = dto.status;

    let mealsCreate: Prisma.MealCreateWithoutMealPlanInput[] | null = null;
    if (dto.meals) {
      const built = await this.buildPlanMeals(dto.meals);
      mealsCreate = built.meals;
      Object.assign(data, built.totals);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (mealsCreate) {
        await tx.meal.deleteMany({ where: { mealPlanId: id } });
        data.meals = { create: mealsCreate };
      }
      return tx.mealPlan.update({ where: { id }, data, include: detailInclude });
    });

    await this.audit.log({
      userId: user.id,
      action: 'MEALPLAN_UPDATE',
      entity: 'MealPlan',
      entityId: id,
      metadata: { title: updated.title },
    });

    return updated;
  }

  async duplicate(user: { id: string; role: string }, id: string, dto: DuplicateMealPlanDto) {
    const trainer = await this.resolveTrainer(user.id);
    const source = await this.prisma.mealPlan.findUnique({ where: { id }, include: detailInclude });
    if (!source) throw new NotFoundException('Không tìm thấy thực đơn.');

    if (source.trainerId !== trainer.id) {
      throw new ForbiddenException('Bạn không có quyền với thực đơn này.');
    }
    if (source.memberId) await this.assertActiveAssignment(source.trainerId, source.memberId);
    if (dto.memberId) await this.assertActiveAssignment(trainer.id, dto.memberId);

    const created = await this.prisma.mealPlan.create({
      data: {
        trainerId: trainer.id,
        memberId: dto.memberId ?? null,
        isTemplate: dto.memberId ? false : true,
        title: dto.title ?? `${source.title} (bản sao)`,
        description: source.description,
        scope: source.scope,
        startDate: source.startDate,
        status: 'DRAFT',
        templateName: source.templateName,
        imageData: source.imageData,
        totalCalories: source.totalCalories,
        totalProtein: source.totalProtein,
        totalCarbs: source.totalCarbs,
        totalFat: source.totalFat,
        meals: {
          create: source.meals.map((meal) => ({
            type: meal.type,
            dayIndex: meal.dayIndex,
            time: meal.time,
            note: meal.note,
            imageData: meal.imageData,
            orderIndex: meal.orderIndex,
            totalCalories: meal.totalCalories,
            totalProtein: meal.totalProtein,
            totalCarbs: meal.totalCarbs,
            totalFat: meal.totalFat,
            items: {
              create: meal.items.map((item) => ({
                foodId: item.foodId,
                name: item.name,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
                unit: item.unit,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                orderIndex: item.orderIndex,
              })),
            },
          })),
        },
      },
      include: detailInclude,
    });

    await this.audit.log({
      userId: user.id,
      action: 'MEALPLAN_DUPLICATE',
      entity: 'MealPlan',
      entityId: created.id,
      metadata: { from: id, title: created.title },
    });

    return created;
  }

  async remove(user: { id: string; role: string }, id: string) {
    await this.getOwnedTrainerPlan(user.id, id);
    await this.prisma.mealPlan.delete({ where: { id } });

    await this.audit.log({
      userId: user.id,
      action: 'MEALPLAN_DELETE',
      entity: 'MealPlan',
      entityId: id,
    });

    return { success: true, id };
  }

  async send(user: { id: string; role: string }, id: string, content?: string) {
    const plan = await this.getOwnedTrainerPlan(user.id, id);
    if (!plan.memberId) {
      throw new BadRequestException('Hãy gán hội viên nhận thực đơn trước khi gửi.');
    }
    await this.assertActiveAssignment(plan.trainerId, plan.memberId);

    const message = await this.chat.sendMealPlanMessage({
      trainerUserId: user.id,
      memberId: plan.memberId,
      mealPlanId: plan.id,
      title: content?.trim() || plan.title,
      preview: `[Thực đơn] ${plan.title}`,
    });

    await this.prisma.mealPlan.update({
      where: { id },
      data: { status: 'SENT' },
    });

    await this.audit.log({
      userId: user.id,
      action: 'MEALPLAN_SEND',
      entity: 'MealPlan',
      entityId: id,
      metadata: { memberId: plan.memberId, messageId: message.id },
    });

    return { planId: id, message };
  }

  async confirm(user: { id: string; role: string }, id: string) {
    const member = await this.resolveMember(user.id);
    const plan = await this.prisma.mealPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Không tìm thấy thực đơn.');
    if (plan.memberId !== member.id) {
      throw new ForbiddenException('Thực đơn này không gửi cho bạn.');
    }

    const updated = await this.prisma.mealPlan.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: detailInclude,
    });

    await this.audit.log({
      userId: user.id,
      action: 'MEALPLAN_CONFIRM',
      entity: 'MealPlan',
      entityId: id,
    });

    return updated;
  }
}
