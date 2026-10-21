CREATE OR ALTER PROCEDURE [dbo].[sp_payments_stats]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @startOfToday DATETIME2 = CAST(CAST(GETDATE() AS DATE) AS DATETIME2);

    SELECT
      (SELECT ISNULL(SUM(amount),0) FROM dbo.payments WHERE status='PAID') AS totalRevenue,
      (SELECT ISNULL(SUM(amount),0) FROM dbo.payments WHERE status='PAID' AND paidAt >= @startOfToday) AS revenueToday,
      (SELECT COUNT(*) FROM dbo.payments WHERE status='PENDING') AS pendingCount,
      (SELECT COUNT(*) FROM dbo.payments WHERE status='PAID') AS paidCount,
      (SELECT COUNT(*) FROM dbo.payments WHERE status='FAILED') AS failedCount,
      (SELECT COUNT(*) FROM dbo.payments WHERE status='CANCELLED') AS cancelledCount,
      (SELECT COUNT(*) FROM dbo.payments WHERE status='REFUNDED') AS refundedCount,
      (SELECT ISNULL(SUM(amount),0) FROM dbo.payments WHERE status='REFUNDED') AS refundedTotal;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
