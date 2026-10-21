CREATE OR ALTER PROCEDURE [dbo].[sp_public_home_stats]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      (SELECT COUNT(*) FROM dbo.members) AS totalMembers,
      (SELECT COUNT(*) FROM dbo.trainers WHERE status = 'ACTIVE') AS totalTrainers,
      (SELECT COUNT(*) FROM dbo.branches WHERE status = 'ACTIVE') AS totalBranches;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
