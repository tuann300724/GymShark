CREATE OR ALTER PROCEDURE [dbo].[sp_rooms_update]
  @id UNIQUEIDENTIFIER,
  @code VARCHAR(30) = NULL,
  @name NVARCHAR(255) = NULL,
  @type VARCHAR(30) = NULL,
  @capacity INT = NULL,
  @floor NVARCHAR(50) = NULL,
  @description NVARCHAR(MAX) = NULL,
  @status VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.rooms
    SET code = ISNULL(@code, code),
        name = ISNULL(@name, name),
        type = ISNULL(@type, type),
        capacity = ISNULL(@capacity, capacity),
        floor = ISNULL(@floor, floor),
        description = ISNULL(@description, description),
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
