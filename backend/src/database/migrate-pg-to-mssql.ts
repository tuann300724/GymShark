import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: __dirname + '/../.env' });

import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AppDataSource } from './typeorm.config';

const prisma = new PrismaClient();

/**
 * Migration data PostgreSQL (Prisma) -> SQL Server (TypeORM), GIỮ NGUYÊN UUID.
 *
 * Vì sao giữ UUID: giai đoạn gradual, module chưa port van doc Postgres. Giu cung ID
 * giua 2 DB moi request cham ca 2 module van tham chieu dung. Neu 2 DB khac UUID se hong.
 *
 * Xu ly dbiet: rooms.id trong seed la chuoi hardcode (room-cardio-01...) khong phai UUID,
 * nhung SQL Server uniqueidentifier chi nhan UUID hop le. Ta doi 5 room thanh UUID v5 (SHA-1
 * theo ten -> idempotent, chay lai van ra cung UUID) va remap moi tham chieu roomId trong
 * equipment + training_schedules.
 *
 * Thu tu chen: FK cha truoc con sau (moi FK deu NO ACTION, khong cascade an).
 */

// UUID v5 (ten -> UUID on dinh). Dung namespace tuy chinh.
const NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID namespace DNS
function uuidv5(name: string): string {
  const namespaceBytes = Buffer.from(NS.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1')
    .update(namespaceBytes)
    .update(Buffer.from(name, 'utf8'))
    .digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // variant RFC4122
  const hex = b.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Map cu -> moi cho cac id khong phai UUID (chi rooms). Dien truoc khi migrate.
const idRemap = new Map<string, string>();

// Tham chieu roomId (con) can remap theo idRemap.
const ROOM_ID_TABLES = new Set(['equipment', 'training_schedules']);

const ORDER: Array<{ model: string; label: string }> = [
  { model: 'branch', label: 'branches' },
  { model: 'room', label: 'rooms' },
  { model: 'user', label: 'users' },
  { model: 'membershipPackage', label: 'membership_packages' },
  { model: 'promotion', label: 'promotions' },
  { model: 'food', label: 'foods' },
  { model: 'trainer', label: 'trainers' },
  { model: 'member', label: 'members' },
  { model: 'emailVerification', label: 'email_verifications' },
  { model: 'passwordReset', label: 'password_resets' },
  { model: 'membership', label: 'memberships' },
  { model: 'payment', label: 'payments' },
  { model: 'invoice', label: 'invoices' },
  { model: 'checkIn', label: 'check_ins' },
  { model: 'faceEmbedding', label: 'face_embeddings' },
  { model: 'trainingSchedule', label: 'training_schedules' },
  { model: 'trainerMember', label: 'trainer_members' },
  { model: 'trainingProgress', label: 'training_progress' },
  { model: 'equipment', label: 'equipment' },
  { model: 'equipmentMaintenance', label: 'equipment_maintenances' },
  { model: 'notification', label: 'notifications' },
  { model: 'conversation', label: 'conversations' },
  { model: 'message', label: 'messages' },
  { model: 'messageAttachment', label: 'message_attachments' },
  { model: 'mealPlan', label: 'meal_plans' },
  { model: 'meal', label: 'meals' },
  { model: 'mealItem', label: 'meal_items' },
  { model: 'auditLog', label: 'audit_logs' },
];

function normalizeRow(label: string, row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue;
    if (v === null) {
      out[k] = null;
      continue;
    }
    if (typeof v === 'object' && typeof (v as any).toNumber === 'function') {
      out[k] = (v as any).toNumber(); // Decimal.js -> number
      continue;
    }
    if (typeof v === 'bigint') {
      out[k] = Number(v);
      continue;
    }
    out[k] = v;
  }

  // Remap id khong phai UUID (rooms) -> UUID v5 on dinh
  if (typeof out.id === 'string' && !UUID_RE.test(out.id)) {
    if (!idRemap.has(out.id)) idRemap.set(out.id, uuidv5(`room:${out.id}`));
    out.id = idRemap.get(out.id);
  }
  // notifications.referenceId: seed Prisma ghi marker chuoi ('seed-inv-0002') nhung cot la
  // uniqueidentifier (entity + runtime writer deu ghi UUID that) -> set NULL cho hop schema.
  if (typeof out.referenceId === 'string' && !UUID_RE.test(out.referenceId)) {
    out.referenceId = null;
  }
  // Remap tham chieu roomId trong bang con cua rooms
  if (ROOM_ID_TABLES.has(label) && typeof out.roomId === 'string' && idRemap.has(out.roomId)) {
    out.roomId = idRemap.get(out.roomId);
  }
  return out;
}

async function main() {
  console.log('🚚 Migrate PostgreSQL -> SQL Server (giu UUID, remap room id)...');
  await AppDataSource.initialize();
  console.log('✅ SQL Server connected');

  // Dien idRemap truoc: doc 5 room, tao UUID v5 cho id khong hop le
  const rooms = await prisma.room.findMany({ select: { id: true } });
  for (const r of rooms) {
    if (!UUID_RE.test(r.id)) idRemap.set(r.id, uuidv5(`room:${r.id}`));
  }
  console.log(`   Remap ${idRemap.size} room id -> UUID v5`);

  let grandTotal = 0;
  const summary: string[] = [];

  for (const { model, label } of ORDER) {
    const repo = (prisma as any)[model];
    if (!repo) {
      summary.push(`  ${label.padEnd(24)} SKIP (khong co model)`);
      continue;
    }
    const metadata = AppDataSource.entityMetadatas.find((m) => m.tableName === label);
    if (!metadata) {
      summary.push(`  ${label.padEnd(24)} SKIP (khong co entity)`);
      continue;
    }
    const target = AppDataSource.getRepository(metadata.target as any);

    const rows = await repo.findMany();
    if (rows.length === 0) {
      summary.push(`  ${label.padEnd(24)}   0 (empty)`);
      continue;
    }
    const clean = rows.map((r: any) => normalizeRow(label, r));
    await target.insert(clean);
    grandTotal += clean.length;
    summary.push(`  ${label.padEnd(24)} ${clean.length}`);
  }

  console.log('\n=== MIGRATION SUMMARY (row da chuyen) ===');
  console.log(summary.join('\n'));
  console.log('  ' + '-'.repeat(32));
  console.log(`  TOTAL ${grandTotal}`);

  await AppDataSource.destroy();
  await prisma.$disconnect();
  console.log('🎉 Migration hoan tat!');
}

main().catch((e) => {
  console.error('❌ Migration loi:', e);
  process.exitCode = 1;
});
