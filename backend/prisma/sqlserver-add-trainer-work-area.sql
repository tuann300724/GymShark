-- ===========================================================================
-- Khu vực dạy của PT (địa chỉ + toạ độ) — hội viên xem PT có gần mình không
--
--   * Trainer.workAddress / workLatitude / workLongitude
--
-- Chỉ THÊM cột (NULL). Idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-trainer-work-area.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51084, 'Refusing to run trainer work area migration outside gym_db.', 1;

IF COL_LENGTH(N'dbo.Trainer', N'workAddress') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [workAddress] NVARCHAR(500) NULL;
IF COL_LENGTH(N'dbo.Trainer', N'workLatitude') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [workLatitude] FLOAT NULL;
IF COL_LENGTH(N'dbo.Trainer', N'workLongitude') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [workLongitude] FLOAT NULL;
