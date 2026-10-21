CREATE OR ALTER PROCEDURE [dbo].[sp_users_update_trainer]
  @id UNIQUEIDENTIFIER,
  @email VARCHAR(100) = NULL,
  @fullName NVARCHAR(255) = NULL,
  @phone VARCHAR(30) = NULL,
  @avatarUrl VARCHAR(500) = NULL,
  @status VARCHAR(20) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.users
    SET email = ISNULL(@email, email),
        fullName = ISNULL(@fullName, fullName),
        phone = ISNULL(@phone, phone),
        avatarUrl = ISNULL(@avatarUrl, avatarUrl),
        status = ISNULL(@status, status),
        branchId = ISNULL(@branchId, branchId),
        updatedAt = GETDATE()
    OUTPUT INSERTED.id, INSERTED.email, INSERTED.fullName, INSERTED.phone, INSERTED.avatarUrl,
           INSERTED.role, INSERTED.status, INSERTED.branchId, INSERTED.createdAt, INSERTED.updatedAt
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
