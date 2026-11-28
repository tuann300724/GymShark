-- ===========================================================================
-- Lịch sử chi trả thu nhập buổi PT cho huấn luyện viên
--
--   * TrainerPayout             — mỗi lần admin chi trả (số tiền, số buổi, ảnh chứng từ)
--   * PtSession.trainerPayoutId — buổi được chi trong lần nào (NULL = chưa chi / chi trước đây)
--
-- Chỉ THÊM bảng/cột/index. Idempotent, chạy lại an toàn.
-- Khoá dùng UNIQUEIDENTIFIER cho khớp kiểu thật của Trainer.id / PtSession.id.
--
--   npx prisma db execute --file prisma/sqlserver-add-trainer-payouts.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51083, 'Refusing to run trainer payout migration outside gym_db.', 1;

IF OBJECT_ID(N'dbo.TrainerPayout', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[TrainerPayout] (
    [id]           UNIQUEIDENTIFIER NOT NULL,
    [trainerId]    UNIQUEIDENTIFIER NOT NULL,
    [amount]       DECIMAL(12, 2)   NOT NULL,
    [sessionCount] INT              NOT NULL,
    [proofImage]   NVARCHAR(MAX)    NULL,
    [note]         NVARCHAR(500)    NULL,
    [paidById]     UNIQUEIDENTIFIER NULL,
    [createdAt]    DATETIME2        NOT NULL CONSTRAINT [TrainerPayout_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TrainerPayout_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TrainerPayout_trainerId_fkey] FOREIGN KEY ([trainerId])
      REFERENCES [dbo].[Trainer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
  );
  CREATE INDEX [TrainerPayout_trainerId_createdAt_idx] ON [dbo].[TrainerPayout]([trainerId], [createdAt]);
END;

IF COL_LENGTH(N'dbo.PtSession', N'trainerPayoutId') IS NULL
  ALTER TABLE [dbo].[PtSession] ADD [trainerPayoutId] UNIQUEIDENTIFIER NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PtSession_TrainerPayout')
  EXEC(N'ALTER TABLE [dbo].[PtSession] ADD CONSTRAINT [FK_PtSession_TrainerPayout]
         FOREIGN KEY ([trainerPayoutId]) REFERENCES [dbo].[TrainerPayout]([id])
         ON DELETE NO ACTION ON UPDATE NO ACTION;');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'PtSession_trainerPayoutId_idx' AND object_id = OBJECT_ID(N'dbo.PtSession'))
  EXEC(N'CREATE INDEX [PtSession_trainerPayoutId_idx] ON [dbo].[PtSession]([trainerPayoutId]);');
