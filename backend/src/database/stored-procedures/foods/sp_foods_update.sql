CREATE OR ALTER PROCEDURE [dbo].[sp_foods_update]
  @id UNIQUEIDENTIFIER,
  @name NVARCHAR(255) = NULL,
  @category VARCHAR(20) = NULL,
  @imageUrl VARCHAR(500) = NULL,
  @description NVARCHAR(2000) = NULL,
  @servingSize FLOAT = NULL,
  @servingUnit VARCHAR(20) = NULL,
  @caloriesPer100g FLOAT = NULL,
  @proteinPer100g FLOAT = NULL,
  @carbsPer100g FLOAT = NULL,
  @fatPer100g FLOAT = NULL,
  @isActive BIT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.foods SET
      name = COALESCE(@name, name),
      category = COALESCE(@category, category),
      imageUrl = CASE WHEN @imageUrl IS NULL THEN imageUrl ELSE @imageUrl END,
      description = CASE WHEN @description IS NULL THEN description ELSE @description END,
      servingSize = COALESCE(@servingSize, servingSize),
      servingUnit = COALESCE(@servingUnit, servingUnit),
      caloriesPer100g = COALESCE(@caloriesPer100g, caloriesPer100g),
      proteinPer100g = COALESCE(@proteinPer100g, proteinPer100g),
      carbsPer100g = COALESCE(@carbsPer100g, carbsPer100g),
      fatPer100g = COALESCE(@fatPer100g, fatPer100g),
      isActive = COALESCE(@isActive, isActive),
      updatedAt = GETUTCDATE()
    WHERE id = @id;
    SELECT id, name, category, imageUrl, description, servingSize, servingUnit,
           caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, isActive, createdById,
           createdAt, updatedAt
    FROM dbo.foods WHERE id = @id;
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
