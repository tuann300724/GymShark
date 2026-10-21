CREATE OR ALTER PROCEDURE [dbo].[sp_branches_stats]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @now DATETIME2 = GETDATE();
    DECLARE @startOfMonth DATETIME2 = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
    DECLARE @startOfToday DATETIME2 = CAST(CAST(GETDATE() AS DATE) AS DATETIME2);

    SELECT
      (SELECT COUNT(*) FROM dbo.members WHERE branchId = @id) AS totalMembers,
      (SELECT COUNT(DISTINCT ms.memberId)
         FROM dbo.memberships ms
         JOIN dbo.members m ON ms.memberId = m.id
         WHERE ms.status = 'ACTIVE' AND ms.endDate >= @now AND m.branchId = @id) AS activeMembers,
      (SELECT COUNT(*) FROM dbo.trainers t
         JOIN dbo.users u ON t.userId = u.id
         WHERE t.status = 'ACTIVE' AND u.branchId = @id) AS totalTrainers,
      (SELECT COUNT(*) FROM dbo.equipment WHERE branchId = @id) AS equipmentCount,
      (SELECT COUNT(*) FROM dbo.rooms WHERE branchId = @id AND status = 'AVAILABLE') AS roomAvailable,
      (SELECT COUNT(*) FROM dbo.rooms WHERE branchId = @id) AS roomCount,
      (SELECT COUNT(*) FROM dbo.check_ins WHERE branchId = @id AND checkInTime >= @startOfToday) AS checkInsToday,
      (SELECT ISNULL(SUM(p.amount), 0) FROM dbo.payments p
         JOIN dbo.members m ON p.memberId = m.id
         WHERE p.status = 'PAID' AND m.branchId = @id AND p.paidAt >= @startOfMonth) AS revenueThisMonth,
      (SELECT COUNT(*) FROM dbo.training_schedules
         WHERE branchId = @id AND status = 'SCHEDULED' AND startTime >= @now) AS upcomingSessions;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
