CREATE OR ALTER PROCEDURE [dbo].[sp_members_list_count]
  @search NVARCHAR(255) = NULL,
  @status NVARCHAR(50) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @membershipStatus NVARCHAR(50) = NULL,
  @packageId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.members m
    WHERE (@search IS NULL OR m.fullName LIKE '%' + @search + '%' OR m.email LIKE '%' + @search + '%'
             OR m.phone LIKE '%' + @search + '%' OR m.code LIKE '%' + @search + '%')
      AND (@status IS NULL OR m.status = @status)
      AND (@branchId IS NULL OR m.branchId = @branchId)
      AND (@membershipStatus IS NULL OR EXISTS (
            SELECT 1 FROM dbo.memberships ms WHERE ms.memberId = m.id AND ms.status = @membershipStatus))
      AND (@packageId IS NULL OR EXISTS (
            SELECT 1 FROM dbo.memberships ms WHERE ms.memberId = m.id AND ms.packageId = @packageId));
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
