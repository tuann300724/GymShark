CREATE OR ALTER PROCEDURE [dbo].[sp_reports_attendance]
  @from DATE = NULL,
  @to DATE = NULL,
  @branchId UNIQUEIDENTIFIER = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS totalCheckIns FROM dbo.checkIns
    WHERE (@from IS NULL OR CAST(checkInTime AS DATE) >= @from)
      AND (@to IS NULL OR CAST(checkInTime AS DATE) <= @to)
      AND (@branchId IS NULL OR branchId = @branchId);
  END TRY
  BEGIN CATCH RAISERROR('Attendance report error', 16, 1); END CATCH
END
