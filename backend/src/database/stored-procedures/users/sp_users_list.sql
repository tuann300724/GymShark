CREATE OR ALTER PROCEDURE [dbo].[sp_users_list]
  @status VARCHAR(20) = NULL,
  @role VARCHAR(20) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @limit INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@limit) id, email, fullName, phone, role, status, avatarUrl, branchId, createdAt, updatedAt
    FROM dbo.users
    WHERE (@status IS NULL OR status = @status)
      AND (@role IS NULL OR role = @role)
      AND (@branchId IS NULL OR branchId = @branchId)
    ORDER BY createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END