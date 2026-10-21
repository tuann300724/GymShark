CREATE OR ALTER PROCEDURE [dbo].[sp_members_attendance_stats]
  @memberId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      (SELECT COUNT(*) FROM dbo.check_ins WHERE memberId = @memberId) AS totalVisits,
      (SELECT MAX(checkInTime) FROM dbo.check_ins WHERE memberId = @memberId) AS lastVisit,
      (SELECT COUNT(*) FROM dbo.check_ins WHERE memberId = @memberId AND checkOutTime IS NOT NULL) AS doneCount,
      (SELECT SUM(DATEDIFF(MINUTE, checkInTime, checkOutTime)) FROM dbo.check_ins
        WHERE memberId = @memberId AND checkOutTime IS NOT NULL) AS totalMinutes;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
