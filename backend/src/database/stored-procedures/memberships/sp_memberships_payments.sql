CREATE OR ALTER PROCEDURE [dbo].[sp_memberships_payments]
  @membershipId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, code, memberId, membershipId, promotionId, amount, discountAmount, currency,
           method, status, transactionRef, notes, confirmedById, confirmedAt, paidAt,
           createdAt, updatedAt
    FROM dbo.payments
    WHERE membershipId = @membershipId
    ORDER BY createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
