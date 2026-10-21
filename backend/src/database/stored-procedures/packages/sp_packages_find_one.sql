CREATE OR ALTER PROCEDURE [dbo].[sp_packages_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      p.id, p.code, p.name, p.description, p.features, p.durationDays, p.price,
      p.sessions, p.type, p.status, p.allowedBranches, p.createdAt, p.updatedAt,
      (SELECT COUNT(*) FROM dbo.memberships WHERE packageId = p.id) AS membershipsCount
    FROM dbo.membership_packages p WHERE p.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
