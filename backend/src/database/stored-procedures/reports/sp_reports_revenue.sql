CREATE OR ALTER PROCEDURE [dbo].[sp_reports_revenue]
  @from DATETIME2 = NULL,
  @to DATETIME2 = NULL,
  @branchId UNIQUEIDENTIFIER = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT SUM(p.amount) AS totalRevenue FROM dbo.payments p
    LEFT JOIN dbo.memberships m ON p.membershipId = m.id
    LEFT JOIN dbo.members mem ON m.memberId = mem.id
    WHERE (@from IS NULL OR p.createdAt >= @from) AND (@to IS NULL OR p.createdAt <= @to)
      AND (@branchId IS NULL OR mem.branchId = @branchId);
  END TRY
  BEGIN CATCH RAISERROR('Report error', 16, 1); END CATCH
END