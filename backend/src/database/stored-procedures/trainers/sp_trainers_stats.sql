CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_stats]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      (SELECT COUNT(*) FROM dbo.training_schedules WHERE trainerId = @id) AS totalSessions,
      (SELECT COUNT(*) FROM dbo.trainer_members WHERE trainerId = @id AND status = 'ACTIVE') AS activeMembers,
      (SELECT COUNT(*) FROM dbo.training_schedules WHERE trainerId = @id AND status = 'SCHEDULED' AND startTime >= GETDATE()) AS upcomingSessions,
      (SELECT COUNT(*) FROM dbo.training_schedules WHERE trainerId = @id AND status = 'COMPLETED') AS completedSessions;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
