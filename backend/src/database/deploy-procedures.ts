import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: __dirname + '/../.env' });

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppDataSource } from './typeorm.config';

/**
 * Deploy toàn bộ Stored Procedure trong thư mục stored-procedures/ vào SQL Server.
 *
 * Mỗi file .sql chứa đúng MỘT thủ tục, bắt đầu bằng CREATE OR ALTER PROCEDURE
 * (idempotent — chạy lại vẫn ổn, không cần DROP). Lưu ý kỹ thuật:
 *   - CREATE OR ALTER PROCEDURE phải là câu ĐẦU batch -> mỗi file chạy riêng 1 lần query();
 *   - không dùng GO (GO là keyword của sqlcmd, driver T-SQL không hiểu).
 *
 * Chạy: npm run db:sps
 */
async function main() {
  const spDir = join(__dirname, 'stored-procedures');
  function getAllSqlFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getAllSqlFiles(fullPath));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.sql')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const files = getAllSqlFiles(spDir).sort((a, b) => a.localeCompare(b)); // deploy theo tên file — ổn định, lặp lại được

  if (files.length === 0) {
    console.log('⚠️  Khong tim thay file .sql nao trong', spDir);
    return;
  }

  await AppDataSource.initialize();
  console.log(`🔗 SQL Server connected — bat deploy ${files.length} stored procedure...\n`);

  let ok = 0;
  let fail = 0;

  for (const filePath of files) {
    // Bỏ dòng "GO" (keyword của sqlcmd, driver T-SQL không hiểu) để file .sql
    // viết được theo phong cách SSMS mà vẫn deploy được qua driver.
    const sql = readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim().toUpperCase() !== 'GO')
      .join('\n')
      .trim();
    const file = filePath.slice(spDir.length + 1);
    if (!sql) {
      console.log(`  ⏭️  ${file} (rong, bo qua)`);
      continue;
    }
    try {
      // dataSource.query thi hanh truc tiep T-SQL — da setup SET options an toan trong connection.
      await AppDataSource.query(sql);
      console.log(`  ✅ ${file}`);
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  ❌ ${file}: ${msg}`);
      fail++;
    }
  }

  await AppDataSource.destroy();
  console.log(`\n${'-'.repeat(40)}`);
  console.log(`Deploy xong: ${ok} thanh cong, ${fail} loi`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('❌ Loi deploy stored procedure:', e);
  process.exitCode = 1;
});
