CREATE OR ALTER PROCEDURE [dbo].[sp_checkins_list]
  @memberId UNIQUEIDENTIFIER = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @from DATETIME2 = NULL,
  @to DATETIME2 = NULL,
  @limit INT = 50
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@limit) id, memberId, branchId, checkInTime, checkOutTime, method, status, createdAt, updatedAt
    FROM dbo.check_ins
    WHERE (@memberId IS NULL OR memberId = @memberId)
      AND (@branchId IS NULL OR branchId = @branchId)
      AND (@from IS NULL OR checkInTime >= @from)
      AND (@to IS NULL OR checkInTime <= @to)
    ORDER BY checkInTime DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END