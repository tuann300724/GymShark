CREATE OR ALTER PROCEDURE [dbo].[sp_memberships_has_paid_payment]
  @membershipId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (1) id
    FROM dbo.payments
    WHERE membershipId = @membershipId AND status = 'PAID';
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
