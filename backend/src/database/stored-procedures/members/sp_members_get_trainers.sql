CREATE OR ALTER PROCEDURE [dbo].[sp_members_get_trainers]
  @memberId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT tm.id, tm.trainerId, tm.memberId, tm.startDate, tm.endDate, tm.status,
           tm.note, tm.createdAt, tm.updatedAt,
           t.id AS trainer_id, t.specialization AS trainer_specialization, t.rating AS trainer_rating,
           t.experienceYears AS trainer_experienceYears, t.hourlyRate AS trainer_hourlyRate,
           t.status AS trainer_status,
           u.id AS user_id, u.fullName AS user_fullName, u.phone AS user_phone,
           u.avatarUrl AS user_avatarUrl, u.email AS user_email
    FROM dbo.trainer_members tm
    LEFT JOIN dbo.trainers t ON tm.trainerId = t.id
    LEFT JOIN dbo.users u ON t.userId = u.id
    WHERE tm.memberId = @memberId
    ORDER BY tm.createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
