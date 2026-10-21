CREATE OR ALTER PROCEDURE [dbo].[sp_payments_find_by_transaction_ref]
  @transactionRef NVARCHAR(100),
  @excludeId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP 1 id, code FROM dbo.payments
    WHERE transactionRef = @transactionRef AND (@excludeId IS NULL OR id <> @excludeId);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
