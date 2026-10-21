CREATE OR ALTER PROCEDURE [dbo].[sp_foods_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, name, category, imageUrl, description, servingSize, servingUnit,
           caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, isActive, createdById,
           createdAt, updatedAt
    FROM dbo.foods WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
