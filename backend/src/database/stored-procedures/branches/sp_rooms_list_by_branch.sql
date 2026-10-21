CREATE OR ALTER PROCEDURE [dbo].[sp_rooms_list_by_branch]
  @branchId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT r.id, r.branchId, r.code, r.name, r.type, r.capacity, r.floor, r.description,
           r.status, r.createdAt, r.updatedAt,
           (SELECT COUNT(*) FROM dbo.equipment e WHERE e.roomId = r.id) AS equipmentCount,
           (SELECT COUNT(*) FROM dbo.training_schedules s WHERE s.roomId = r.id) AS scheduleCount
    FROM dbo.rooms r
    WHERE r.branchId = @branchId
    ORDER BY r.code ASC, r.createdAt ASC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
