CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_schedules]
  @trainerId UNIQUEIDENTIFIER,
  @limit INT = 50
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@limit) ts.id, ts.trainerId, ts.memberId, ts.branchId, ts.roomId, ts.type, ts.title, ts.description,
           ts.startTime, ts.endTime, ts.status, ts.createdAt, ts.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName, m.phone AS member_phone,
           r.id AS room_id, r.name AS room_name,
           b.id AS branch_id, b.name AS branch_name
    FROM dbo.training_schedules ts
    LEFT JOIN dbo.members m ON ts.memberId = m.id
    LEFT JOIN dbo.rooms r ON ts.roomId = r.id
    LEFT JOIN dbo.branches b ON ts.branchId = b.id
    WHERE ts.trainerId = @trainerId
    ORDER BY ts.startTime DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END