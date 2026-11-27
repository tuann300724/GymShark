-- ===========================================================================
-- Tính năng: Bảng giá gói hợp tác + loại hợp tác & thời hạn hợp đồng đối tác
--
--   * PartnershipPlan: bảng giá 2 gói (OWNER 699.000đ, COMMUNITY 799.000đ) — admin sửa được
--   * Partner: partnershipType, monthlyFee, contractStartAt, contractEndAt
--   * Backfill đối tác cũ: loại lấy từ yêu cầu hợp tác cùng email, thời hạn 1 tháng (gói tính theo tháng)
--     kể từ ngày tạo đối tác, phí = giá gói hiện tại.
--
-- Chỉ THÊM cột/bảng và điền giá trị còn trống. Idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-partnership-plans.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51051, 'Refusing to run partnership plans migration outside gym_db.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'PartnershipPlan' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
  CREATE TABLE [dbo].[PartnershipPlan] (
    [code]         NVARCHAR(40)   NOT NULL,
    [name]         NVARCHAR(400)  NOT NULL,
    [monthlyPrice] DECIMAL(12, 2) NOT NULL,
    [updatedBy]    NVARCHAR(100)  NULL,
    [updatedAt]    DATETIME2      NOT NULL CONSTRAINT [DF_PartnershipPlan_updatedAt] DEFAULT GETDATE(),
    CONSTRAINT [PK_PartnershipPlan] PRIMARY KEY ([code])
  );
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[PartnershipPlan] WHERE [code] = N'OWNER')
  INSERT INTO [dbo].[PartnershipPlan] ([code], [name], [monthlyPrice]) VALUES (N'OWNER', N'Quản lý phòng gym riêng', 699000);
IF NOT EXISTS (SELECT 1 FROM [dbo].[PartnershipPlan] WHERE [code] = N'COMMUNITY')
  INSERT INTO [dbo].[PartnershipPlan] ([code], [name], [monthlyPrice]) VALUES (N'COMMUNITY', N'Lên Gym Cộng đồng', 799000);

IF COL_LENGTH(N'dbo.Partner', N'partnershipType') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [partnershipType] NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.Partner', N'monthlyFee') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [monthlyFee] DECIMAL(12, 2) NULL;
IF COL_LENGTH(N'dbo.Partner', N'contractStartAt') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [contractStartAt] DATETIME2 NULL;
IF COL_LENGTH(N'dbo.Partner', N'contractEndAt') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [contractEndAt] DATETIME2 NULL;
-- Backfill — chạy qua EXEC để SQL Server biên dịch sau khi các cột ở trên đã tồn tại
EXEC(N'
UPDATE p
SET p.[partnershipType] = COALESCE(
      (SELECT TOP 1 l.[direction] FROM [dbo].[PartnerLead] l
        WHERE l.[email] = p.[email] ORDER BY l.[createdAt] DESC),
      N''OWNER'')
FROM [dbo].[Partner] p
WHERE p.[partnershipType] IS NULL;

UPDATE p
SET p.[monthlyFee] = pl.[monthlyPrice]
FROM [dbo].[Partner] p
JOIN [dbo].[PartnershipPlan] pl ON pl.[code] = p.[partnershipType]
WHERE p.[monthlyFee] IS NULL;

UPDATE [dbo].[Partner]
SET [contractStartAt] = [createdAt],
    [contractEndAt]   = DATEADD(MONTH, 1, [createdAt])
WHERE [contractStartAt] IS NULL AND [status] = N''APPROVED'';
');
