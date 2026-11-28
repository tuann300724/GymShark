-- ===========================================================================
-- Lịch sử chi hoa hồng cho đối tác Gym Cộng đồng
--
--   * PartnerPayout            — mỗi lần admin chuyển hoa hồng (số tiền, số lượt, ảnh chứng từ)
--   * CheckIn.partnerPayoutId  — lượt check-in đã được chi trong lần nào (NULL = chưa chi)
--
-- Chỉ THÊM bảng/cột/index. Idempotent, chạy lại an toàn.
-- Khoá dùng UNIQUEIDENTIFIER cho khớp kiểu thật của Partner.id / CheckIn.partnerId.
--
--   npx prisma db execute --file prisma/sqlserver-add-partner-payouts.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51082, 'Refusing to run partner payout migration outside gym_db.', 1;

IF OBJECT_ID(N'dbo.PartnerPayout', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[PartnerPayout] (
    [id]         UNIQUEIDENTIFIER NOT NULL,
    [partnerId]  UNIQUEIDENTIFIER NOT NULL,
    [amount]     DECIMAL(12, 2)   NOT NULL,
    [visitCount] INT              NOT NULL,
    [periodFrom] DATETIME2        NULL,
    [periodTo]   DATETIME2        NULL,
    [proofImage] NVARCHAR(MAX)    NOT NULL,
    [note]       NVARCHAR(500)    NULL,
    [paidById]   UNIQUEIDENTIFIER NULL,
    [createdAt]  DATETIME2        NOT NULL CONSTRAINT [PartnerPayout_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PartnerPayout_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PartnerPayout_partnerId_fkey] FOREIGN KEY ([partnerId])
      REFERENCES [dbo].[Partner]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
  );
  CREATE INDEX [PartnerPayout_partnerId_createdAt_idx] ON [dbo].[PartnerPayout]([partnerId], [createdAt]);
END;

IF COL_LENGTH(N'dbo.CheckIn', N'partnerPayoutId') IS NULL
  ALTER TABLE [dbo].[CheckIn] ADD [partnerPayoutId] UNIQUEIDENTIFIER NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CheckIn_PartnerPayout')
  EXEC(N'ALTER TABLE [dbo].[CheckIn] ADD CONSTRAINT [FK_CheckIn_PartnerPayout]
         FOREIGN KEY ([partnerPayoutId]) REFERENCES [dbo].[PartnerPayout]([id])
         ON DELETE NO ACTION ON UPDATE NO ACTION;');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'CheckIn_partnerPayoutId_idx' AND object_id = OBJECT_ID(N'dbo.CheckIn'))
  EXEC(N'CREATE INDEX [CheckIn_partnerPayoutId_idx] ON [dbo].[CheckIn]([partnerPayoutId]);');
