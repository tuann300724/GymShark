// TEMP: verify migration — so sanh row count tung bang giua PostgreSQL va SQL Server.
import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: __dirname + '/../.env' });
import { PrismaClient } from '@prisma/client';
import { AppDataSource } from './typeorm.config';

const prisma = new PrismaClient();

const TABLES: Array<{ model: string; table: string }> = [
  { model: 'branch', table: 'branches' },
  { model: 'room', table: 'rooms' },
  { model: 'user', table: 'users' },
  { model: 'membershipPackage', table: 'membership_packages' },
  { model: 'promotion', table: 'promotions' },
  { model: 'food', table: 'foods' },
  { model: 'trainer', table: 'trainers' },
  { model: 'member', table: 'members' },
  { model: 'emailVerification', table: 'email_verifications' },
  { model: 'passwordReset', table: 'password_resets' },
  { model: 'membership', table: 'memberships' },
  { model: 'payment', table: 'payments' },
  { model: 'invoice', table: 'invoices' },
  { model: 'checkIn', table: 'check_ins' },
  { model: 'faceEmbedding', table: 'face_embeddings' },
  { model: 'trainingSchedule', table: 'training_schedules' },
  { model: 'trainerMember', table: 'trainer_members' },
  { model: 'trainingProgress', table: 'training_progress' },
  { model: 'equipment', table: 'equipment' },
  { model: 'equipmentMaintenance', table: 'equipment_maintenances' },
  { model: 'notification', table: 'notifications' },
  { model: 'conversation', table: 'conversations' },
  { model: 'message', table: 'messages' },
  { model: 'messageAttachment', table: 'message_attachments' },
  { model: 'mealPlan', table: 'meal_plans' },
  { model: 'meal', table: 'meals' },
  { model: 'mealItem', table: 'meal_items' },
  { model: 'auditLog', table: 'audit_logs' },
];

async function main() {
  await AppDataSource.initialize();

  let match = 0;
  let mismatch = 0;
  const rows: string[] = [];

  for (const { model, table } of TABLES) {
    const pgRepo = (prisma as any)[model];
    const pgCount: number = pgRepo ? await pgRepo.count() : -1;
    const metadata = AppDataSource.entityMetadatas.find((m) => m.tableName === table);
    const msCount: number = metadata
      ? await AppDataSource.getRepository(metadata.target as any).count()
      : -1;

    const ok = pgCount === msCount;
    if (ok) match++;
    else mismatch++;
    rows.push(
      `  ${table.padEnd(24)} PG=${String(pgCount).padStart(4)}  MSSQL=${String(msCount).padStart(4)}  ${ok ? 'OK' : '❌ LECH'}`,
    );
  }

  console.log('=== VERIFY PG vs SQL SERVER ===');
  console.log(rows.join('\n'));
  console.log('  ' + '-'.repeat(46));
  console.log(`  Match: ${match} | Mismatch: ${mismatch}`);

  // Spot-check: face_embeddings.embedding co du lieu dai (nvarchar(max)) khong bi cat
  const fe = await AppDataSource.query(
    `SELECT TOP 1 LEN(embedding) AS embLen, LEN(imageData) AS imgLen FROM face_embeddings`,
  );
  console.log('\n=== Spot-check face_embeddings (nvarchar(max)) ===');
  console.log('  embedding length:', fe[0]?.embLen, '| imageData length:', fe[0]?.imgLen);

  await AppDataSource.destroy();
  await prisma.$disconnect();

  if (mismatch > 0) {
    console.log('\n❌ CO BANG LECH — xem lai.');
    process.exitCode = 1;
  } else {
    console.log('\n🎉 Tat ca bang khop — migration trung thanh.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
