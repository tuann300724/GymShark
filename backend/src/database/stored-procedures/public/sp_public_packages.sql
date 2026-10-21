CREATE OR ALTER PROCEDURE [dbo].[sp_public_packages]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, code, name, description, durationDays, price, sessions, type, status,
           features, allowedBranches, createdAt, updatedAt
    FROM dbo.membership_packages
    WHERE status = 'ACTIVE'
    ORDER BY price ASC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
