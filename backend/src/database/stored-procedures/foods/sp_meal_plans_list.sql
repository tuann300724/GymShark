CREATE OR ALTER PROCEDURE [dbo].[sp_meal_plans_list]
  @memberId UNIQUEIDENTIFIER = NULL,
  @trainerId UNIQUEIDENTIFIER = NULL,
  @status VARCHAR(20) = NULL,
  @scope VARCHAR(10) = NULL,
  @limit INT = 50
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@limit) id, memberId, trainerId, title, description, scope, startDate, status, isTemplate, totalCalories, totalProtein, totalFat, createdAt, updatedAt
    FROM dbo.meal_plans
    WHERE (@memberId IS NULL OR memberId = @memberId)
      AND (@trainerId IS NULL OR trainerId = @trainerId)
      AND (@status IS NULL OR status = @status)
      AND (@scope IS NULL OR scope = @scope)
    ORDER BY createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END