CREATE OR ALTER PROCEDURE [dbo].[sp_promotions_create]
  @code VARCHAR(50),
  @name NVARCHAR(255),
  @description NVARCHAR(2000) = NULL,
  @discountType VARCHAR(20) = 'PERCENTAGE',
  @discountValue DECIMAL(12,2) = 0,
  @minOrderValue DECIMAL(12,2) = NULL,
  @maxDiscount DECIMAL(12,2) = NULL,
  @startDate DATETIME2,
  @endDate DATETIME2 = NULL,
  @usageLimit INT = NULL,
  @perMemberLimit INT = NULL,
  @status VARCHAR(20) = 'ACTIVE'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.promotions (code, name, description, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, usageLimit, perMemberLimit, usedCount, status, createdAt, updatedAt)
    OUTPUT INSERTED.id, INSERTED.code, INSERTED.name, INSERTED.description, INSERTED.discountType, INSERTED.discountValue,
           INSERTED.minOrderValue, INSERTED.maxDiscount, INSERTED.startDate, INSERTED.endDate, INSERTED.usageLimit,
           INSERTED.perMemberLimit, INSERTED.usedCount, INSERTED.status, INSERTED.createdAt, INSERTED.updatedAt
    VALUES (@code, @name, @description, @discountType, @discountValue, @minOrderValue, @maxDiscount, @startDate, @endDate, @usageLimit, @perMemberLimit, 0, @status, GETDATE(), GETDATE());
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
