#!/usr/bin/node
const fs = require('fs');
const path = require('path');
const entDir = 'backend/src/database/entities';
// SQL Server -> PostgreSQL compatible types
const re = [
  [/type:\s*'datetime2'/g, "type: 'timestamp'"],
  [/type:\s*'nvarchar'/g, "type: 'varchar'"],
  [/type:\s*'ntext'/g, "type: 'text'"],
  [/type:\s*'varbinary'/g, "type: 'bytea'"],
  [/type:\s*'uniqueidentifier'/g, "type: 'uuid'"],
  [/type:\s*'money'/g, "type: 'numeric'"],
  [/type:\s*'image'/g, "type: 'text'"],
  [/type:\s*'bit'/g, "type: 'boolean'"],
  [/default:\s*\(\)\s*=>\s*'SYSUTCDATETIME\(\)'/g, "default: () => 'CURRENT_TIMESTAMP'"],
];
fs.readdirSync(entDir).filter(f => f.endsWith('.entity.ts')).forEach(f => {
  const fp = path.join(entDir, f);
  let c = fs.readFileSync(fp, 'utf8');
  re.forEach(([pat, rep]) => { c = c.replace(pat, rep); });
  fs.writeFileSync(fp, c, 'utf8');
  console.log('fixed:', f);
});
console.log('Done.');
