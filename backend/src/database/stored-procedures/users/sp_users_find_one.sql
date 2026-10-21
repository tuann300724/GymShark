CREATE OR ALTER PROCEDURE [dbo].[sp_users_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, email, fullName, phone, role, status, avatarUrl, branchId, createdAt, updatedAt
    FROM dbo.users WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END