const { PrismaClient } = require('@prisma/client');
const seeds = require('./prisma/food-seeds.json');
const prisma = new PrismaClient();

(async () => {
  let created = 0, updated = 0;
  for (const s of seeds) {
    const existing = await prisma.food.findFirst({ where: { name: s.name } });
    const payload = {
      name: s.name,
      category: s.category,
      servingSize: s.servingSize,
      servingUnit: s.servingUnit,
      caloriesPer100g: s.caloriesPer100g,
      proteinPer100g: s.proteinPer100g,
      carbsPer100g: s.carbsPer100g,
      fatPer100g: s.fatPer100g,
      description: s.description,
      isActive: true,
    };
    if (existing) {
      await prisma.food.update({ where: { id: existing.id }, data: payload });
      updated++;
    } else {
      await prisma.food.create({ data: payload });
      created++;
    }
  }
  console.log('Food seeds: +'+created+' new, '+updated+' updated (total '+seeds.length+')');
  await prisma.$disconnect();
})();
