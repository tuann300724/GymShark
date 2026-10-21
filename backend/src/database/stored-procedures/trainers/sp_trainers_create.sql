CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_create]
  @userId UNIQUEIDENTIFIER,
  @specialization NVARCHAR(255),
  @certification NVARCHAR(255) = NULL,
  @experienceYears INT = 1,
  @bio NVARCHAR(2000) = NULL,
  @gender VARCHAR(10) = NULL,
  @dateOfBirth DATETIME2 = NULL,
  @hourlyRate DECIMAL(10,2) = NULL,
  @status VARCHAR(20) = 'ACTIVE'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.trainers (userId, specialization, certification, experienceYears, bio,
                              gender, dateOfBirth, hourlyRate, status, createdAt, updatedAt)
    OUTPUT INSERTED.id, INSERTED.userId, INSERTED.specialization, INSERTED.certification,
           INSERTED.experienceYears, INSERTED.bio, INSERTED.gender, INSERTED.dateOfBirth,
           INSERTED.rating, INSERTED.hourlyRate, INSERTED.status, INSERTED.createdAt, INSERTED.updatedAt
    VALUES (@userId, @specialization, @certification, @experienceYears, @bio,
            @gender, @dateOfBirth, @hourlyRate, @status, GETDATE(), GETDATE());

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
