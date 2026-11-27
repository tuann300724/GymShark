-- ===========================================================================
-- Đối tác tự quản lý phòng gym (đợt 2) — PT, phòng tập, nhân viên theo đối tác
--
--   * Trainer.ownerPartnerId — PT của phòng gym đối tác
--   * Room.ownerPartnerId    — phòng tập / phòng lớp của đối tác
--   * User.ownerPartnerId    — nhân viên của đối tác (role PARTNER) và tài khoản PT đối tác tạo
--   Lịch tập, lớp học, booking lọc theo PT nên không cần thêm cột.
--   NULL = dữ liệu hệ thống Gym Master (toàn bộ dữ liệu hiện có giữ NULL).
--
-- Chỉ THÊM cột + index. Idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-partner-tenancy-2.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51071, 'Refusing to run partner tenancy (phase 2) migration outside gym_db.', 1;

IF COL_LENGTH(N'dbo.Trainer', N'ownerPartnerId') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [ownerPartnerId] NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.Room', N'ownerPartnerId') IS NULL
  ALTER TABLE [dbo].[Room] ADD [ownerPartnerId] NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.User', N'ownerPartnerId') IS NULL
  ALTER TABLE [dbo].[User] ADD [ownerPartnerId] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'Trainer_ownerPartnerId_idx' AND object_id = OBJECT_ID(N'dbo.Trainer'))
  EXEC(N'CREATE INDEX [Trainer_ownerPartnerId_idx] ON [dbo].[Trainer]([ownerPartnerId]);');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'Room_ownerPartnerId_idx' AND object_id = OBJECT_ID(N'dbo.Room'))
  EXEC(N'CREATE INDEX [Room_ownerPartnerId_idx] ON [dbo].[Room]([ownerPartnerId]);');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'User_ownerPartnerId_idx' AND object_id = OBJECT_ID(N'dbo.User'))
  EXEC(N'CREATE INDEX [User_ownerPartnerId_idx] ON [dbo].[User]([ownerPartnerId]);');
