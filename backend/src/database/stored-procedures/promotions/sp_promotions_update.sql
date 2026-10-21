CREATE OR ALTER PROCEDURE [dbo].[sp_promotions_update]
  @id UNIQUEIDENTIFIER,
  @code VARCHAR(50) = NULL,
  @name NVARCHAR(255) = NULL,
  @description NVARCHAR(2000) = NULL,
  @discountType VARCHAR(20) = NULL,
  @discountValue DECIMAL(12,2) = NULL,
  @startDate DATETIME2 = NULL,
  @endDate DATETIME2 = NULL,
  @usageLimit INT = NULL,
  @status VARCHAR(20) = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.promotions
    SET code = COALESCE(@code, code),
        name = COALESCE(@name, name),
        description = COALESCE(@description, description),
        discountType = COALESCE(@discountType, discountType),
        discountValue = COALESCE(@discountValue, discountValue),
        startDate = COALESCE(@startDate, startDate),
        endDate = COALESCE(@endDate, endDate),
        usageLimit = COALESCE(@usageLimit, usageLimit),
        status = COALESCE(@status, status),
        updatedAt = GETDATE()
    WHERE id = @id;
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @E NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @S INT = ERROR_SEVERITY(); DECLARE @St INT = ERROR_STATE();
    RAISERROR(@E, @S, @St);
  END CATCH
END
