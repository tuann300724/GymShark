CREATE OR ALTER PROCEDURE [dbo].[sp_reports_members]
  @branchId UNIQUEIDENTIFIER = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS totalMembers FROM dbo.members
    WHERE (@branchId IS NULL OR branchId = @branchId);
  END TRY
  BEGIN CATCH RAISERROR('Members report error', 16, 1); END CATCH
END
