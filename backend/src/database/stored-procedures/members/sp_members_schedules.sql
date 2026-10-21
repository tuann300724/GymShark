CREATE OR ALTER PROCEDURE [dbo].[sp_members_schedules]
  @memberId UNIQUEIDENTIFIER,
  @top INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@top)
           s.id, s.title, s.trainerId, s.memberId, s.branchId, s.roomId, s.type,
           s.startTime, s.endTime, s.status, s.description, s.notes,
           s.cancellationNote, s.completedAt, s.createdAt, s.updatedAt,
           t.id AS trainer_id, t.specialization AS trainer_specialization, t.rating AS trainer_rating,
           tu.id AS trainerUser_id, tu.fullName AS trainerUser_fullName, tu.email AS trainerUser_email,
           tu.phone AS trainerUser_phone, tu.avatarUrl AS trainerUser_avatarUrl,
           r.id AS room_id, r.name AS room_name, r.code AS room_code, r.type AS room_type, r.capacity AS room_capacity
    FROM dbo.training_schedules s
    LEFT JOIN dbo.trainers t ON s.trainerId = t.id
    LEFT JOIN dbo.users tu ON t.userId = tu.id
    LEFT JOIN dbo.rooms r ON s.roomId = r.id
    WHERE s.memberId = @memberId
    ORDER BY s.startTime DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
