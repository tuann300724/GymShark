CREATE OR ALTER PROCEDURE [dbo].[sp_public_schedule]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (50) s.id, s.title, s.trainerId, s.memberId, s.branchId, s.roomId, s.type,
           s.startTime, s.endTime, s.status, s.description, s.notes, s.cancellationNote,
           s.completedAt, s.createdAt, s.updatedAt,
           t.id AS trainer_id, u.id AS trainerUser_id, u.fullName AS trainerUser_fullName,
           u.avatarUrl AS trainerUser_avatarUrl,
           r.id AS room_id, r.name AS room_name, r.capacity AS room_capacity
    FROM dbo.training_schedules s
    JOIN dbo.trainers t ON s.trainerId = t.id
    JOIN dbo.users u ON t.userId = u.id
    LEFT JOIN dbo.rooms r ON s.roomId = r.id
    WHERE s.memberId IS NULL AND s.startTime >= GETUTCDATE() AND s.status = 'SCHEDULED'
    ORDER BY s.startTime ASC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
