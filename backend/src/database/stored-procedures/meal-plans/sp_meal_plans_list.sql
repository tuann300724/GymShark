CREATE OR ALTER PROCEDURE [dbo].[sp_meal_plans_list]
  @trainerId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @isTemplate BIT = NULL,
  @status VARCHAR(20) = NULL,
  @search NVARCHAR(255) = NULL,
  @page INT = 1,
  @limit INT = 20
AS BEGIN
  SET NOCOUNT ON;
  DECLARE @offset INT = (@page - 1) * @limit;
  BEGIN TRY
    SELECT mp.id, mp.trainerId, mp.memberId, mp.title, mp.description, mp.scope, mp.startDate, mp.status, mp.isTemplate,
           mp.templateName, mp.imageData, mp.totalCalories, mp.totalProtein, mp.totalCarbs, mp.totalFat,
           mp.version, mp.confirmedAt, mp.createdAt, mp.updatedAt,
           t.id AS trainer_id, u_train.fullName AS trainer_fullName,
           m.id AS member_id, m.fullName AS member_fullName, m.code AS member_code
    FROM dbo.meal_plans mp
    LEFT JOIN dbo.trainers t ON mp.trainerId = t.id
    LEFT JOIN dbo.users u_train ON t.userId = u_train.id
    LEFT JOIN dbo.members m ON mp.memberId = m.id
    WHERE (@trainerId IS NULL OR mp.trainerId = @trainerId)
      AND (@memberId IS NULL OR mp.memberId = @memberId)
      AND (@isTemplate IS NULL OR mp.isTemplate = @isTemplate)
      AND (@status IS NULL OR mp.status = @status)
      AND (@search IS NULL OR mp.title LIKE '%' + @search + '%')
    ORDER BY mp.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
