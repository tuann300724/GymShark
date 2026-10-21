CREATE OR ALTER PROCEDURE [dbo].[sp_chat_sync_assignments]
  @trainerId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    IF @trainerId IS NOT NULL
    BEGIN
      INSERT INTO dbo.conversations (id, trainerId, memberId, status, createdAt, updatedAt)
      SELECT NEWID(), @trainerId, tm.memberId, 'ACTIVE', GETDATE(), GETDATE()
      FROM dbo.trainer_members tm
      WHERE tm.trainerId = @trainerId AND tm.status = 'ACTIVE'
      AND NOT EXISTS (
        SELECT 1 FROM dbo.conversations c WHERE c.trainerId = @trainerId AND c.memberId = tm.memberId
      );
    END
    IF @memberId IS NOT NULL
    BEGIN
      INSERT INTO dbo.conversations (id, trainerId, memberId, status, createdAt, updatedAt)
      SELECT NEWID(), tm.trainerId, @memberId, 'ACTIVE', GETDATE(), GETDATE()
      FROM dbo.trainer_members tm
      WHERE tm.memberId = @memberId AND tm.status = 'ACTIVE'
      AND NOT EXISTS (
        SELECT 1 FROM dbo.conversations c WHERE c.memberId = @memberId AND c.trainerId = tm.trainerId
      );
    END
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
