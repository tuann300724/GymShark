CREATE OR ALTER PROCEDURE [dbo].[sp_public_branches]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, code, name, address, phone, email, description, openingTime, closingTime,
           openingHours, status, createdAt, updatedAt
    FROM dbo.branches WHERE status = 'ACTIVE' ORDER BY createdAt ASC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
