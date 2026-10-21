CREATE OR ALTER PROCEDURE [dbo].[sp_public_promotions]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (20) id, code, name, description, discountType, discountValue,
           minOrderValue, maxDiscount, usageLimit, perMemberLimit, usedCount,
           startDate, endDate AS endAt, status, createdAt, updatedAt
    FROM dbo.promotions
    WHERE status = 'ACTIVE' AND startDate <= GETUTCDATE() AND endDate >= GETUTCDATE()
    ORDER BY endDate ASC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
