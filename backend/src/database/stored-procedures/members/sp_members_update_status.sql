CREATE OR ALTER PROCEDURE [dbo].[sp_members_update_status]
  @id UNIQUEIDENTIFIER,
  @status NVARCHAR(20)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.members
    SET status = @status, updatedAt = GETDATE()
    OUTPUT INSERTED.id, INSERTED.status
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
