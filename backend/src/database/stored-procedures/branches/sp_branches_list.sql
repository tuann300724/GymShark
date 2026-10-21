CREATE OR ALTER PROCEDURE [dbo].[sp_branches_list]
  @role NVARCHAR(20) = 'ADMIN',
  @userBranchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT b.id, b.code, b.name, b.address, b.phone, b.email, b.description,
           b.openingTime, b.closingTime, b.openingHours, b.status, b.createdAt, b.updatedAt,
           (SELECT COUNT(*) FROM dbo.members m WHERE m.branchId = b.id) AS memberCount,
           (SELECT COUNT(*) FROM dbo.equipment e WHERE e.branchId = b.id) AS equipmentCount,
           (SELECT COUNT(*) FROM dbo.rooms r WHERE r.branchId = b.id) AS roomCount,
           (SELECT COUNT(*) FROM dbo.users u WHERE u.branchId = b.id) AS userCount,
           (SELECT COUNT(*) FROM dbo.training_schedules s WHERE s.branchId = b.id) AS scheduleCount
    FROM dbo.branches b
    WHERE ((@role IN ('STAFF', 'TRAINER') AND @userBranchId IS NOT NULL AND b.id = @userBranchId)
           OR (@role NOT IN ('STAFF', 'TRAINER') OR @userBranchId IS NULL))
    ORDER BY b.createdAt ASC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
