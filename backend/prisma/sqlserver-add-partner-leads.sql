-- ===========================================================================
-- Tính năng: Yêu cầu hợp tác từ trang đăng ký đối tác (PartnerLead)
--
-- CHẠY THỦ CÔNG (không dùng `prisma db push` — DB đang có drift kiểu
-- uniqueidentifier ở các bảng cũ). Script idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-partner-leads.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51032, 'Refusing to run partner leads migration outside gym_db.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'PartnerLead' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
  CREATE TABLE [dbo].[PartnerLead] (
    [id]          NVARCHAR(100) NOT NULL,
    [direction]   NVARCHAR(40)  NOT NULL,
    [contactName] NVARCHAR(400) NOT NULL,
    [address]     NVARCHAR(MAX) NULL,
    [email]       NVARCHAR(400) NOT NULL,
    [phone]       NVARCHAR(400) NOT NULL,
    [message]     NVARCHAR(MAX) NULL,
    [status]      NVARCHAR(40)  NOT NULL DEFAULT N'NEW',
    [handledBy]   NVARCHAR(100) NULL,
    [handledAt]   DATETIME2     NULL,
    [notes]       NVARCHAR(MAX) NULL,
    [ip]          NVARCHAR(100) NULL,
    [createdAt]   DATETIME2     NOT NULL DEFAULT GETDATE(),
    [updatedAt]   DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_PartnerLead] PRIMARY KEY ([id])
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PartnerLead_status' AND object_id = OBJECT_ID(N'dbo.PartnerLead'))
  CREATE INDEX [IX_PartnerLead_status] ON [dbo].[PartnerLead]([status]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PartnerLead_createdAt' AND object_id = OBJECT_ID(N'dbo.PartnerLead'))
  CREATE INDEX [IX_PartnerLead_createdAt] ON [dbo].[PartnerLead]([createdAt]);
