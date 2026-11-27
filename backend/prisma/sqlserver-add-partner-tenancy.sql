-- ===========================================================================
-- Tính năng: Đối tác tự quản lý phòng gym (đợt 1) — tách dữ liệu theo đối tác
--
--   * Member.ownerPartnerId            — hội viên riêng của phòng gym đối tác
--   * MembershipPackage.ownerPartnerId — gói tập riêng của phòng gym đối tác
--   NULL = dữ liệu của hệ thống Gym Master (toàn bộ dữ liệu hiện có giữ NULL).
--   Thẻ hội viên, thanh toán, hoá đơn lọc theo hội viên nên không cần thêm cột.
--
-- Chỉ THÊM cột + index, không sửa dữ liệu. Idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-partner-tenancy.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51061, 'Refusing to run partner tenancy migration outside gym_db.', 1;

IF COL_LENGTH(N'dbo.Member', N'ownerPartnerId') IS NULL
  ALTER TABLE [dbo].[Member] ADD [ownerPartnerId] NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.MembershipPackage', N'ownerPartnerId') IS NULL
  ALTER TABLE [dbo].[MembershipPackage] ADD [ownerPartnerId] NVARCHAR(100) NULL;

-- Index tạo qua EXEC để SQL Server biên dịch sau khi cột đã tồn tại
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'Member_ownerPartnerId_idx' AND object_id = OBJECT_ID(N'dbo.Member'))
  EXEC(N'CREATE INDEX [Member_ownerPartnerId_idx] ON [dbo].[Member]([ownerPartnerId]);');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'MembershipPackage_ownerPartnerId_idx' AND object_id = OBJECT_ID(N'dbo.MembershipPackage'))
  EXEC(N'CREATE INDEX [MembershipPackage_ownerPartnerId_idx] ON [dbo].[MembershipPackage]([ownerPartnerId]);');
