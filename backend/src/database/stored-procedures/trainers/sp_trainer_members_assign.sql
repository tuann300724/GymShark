CREATE OR ALTER PROCEDURE [dbo].[sp_trainer_members_assign]
  @id UNIQUEIDENTIFIER,
  @trainerId UNIQUEIDENTIFIER,
  @memberId UNIQUEIDENTIFIER,
  @startDate DATETIME2 = NULL,
  @endDate DATETIME2 = NULL,
  @note NVARCHAR(1000) = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.trainer_members (id, trainerId, memberId, startDate, endDate, note, status, createdAt, updatedAt)
    VALUES (@id, @trainerId, @memberId, ISNULL(@startDate, GETDATE()), @endDate, @note, 'ACTIVE', GETDATE(), GETDATE());
    COMMIT TRANSACTION;
    SELECT id, trainerId, memberId, startDate, endDate, note, status, createdAt, updatedAt
    FROM dbo.trainer_members WHERE id = @id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
