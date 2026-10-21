CREATE OR ALTER PROCEDURE [dbo].[sp_branches_update]
  @id UNIQUEIDENTIFIER,
  @code VARCHAR(30) = NULL,
  @name NVARCHAR(255) = NULL,
  @address NVARCHAR(500) = NULL,
  @phone VARCHAR(30) = NULL,
  @email VARCHAR(100) = NULL,
  @description NVARCHAR(MAX) = NULL,
  @openingTime VARCHAR(10) = NULL,
  @closingTime VARCHAR(10) = NULL,
  @openingHours NVARCHAR(MAX) = NULL,
  @status VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.branches
    SET code = ISNULL(@code, code),
        name = ISNULL(@name, name),
        address = ISNULL(@address, address),
        phone = ISNULL(@phone, phone),
        email = ISNULL(@email, email),
        description = ISNULL(@description, description),
        openingTime = ISNULL(@openingTime, openingTime),
        closingTime = ISNULL(@closingTime, closingTime),
        openingHours = ISNULL(@openingHours, openingHours),
        status = ISNULL(@status, status),
        updatedAt = GETDATE()
    OUTPUT INSERTED.id
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
