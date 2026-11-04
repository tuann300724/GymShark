const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  try {
    await p.$executeRawUnsafe('IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'Program\' AND COLUMN_NAME = \'trainerId\') ALTER TABLE Program ADD trainerId NVARCHAR(100) NULL');
    await p.$executeRawUnsafe('IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'Program\' AND COLUMN_NAME = \'memberId\') ALTER TABLE Program ADD memberId NVARCHAR(100) NULL');
    await p.$executeRawUnsafe('IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'Program\' AND COLUMN_NAME = \'status\') ALTER TABLE Program ADD status NVARCHAR(400) DEFAULT \'DRAFT\'');
    await p.$executeRawUnsafe('IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'Program\' AND COLUMN_NAME = \'isTemplate\') ALTER TABLE Program ADD isTemplate BIT DEFAULT 0');
    console.log('Program columns updated');
  } catch (e) {
    console.error('Error:', e.message || e);
  } finally {
    await p.$disconnect();
  }
}
run();
