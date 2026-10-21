CREATE OR ALTER PROCEDURE [dbo].[sp_branches_equipment]
  @branchId UNIQUEIDENTIFIER,
  @top INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@top) e.*,
           r.id AS room_id, r.name AS room_name
    FROM dbo.equipment e
    LEFT JOIN dbo.rooms r ON e.roomId = r.id
    WHERE e.branchId = @branchId
    ORDER BY e.createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
