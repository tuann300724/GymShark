CREATE OR ALTER PROCEDURE [dbo].[sp_users_update_status_email]
  @id UNIQUEIDENTIFIER,
  @status VARCHAR(20) = NULL,
  @email VARCHAR(100) = NULL,
  @setEmail BIT = 0
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.users
    SET status = ISNULL(@status, status),
        email = CASE WHEN @setEmail = 1 THEN @email ELSE email END,
        updatedAt = GETDATE()
    OUTPUT INSERTED.id, INSERTED.email, INSERTED.status
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
