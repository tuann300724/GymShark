CREATE OR ALTER PROCEDURE [dbo].[sp_schedules_find_one]
  @id UNIQUEIDENTIFIER,
  @trainerId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT ts.id, ts.trainerId, ts.memberId, ts.branchId, ts.roomId, ts.type,
           ts.title, ts.description, ts.startTime, ts.endTime, ts.status,
           ts.createdAt, ts.updatedAt,
           u.fullName AS trainerName,
           m.fullName AS memberName,
           r.name AS roomName,
           b.name AS branchName
    FROM dbo.training_schedules ts
    LEFT JOIN dbo.trainers t ON ts.trainerId = t.id
    LEFT JOIN dbo.users u ON t.userId = u.id
    LEFT JOIN dbo.members m ON ts.memberId = m.id
    LEFT JOIN dbo.rooms r ON ts.roomId = r.id
    LEFT JOIN dbo.branches b ON ts.branchId = b.id
    WHERE ts.id = @id
      AND (@trainerId IS NULL OR ts.trainerId = @trainerId)
      AND (@memberId IS NULL OR ts.memberId = @memberId);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
