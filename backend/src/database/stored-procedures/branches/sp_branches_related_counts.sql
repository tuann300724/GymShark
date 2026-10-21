CREATE OR ALTER PROCEDURE [dbo].[sp_branches_related_counts]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      (SELECT COUNT(*) FROM dbo.members WHERE branchId = @id) AS memberCount,
      (SELECT COUNT(*) FROM dbo.check_ins WHERE branchId = @id) AS checkInCount,
      (SELECT COUNT(*) FROM dbo.equipment WHERE branchId = @id) AS equipmentCount,
      (SELECT COUNT(*) FROM dbo.rooms WHERE branchId = @id) AS roomCount,
      (SELECT COUNT(*) FROM dbo.training_schedules WHERE branchId = @id) AS scheduleCount,
      (SELECT COUNT(*) FROM dbo.users WHERE branchId = @id) AS userCount;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
