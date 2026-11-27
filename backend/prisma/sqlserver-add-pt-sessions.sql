-- ===========================================================================
-- Tính năng:
--   1) User.mustChangePassword — PT / đối tác được cấp mật khẩu tạm phải đổi ở lần đăng nhập đầu
--   2) Trainer.commissionRate — % chiết khấu GymMaster giữ lại trên mỗi buổi PT (admin chỉnh)
--   3) PtSession — hội viên tự đặt buổi với PT qua chat: PT đề nghị → hội viên chấp nhận +
--      thanh toán (Payment) → admin xác nhận → tạo TrainingSchedule; chia chiết khấu cho PT sau
--   4) Message.ptSessionId — tin nhắn thẻ "đề nghị buổi tập" trong chat
--
-- CHẠY THỦ CÔNG (không dùng `prisma db push`). Script idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-pt-sessions.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51043, 'Refusing to run PT session migration outside gym_db.', 1;

IF COL_LENGTH(N'dbo.User', N'mustChangePassword') IS NULL
  ALTER TABLE [dbo].[User]
    ADD [mustChangePassword] BIT NOT NULL
      CONSTRAINT [DF_User_mustChangePassword] DEFAULT 0;

IF COL_LENGTH(N'dbo.Trainer', N'commissionRate') IS NULL
  ALTER TABLE [dbo].[Trainer]
    ADD [commissionRate] DECIMAL(5, 2) NOT NULL
      CONSTRAINT [DF_Trainer_commissionRate] DEFAULT 20;

IF OBJECT_ID(N'dbo.PtSession', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[PtSession] (
    -- Khoá theo kiểu thật của DB (Trainer.id / Member.id là UNIQUEIDENTIFIER)
    [id]             UNIQUEIDENTIFIER NOT NULL,
    [trainerId]      UNIQUEIDENTIFIER NOT NULL,
    [memberId]       UNIQUEIDENTIFIER NOT NULL,
    [conversationId] UNIQUEIDENTIFIER NULL,
    [title]          NVARCHAR(400)  NOT NULL,
    [note]           NVARCHAR(MAX)  NULL,
    [startTime]      DATETIME2      NOT NULL,
    [endTime]        DATETIME2      NOT NULL,
    [price]          DECIMAL(12, 2) NOT NULL,
    [commissionRate] DECIMAL(5, 2)  NOT NULL,
    [platformFee]    DECIMAL(12, 2) NOT NULL,
    [trainerEarning] DECIMAL(12, 2) NOT NULL,
    [status]         NVARCHAR(20)   NOT NULL CONSTRAINT [PtSession_status_df] DEFAULT N'OFFERED',
    [declineReason]  NVARCHAR(500)  NULL,
    [paymentId]      UNIQUEIDENTIFIER NULL,
    [scheduleId]     UNIQUEIDENTIFIER NULL,
    [respondedAt]    DATETIME2      NULL,
    [paidAt]         DATETIME2      NULL,
    [payoutStatus]   NVARCHAR(20)   NOT NULL CONSTRAINT [PtSession_payoutStatus_df] DEFAULT N'UNPAID',
    [payoutAt]       DATETIME2      NULL,
    [payoutById]     UNIQUEIDENTIFIER NULL,
    [createdAt]      DATETIME2      NOT NULL CONSTRAINT [PtSession_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]      DATETIME2      NOT NULL,
    CONSTRAINT [PtSession_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PtSession_trainerId_fkey] FOREIGN KEY ([trainerId])
      REFERENCES [dbo].[Trainer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [PtSession_memberId_fkey] FOREIGN KEY ([memberId])
      REFERENCES [dbo].[Member]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
  );
  CREATE INDEX [PtSession_trainerId_idx] ON [dbo].[PtSession]([trainerId]);
  CREATE INDEX [PtSession_memberId_idx] ON [dbo].[PtSession]([memberId]);
  CREATE INDEX [PtSession_status_idx] ON [dbo].[PtSession]([status]);
  CREATE INDEX [PtSession_paymentId_idx] ON [dbo].[PtSession]([paymentId]);
  CREATE INDEX [PtSession_payoutStatus_idx] ON [dbo].[PtSession]([payoutStatus]);
END;

IF COL_LENGTH(N'dbo.Message', N'ptSessionId') IS NULL
  ALTER TABLE [dbo].[Message] ADD [ptSessionId] UNIQUEIDENTIFIER NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Message_ptSessionId_fkey')
  ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_ptSessionId_fkey]
    FOREIGN KEY ([ptSessionId]) REFERENCES [dbo].[PtSession]([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'Message_ptSessionId_idx' AND object_id = OBJECT_ID(N'dbo.Message'))
  EXEC(N'CREATE INDEX [Message_ptSessionId_idx] ON [dbo].[Message]([ptSessionId])');
