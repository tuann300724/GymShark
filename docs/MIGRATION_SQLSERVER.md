# Migration Guide — PostgreSQL → SQL Server (GymShark)

## Commit reference: `81ac2e4` (2026-10-21)

### 1. Completed (100%)
- **SP:** 185 / 185 deployed (`0 errors`)
- **Schema:** 28 SQL Server tables mapped via TypeORM entities
- **Data:** counts verified (users 22, members 12, payments 14, audit_logs 200, check_ins 78, etc.)
- **Adapters + tokens:** 20 modules (`auth`, `members`, `memberships`, `payments`, `invoices`, `branches`, `packages`, `trainers`, `equipment`, `checkins`, `audit-logs`, `foods`, `promotions`, `notifications`, `public`, `reports`, `schedules`, `chat`, `faces`, `meal-plans`)
- **SP source of truth:** `backend/src/database/stored-procedures/`

### 2. Service Layer Status (56% clean)
Clean (`this.prisma.` = 0): `audit-logs`, `auth`, `branches`, `equipment`, `foods`, `invoices`, `memberships`, `packages`, `payments`, `public`, `trainers` (restored), `users`.

Remaining (`this.prisma.` count):
- `chat` (24), `reports` (64), `schedules` (36), `checkins` (23)
- `faces` (17), `meal-plans` (17), `member` (48), `notifications` (11), `promotions` (25)

### 3. Remaining Phase 3 Cutover
- [ ] `backend/.env`: `DATABASE_URL` → SQL Server (`postgresql` → `mssql`)
- [ ] `backend/src/app.module.ts`: remove `PrismaModule` import + usage
- [ ] `backend/src/modules/trainers/trainers.service.ts`: complete adapter rewrite (currently restored original for build stability)
- [ ] 10 modules above: replace remaining `this.prisma.` calls with `this.repo.` / `DataSource`
- [ ] Verify `npm run build` PASS + `npm run start:dev` starts with `database: "connected"`

### 4. Rules (do not break)
- SP file = 1 procedure; start with `CREATE OR ALTER PROCEDURE [dbo].[sp_...]`
- `SET NOCOUNT ON;` + `BEGIN TRY ... END CATCH` + `BEGIN TRANSACTION` / `ROLLBACK`
- UUID PK from TypeScript (`randomUUID()`); no `SCOPE_IDENTITY()`
- `DataSource` injectable globally (`TypeOrmModule.forRoot()` = `@Global()`)
- Palette unchanged (`DESIGN_SYSTEM.md`): dark default `#0B0D0F`, neon `#B7FF00`, fonts `Barlow Condensed` + `Be Vietnam Pro`
- Commit message: `feat(backend): ...` / `fix(admin): ...` / `docs: ...`
