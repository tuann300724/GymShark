CREATE OR ALTER PROCEDURE [dbo].[sp_packages_list]
  @status VARCHAR(20) = NULL,
  @search NVARCHAR(100) = NULL,
  @limit INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@limit)
      p.id, p.code, p.name, p.description, p.features, p.durationDays, p.price,
      p.sessions, p.type, p.status, p.allowedBranches, p.createdAt, p.updatedAt,
      (SELECT COUNT(*) FROM dbo.memberships WHERE packageId = p.id) AS membershipsCount
    FROM dbo.membership_packages p
    WHERE (@status IS NULL OR p.status = @status)
      AND (@search IS NULL OR p.name LIKE '%' + @search + '%' OR p.code LIKE '%' + @search + '%')
    ORDER BY p.createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
