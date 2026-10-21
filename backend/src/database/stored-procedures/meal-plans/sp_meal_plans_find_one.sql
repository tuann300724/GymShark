CREATE OR ALTER PROCEDURE [dbo].[sp_meal_plans_find_one]
  @id UNIQUEIDENTIFIER
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT mp.id, mp.trainerId, mp.memberId, mp.title, mp.description, mp.scope, mp.startDate, mp.status, mp.isTemplate,
           mp.templateName, mp.imageData, mp.totalCalories, mp.totalProtein, mp.totalCarbs, mp.totalFat,
           mp.version, mp.confirmedAt, mp.createdAt, mp.updatedAt,
           t.id AS trainer_id, u_train.fullName AS trainer_fullName, u_train.avatarUrl AS trainer_avatarUrl,
           m.id AS member_id, m.fullName AS member_fullName, m.code AS member_code, m.avatarUrl AS member_avatarUrl
    FROM dbo.meal_plans mp
    LEFT JOIN dbo.trainers t ON mp.trainerId = t.id
    LEFT JOIN dbo.users u_train ON t.userId = u_train.id
    LEFT JOIN dbo.members m ON mp.memberId = m.id
    WHERE mp.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
