CREATE OR ALTER PROCEDURE [dbo].[sp_packages_update]
  @id UNIQUEIDENTIFIER,
  @code VARCHAR(50) = NULL,
  @name NVARCHAR(255) = NULL,
  @description NVARCHAR(2000) = NULL,
  @features NVARCHAR(MAX) = NULL,
  @durationDays INT = NULL,
  @price DECIMAL(12,2) = NULL,
  @sessions INT = NULL,
  @type VARCHAR(20) = NULL,
  @status VARCHAR(20) = NULL,
  @allowedBranches NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.membership_packages SET
      code = COALESCE(@code, code),
      name = COALESCE(@name, name),
      description = CASE WHEN @description IS NULL THEN description ELSE @description END,
      features = CASE WHEN @features IS NULL THEN features ELSE @features END,
      durationDays = COALESCE(@durationDays, durationDays),
      price = COALESCE(@price, price),
      sessions = COALESCE(@sessions, sessions),
      type = COALESCE(@type, type),
      status = COALESCE(@status, status),
      allowedBranches = CASE WHEN @allowedBranches IS NULL THEN allowedBranches ELSE @allowedBranches END,
      updatedAt = GETUTCDATE()
    WHERE id = @id;
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
