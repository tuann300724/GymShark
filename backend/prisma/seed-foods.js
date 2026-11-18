// Seed thư viện thực phẩm từ prisma/food-seeds.json (77 món).
// Idempotent theo tên (trim, không phân biệt hoa thường) — món đã có thì bỏ qua.
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'node_modules', '@prisma/client'));
const prisma = new PrismaClient();

const seeds = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'food-seeds.json'), 'utf8'),
);

(async () => {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', status: 'ACTIVE' },
    select: { id: true, email: true },
  });
  if (!admin) {
    console.error('KHONG TIM THAY ADMIN — dung.');
    process.exit(2);
  }

  const existing = await prisma.food.findMany({ select: { name: true } });
  const known = new Set(existing.map((f) => f.name.trim().toLowerCase()));

  let created = 0;
  let skipped = 0;
  for (const f of seeds) {
    const key = String(f.name).trim().toLowerCase();
    if (known.has(key)) {
      skipped += 1;
      continue;
    }
    await prisma.food.create({
      data: {
        name: String(f.name).trim(),
        category: f.category,
        servingSize: f.servingSize ?? 100,
        servingUnit: f.servingUnit ?? 'g',
        caloriesPer100g: f.caloriesPer100g ?? 0,
        proteinPer100g: f.proteinPer100g ?? 0,
        carbsPer100g: f.carbsPer100g ?? 0,
        fatPer100g: f.fatPer100g ?? 0,
        description: f.description ?? null,
        createdById: admin.id,
      },
    });
    known.add(key);
    created += 1;
  }

  const total = await prisma.food.count();
  console.log(
    `Seed thuc pham: +${created} tao moi, ${skipped} bo qua (da co). Tong hien co: ${total}`,
  );
  await prisma.$disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
