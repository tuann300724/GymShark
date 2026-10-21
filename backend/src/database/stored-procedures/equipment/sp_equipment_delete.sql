CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_delete]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.equipment SET status = 'RETIRED', updatedAt = SYSUTCDATETIME() WHERE id = @id;
    COMMIT TRANSACTION;
    SELECT e.id, e.code, e.name, e.status, e.condition,
           b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
           r.id AS room_id, r.code AS room_code, r.name AS room_name
    FROM dbo.equipment e
    LEFT JOIN dbo.branches b ON e.branchId = b.id
    LEFT JOIN dbo.rooms r ON e.roomId = r.id
    WHERE e.id = @id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
