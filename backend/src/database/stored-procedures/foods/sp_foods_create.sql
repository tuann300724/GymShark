CREATE OR ALTER PROCEDURE [dbo].[sp_foods_create]
  @id UNIQUEIDENTIFIER,
  @name NVARCHAR(255),
  @category VARCHAR(20) = 'PROTEIN',
  @imageUrl VARCHAR(500) = NULL,
  @description NVARCHAR(2000) = NULL,
  @servingSize FLOAT = 100,
  @servingUnit VARCHAR(20) = 'g',
  @caloriesPer100g FLOAT = 0,
  @proteinPer100g FLOAT = 0,
  @carbsPer100g FLOAT = 0,
  @fatPer100g FLOAT = 0,
  @createdById UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.foods (id, name, category, imageUrl, description, servingSize, servingUnit,
      caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, isActive, createdById, createdAt, updatedAt)
    VALUES (@id, @name, @category, @imageUrl, @description, @servingSize, @servingUnit,
      @caloriesPer100g, @proteinPer100g, @carbsPer100g, @fatPer100g, 1, @createdById, GETUTCDATE(), GETUTCDATE());
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
