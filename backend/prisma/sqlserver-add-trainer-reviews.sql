-- ===========================================================================
-- Tính năng: Đánh giá huấn luyện viên (TrainerReview)
--
-- CHẠY THỦ CÔNG (không dùng `prisma db push` — DB đang có drift kiểu
-- uniqueidentifier ở các bảng cũ). Script idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-trainer-reviews.sql --schema prisma/schema.prisma
--   npx prisma generate
--
-- LƯU Ý: các cột id/trainerId/memberId của Trainer, Member trong DB thực tế
-- là UNIQUEIDENTIFIER dù schema khai báo NVarChar(100) — khóa ngoại vì thế
-- cũng dùng UNIQUEIDENTIFIER.
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51031, 'Refusing to run trainer reviews migration outside gym_db.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'TrainerReview' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
  CREATE TABLE [dbo].[TrainerReview] (
    [id]        NVARCHAR(100)    NOT NULL,
    [trainerId] UNIQUEIDENTIFIER NOT NULL,
    [memberId]  UNIQUEIDENTIFIER NOT NULL,
    [rating]    INT              NOT NULL,
    [comment]   NVARCHAR(2000)   NULL,
    [createdAt] DATETIME2        NOT NULL DEFAULT GETDATE(),
    [updatedAt] DATETIME2        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_TrainerReview] PRIMARY KEY ([id]),
    CONSTRAINT [UQ_TrainerReview_trainerId_memberId] UNIQUE ([trainerId], [memberId]),
    CONSTRAINT [FK_TrainerReview_Trainer] FOREIGN KEY ([trainerId]) REFERENCES [dbo].[Trainer]([id]),
    CONSTRAINT [FK_TrainerReview_Member] FOREIGN KEY ([memberId]) REFERENCES [dbo].[Member]([id])
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TrainerReview_trainerId' AND object_id = OBJECT_ID(N'dbo.TrainerReview'))
  CREATE INDEX [IX_TrainerReview_trainerId] ON [dbo].[TrainerReview]([trainerId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TrainerReview_memberId' AND object_id = OBJECT_ID(N'dbo.TrainerReview'))
  CREATE INDEX [IX_TrainerReview_memberId] ON [dbo].[TrainerReview]([memberId]);
