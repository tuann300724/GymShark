CREATE OR ALTER PROCEDURE [dbo].[sp_members_stats]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) AS expired,
      SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) AS inactive
    FROM dbo.members;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
