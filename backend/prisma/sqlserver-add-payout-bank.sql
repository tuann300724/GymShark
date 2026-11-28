-- ===========================================================================
-- Tài khoản nhận tiền (STK ngân hàng + ảnh QR) cho đối tác và PT
--
--   * Partner.bank*  — đối tác Gym Cộng đồng nhận hoa hồng lượt tập
--   * Trainer.bank*  — PT nhận phần tiền buổi tập
--   Admin dùng để chuyển khoản ở trang Báo cáo doanh thu.
--
-- Chỉ THÊM cột (NULL). Idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-payout-bank.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51081, 'Refusing to run payout bank migration outside gym_db.', 1;

IF COL_LENGTH(N'dbo.Partner', N'bankCode') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [bankCode] NVARCHAR(20) NULL;
IF COL_LENGTH(N'dbo.Partner', N'bankName') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [bankName] NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Partner', N'bankAccountNumber') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [bankAccountNumber] NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.Partner', N'bankAccountName') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [bankAccountName] NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Partner', N'bankQrImage') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [bankQrImage] NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.Partner', N'bankUpdatedAt') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [bankUpdatedAt] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.Trainer', N'bankCode') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [bankCode] NVARCHAR(20) NULL;
IF COL_LENGTH(N'dbo.Trainer', N'bankName') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [bankName] NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Trainer', N'bankAccountNumber') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [bankAccountNumber] NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.Trainer', N'bankAccountName') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [bankAccountName] NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Trainer', N'bankQrImage') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [bankQrImage] NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.Trainer', N'bankUpdatedAt') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [bankUpdatedAt] DATETIME2 NULL;
