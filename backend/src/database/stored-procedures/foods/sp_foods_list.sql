CREATE OR ALTER PROCEDURE [dbo].[sp_foods_list]
  @category VARCHAR(20) = NULL,
  @search NVARCHAR(100) = NULL,
  @isActive BIT = NULL,
  @page INT = 1,
  @limit INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT id, name, category, imageUrl, description, servingSize, servingUnit,
           caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, isActive, createdById,
           createdAt, updatedAt
    FROM dbo.foods
    WHERE (@category IS NULL OR category = @category)
      AND (@isActive IS NULL OR isActive = @isActive)
      AND (@search IS NULL OR name LIKE '%' + @search + '%')
    ORDER BY category ASC, name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END