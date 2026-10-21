CREATE OR ALTER PROCEDURE [dbo].[sp_schedules_upcoming_count]
  @branchId UNIQUEIDENTIFIER = NULL,
  @roomId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS upcoming
    FROM dbo.training_schedules
    WHERE status = 'SCHEDULED' AND startTime >= GETDATE()
      AND (@branchId IS NULL OR branchId = @branchId)
      AND (@roomId IS NULL OR roomId = @roomId);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
