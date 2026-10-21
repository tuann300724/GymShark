CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_update]
  @id UNIQUEIDENTIFIER,
  @specialization NVARCHAR(255) = NULL,
  @certification NVARCHAR(255) = NULL,
  @experienceYears INT = NULL,
  @bio NVARCHAR(2000) = NULL,
  @gender VARCHAR(10) = NULL,
  @dateOfBirth DATETIME2 = NULL,
  @hourlyRate DECIMAL(10,2) = NULL,
  @status VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.trainers
    SET specialization = ISNULL(@specialization, specialization),
        certification = ISNULL(@certification, certification),
        experienceYears = ISNULL(@experienceYears, experienceYears),
        bio = ISNULL(@bio, bio),
        gender = ISNULL(@gender, gender),
        dateOfBirth = ISNULL(@dateOfBirth, dateOfBirth),
        hourlyRate = ISNULL(@hourlyRate, hourlyRate),
        status = ISNULL(@status, status),
        updatedAt = GETDATE()
    OUTPUT INSERTED.id, INSERTED.userId, INSERTED.specialization, INSERTED.certification,
           INSERTED.experienceYears, INSERTED.bio, INSERTED.gender, INSERTED.dateOfBirth,
           INSERTED.rating, INSERTED.hourlyRate, INSERTED.status, INSERTED.createdAt, INSERTED.updatedAt
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
