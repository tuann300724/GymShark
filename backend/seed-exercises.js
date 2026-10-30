const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function seed() {
  const list = [
    { id: 'ex-001', name: 'Đẩy ngực (Barbell Bench Press)', group: 'Ngực', equipment: 'Tạ đòn', description: 'Bài tập ngực cổ điển' },
    { id: 'ex-002', name: 'Búa đẩy ngực (Dumbbell Press)', group: 'Ngực', equipment: 'Tạ tay', description: '' },
    { id: 'ex-003', name: 'Kéo xô lưng (Seated Row)', group: 'Lưng', equipment: 'Máy', description: '' },
    { id: 'ex-004', name: 'Deadlift', group: 'Lưng / Chân', equipment: 'Tạ đòn', description: '' },
    { id: 'ex-005', name: 'Squat', group: 'Chân', equipment: 'Tạ đòn', description: '' },
    { id: 'ex-006', name: 'Leg Press', group: 'Chân', equipment: 'Máy', description: '' },
    { id: 'ex-007', name: 'Plank', group: 'Core', equipment: 'Không', description: '' },
    { id: 'ex-008', name: 'Dips (Chống đẩy)', group: 'Ngực / Tay', equipment: 'Thanh xà', description: '' },
  ];
  for (const ex of list) {
    try {
      await p.exercise.create({
        data: {
          id: ex.id,
          name: ex.name,
          group: ex.group,
          equipment: ex.equipment,
          description: ex.description,
          imageUrl: null,
          enName: ex.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      console.log('skip', ex.id);
    }
  }
  console.log('Seeded', list.length, 'exercises');
  await p.$disconnect();
}
seed();
