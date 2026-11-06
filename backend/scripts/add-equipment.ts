import { PrismaClient } from '@prisma/client';

process.loadEnvFile('.env');

const prisma = new PrismaClient();

type EqInput = {
  code: string;
  name: string;
  type: 'CARDIO' | 'WEIGHT' | 'FREESTYLE' | 'GROUP_CLASS';
  status?: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE' | 'BROKEN';
};

// 20 máy tập THẬT đang phổ biến ở phòng gym thương mại
// (nguồn: Life Fitness, Hammer Strength, Technogym, StairMaster, Concept2, Assault, Rogue)
const EQUIPMENT: EqInput[] = [
  // ===== CARDIO (8) =====
  { code: 'EQ-004', name: 'Máy chạy bộ Life Fitness Club Series+', type: 'CARDIO' },
  { code: 'EQ-005', name: 'Máy chạy bộ cong Technogym Skillmill', type: 'CARDIO' },
  { code: 'EQ-006', name: 'Máy elliptical Technogym Excite+ Synchro', type: 'CARDIO' },
  { code: 'EQ-007', name: 'Máy leo thang StairMaster StepMill 7000', type: 'CARDIO' },
  { code: 'EQ-008', name: 'Máy chèo thuyền Concept2 RowErg', type: 'CARDIO' },
  { code: 'EQ-009', name: 'Xe đạp đứng Life Fitness Integrity+ Upright Bike', type: 'CARDIO' },
  { code: 'EQ-010', name: 'Xe đạp nằm Technogym Excite+ Recumbent Bike', type: 'CARDIO' },
  { code: 'EQ-011', name: 'Xe đạp gió Assault AirBike Classic', type: 'CARDIO' },

  // ===== WEIGHT (11) =====
  { code: 'EQ-012', name: 'Máy ép ngực Hammer Strength Iso-Lateral Chest Press', type: 'WEIGHT' },
  { code: 'EQ-013', name: 'Máy kéo xô Hammer Strength Front Lat Pulldown', type: 'WEIGHT' },
  { code: 'EQ-014', name: 'Máy kéo lưng Hammer Strength Iso-Lateral Seated Row', type: 'WEIGHT' },
  { code: 'EQ-015', name: 'Máy đạp chân Hammer Strength Strength Select Leg Press', type: 'WEIGHT' },
  { code: 'EQ-016', name: 'Máy duỗi chân Hammer Strength MTS Leg Extension', type: 'WEIGHT', status: 'MAINTENANCE' },
  { code: 'EQ-017', name: 'Máy gập chân Hammer Strength MTS Leg Curl', type: 'WEIGHT' },
  { code: 'EQ-018', name: 'Máy ép vai Life Fitness Signature Shoulder Press', type: 'WEIGHT' },
  { code: 'EQ-019', name: 'Máy Smith Life Fitness Axiom Series Smith Rack', type: 'WEIGHT' },
  { code: 'EQ-020', name: 'Khung squat Hammer Strength HD Elite iD Power Rack', type: 'WEIGHT' },
  { code: 'EQ-021', name: 'Khung cáp đa năng Life Fitness Dual Adjustable Pulley', type: 'WEIGHT' },
  { code: 'EQ-022', name: 'Máy tập bắp chân Hammer Strength Select Standing Calf', type: 'WEIGHT', status: 'BROKEN' },

  // ===== FREESTYLE (1) =====
  { code: 'EQ-023', name: 'Khung xà & dips Rogue Monster RM-6 Rack', type: 'FREESTYLE' },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const eq of EQUIPMENT) {
    const data = {
      name: eq.name,
      type: eq.type,
      status: eq.status ?? 'AVAILABLE',
    };

    const existing = await prisma.equipment.findUnique({ where: { code: eq.code } });
    if (existing) {
      await prisma.equipment.update({ where: { code: eq.code }, data });
      console.log(`UPDATE ${eq.code} — ${eq.name}`);
      updated++;
    } else {
      await prisma.equipment.create({ data: { code: eq.code, ...data } });
      console.log(`CREATE ${eq.code} — ${eq.name}`);
      created++;
    }
  }

  const all = await prisma.equipment.findMany({ orderBy: { code: 'asc' } });
  const byStatus = all.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`\nTong cong ${all.length} thiet bi (tao moi ${created}, cap nhat ${updated}):`);
  console.log(`  Trang thai: ${JSON.stringify(byStatus)}`);
  const byType = all.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  Phan loai: ${JSON.stringify(byType)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
