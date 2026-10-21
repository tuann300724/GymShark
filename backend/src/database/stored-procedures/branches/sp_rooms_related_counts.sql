CREATE OR ALTER PROCEDURE [dbo].[sp_rooms_related_counts]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      (SELECT COUNT(*) FROM dbo.equipment WHERE roomId = @id) AS equipmentCount,
      (SELECT COUNT(*) FROM dbo.training_schedules WHERE roomId = @id) AS scheduleCount;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
