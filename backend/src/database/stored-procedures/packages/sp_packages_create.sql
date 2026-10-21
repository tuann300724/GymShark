CREATE OR ALTER PROCEDURE [dbo].[sp_packages_create]
  @id UNIQUEIDENTIFIER,
  @code VARCHAR(50),
  @name NVARCHAR(255),
  @description NVARCHAR(2000) = NULL,
  @features NVARCHAR(MAX) = NULL,
  @durationDays INT,
  @price DECIMAL(12,2),
  @sessions INT = NULL,
  @type VARCHAR(20) = 'FIXED_TERM',
  @status VARCHAR(20) = 'ACTIVE',
  @allowedBranches NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.membership_packages (id, code, name, description, features, durationDays, price, sessions, type, status, allowedBranches, createdAt, updatedAt)
    VALUES (@id, @code, @name, @description, @features, @durationDays, @price, @sessions, @type, @status, @allowedBranches, GETUTCDATE(), GETUTCDATE());
    SELECT id, code, name, description, features, durationDays, price, sessions, type, status, allowedBranches, createdAt, updatedAt
    FROM dbo.membership_packages WHERE id = @id;
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
