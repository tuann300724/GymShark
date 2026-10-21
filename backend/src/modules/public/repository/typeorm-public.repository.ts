import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PublicRepository } from './public.repository';

@Injectable()
export class TypeOrmPublicRepository implements PublicRepository {
  constructor(private readonly dataSource: DataSource) {}

  async packages(): Promise<any[]> {
    const rows = await this.dataSource.query('EXEC sp_public_packages');
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      features: r.features ? JSON.parse(r.features) : null,
      durationDays: r.durationDays,
      price: String(Number(r.price) || r.price),
      sessions: r.sessions,
      type: r.type,
      status: r.status,
      allowedBranches: r.allowedBranches ? JSON.parse(r.allowedBranches) : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async trainers(): Promise<any[]> {
    const rows = await this.dataSource.query('EXEC sp_public_trainers');
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      userId: r.userId,
      specialization: r.specialization,
      certification: r.certification,
      experienceYears: r.experienceYears,
      bio: r.bio,
      gender: r.gender,
      dateOfBirth: r.dateOfBirth,
      rating: r.rating,
      hourlyRate: r.hourlyRate ? String(r.hourlyRate) : null,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        id: r.user_id,
        fullName: r.user_fullName,
        phone: r.user_phone,
        avatarUrl: r.user_avatarUrl,
      },
    }));
  }

  async schedule(): Promise<any[]> {
    const rows = await this.dataSource.query('EXEC sp_public_schedule');
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      trainerId: r.trainerId,
      memberId: r.memberId,
      branchId: r.branchId,
      roomId: r.roomId,
      type: r.type,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      description: r.description,
      notes: r.notes,
      cancellationNote: r.cancellationNote,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      trainer: r.trainer_id ? {
        id: r.trainer_id,
        user: r.trainerUser_id ? {
          id: r.trainerUser_id,
          fullName: r.trainerUser_fullName,
          avatarUrl: r.trainerUser_avatarUrl,
        } : null,
      } : null,
      room: r.room_id ? {
        id: r.room_id,
        name: r.room_name,
        capacity: r.room_capacity,
      } : null,
    }));
  }

  async branches(): Promise<any[]> {
    const rows = await this.dataSource.query('EXEC sp_public_branches');
    return rows ?? [];
  }

  async promotions(): Promise<any[]> {
    const rows = await this.dataSource.query('EXEC sp_public_promotions');
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      discountType: r.discountType,
      discountValue: Number(r.discountValue),
      maxDiscount: r.maxDiscount != null ? Number(r.maxDiscount) : null,
      minOrderAmount: r.minOrderValue != null ? Number(r.minOrderValue) : null,
      endAt: r.endAt,
    }));
  }

  async homeStats(): Promise<{ totalMembers: number; totalTrainers: number; totalBranches: number }> {
    const rows = await this.dataSource.query('EXEC sp_public_home_stats');
    const r = (rows as any)?.[0] ?? {};
    return {
      totalMembers: Number(r.totalMembers ?? 0),
      totalTrainers: Number(r.totalTrainers ?? 0),
      totalBranches: Number(r.totalBranches ?? 0),
    };
  }
}
