CREATE OR ALTER PROCEDURE [dbo].[sp_promotions_list]
  @status VARCHAR(20) = NULL,
  @discountType VARCHAR(20) = NULL,
  @search NVARCHAR(255) = NULL,
  @from DATE = NULL,
  @to DATE = NULL,
  @limit INT = 200
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, code, name, description, discountType, discountValue, minOrderValue, maxDiscount,
           startDate, endDate, usageLimit, perMemberLimit, usedCount, status, createdAt, updatedAt
    FROM dbo.promotions
    WHERE (@status IS NULL OR status = @status)
      AND (@discountType IS NULL OR discountType = @discountType)
      AND (@search IS NULL OR code LIKE '%' + @search + '%' OR name LIKE '%' + @search + '%')
      AND (@from IS NULL OR endDate >= @from)
      AND (@to IS NULL OR endDate <= @to)
    ORDER BY createdAt DESC
    OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH DECLARE @E NVARCHAR(4000)=ERROR_MESSAGE(); DECLARE @S INT=ERROR_SEVERITY(); DECLARE @St INT=ERROR_STATE(); RAISERROR(@E,@S,@St); END CATCH
END
