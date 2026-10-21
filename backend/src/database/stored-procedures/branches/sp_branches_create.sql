CREATE OR ALTER PROCEDURE [dbo].[sp_branches_create]
  @code VARCHAR(30),
  @name NVARCHAR(255),
  @address NVARCHAR(500),
  @phone VARCHAR(30),
  @email VARCHAR(100) = NULL,
  @description NVARCHAR(MAX) = NULL,
  @openingTime VARCHAR(10) = NULL,
  @closingTime VARCHAR(10) = NULL,
  @openingHours NVARCHAR(MAX) = NULL,
  @status VARCHAR(20) = 'ACTIVE'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    INSERT INTO dbo.branches (code, name, address, phone, email, description, openingTime, closingTime, openingHours, status, createdAt, updatedAt)
    OUTPUT INSERTED.id
    VALUES (@code, @name, @address, @phone, @email, @description, @openingTime, @closingTime, @openingHours, @status, GETDATE(), GETDATE());
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
