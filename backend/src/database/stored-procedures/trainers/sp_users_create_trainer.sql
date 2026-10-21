CREATE OR ALTER PROCEDURE [dbo].[sp_users_create_trainer]
  @id UNIQUEIDENTIFIER,
  @email VARCHAR(100),
  @passwordHash NVARCHAR(255),
  @fullName NVARCHAR(255),
  @phone VARCHAR(30) = NULL,
  @status VARCHAR(20) = 'ACTIVE',
  @avatarUrl VARCHAR(500) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.users (id, email, passwordHash, fullName, phone, role, status, avatarUrl, branchId, createdAt, updatedAt)
    OUTPUT INSERTED.id, INSERTED.email, INSERTED.fullName, INSERTED.phone, INSERTED.avatarUrl,
           INSERTED.role, INSERTED.status, INSERTED.branchId, INSERTED.createdAt, INSERTED.updatedAt
    VALUES (@id, @email, @passwordHash, @fullName, @phone, 'TRAINER', @status, @avatarUrl, @branchId, GETDATE(), GETDATE());

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
