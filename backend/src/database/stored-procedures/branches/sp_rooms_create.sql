CREATE OR ALTER PROCEDURE [dbo].[sp_rooms_create]
  @branchId UNIQUEIDENTIFIER,
  @code VARCHAR(30),
  @name NVARCHAR(255),
  @type VARCHAR(30) = 'GYM_AREA',
  @capacity INT = 20,
  @floor NVARCHAR(50) = NULL,
  @description NVARCHAR(MAX) = NULL,
  @status VARCHAR(20) = 'AVAILABLE'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    INSERT INTO dbo.rooms (branchId, code, name, type, capacity, floor, description, status, createdAt, updatedAt)
    OUTPUT INSERTED.id
    VALUES (@branchId, @code, @name, @type, @capacity, @floor, @description, @status, GETDATE(), GETDATE());
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
