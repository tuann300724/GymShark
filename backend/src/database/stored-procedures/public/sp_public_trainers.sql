CREATE OR ALTER PROCEDURE [dbo].[sp_public_trainers]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT t.id, t.userId, t.specialization, t.certification, t.experienceYears, t.bio,
           t.gender, t.dateOfBirth, t.rating, t.hourlyRate, t.status, t.createdAt, t.updatedAt,
           u.id AS user_id, u.fullName AS user_fullName, u.phone AS user_phone, u.avatarUrl AS user_avatarUrl
    FROM dbo.trainers t
    JOIN dbo.users u ON t.userId = u.id
    WHERE t.status = 'ACTIVE'
    ORDER BY t.rating DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
