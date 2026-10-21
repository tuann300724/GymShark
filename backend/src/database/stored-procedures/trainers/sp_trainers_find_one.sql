CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT t.id, t.userId, t.specialization, t.certification, t.experienceYears,
           t.bio, t.gender, t.dateOfBirth, t.rating, t.hourlyRate, t.status,
           t.createdAt, t.updatedAt,
           u.id AS user_id, u.email AS user_email, u.fullName AS user_fullName,
           u.phone AS user_phone, u.avatarUrl AS user_avatarUrl, u.status AS user_status,
           u.branchId AS user_branchId
    FROM dbo.trainers t
    LEFT JOIN dbo.users u ON t.userId = u.id
    WHERE t.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
