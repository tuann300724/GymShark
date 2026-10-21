CREATE OR ALTER PROCEDURE [dbo].[sp_audit_logs_create]
  @userId UNIQUEIDENTIFIER = NULL,
  @action VARCHAR(50),
  @entity VARCHAR(50),
  @entityId UNIQUEIDENTIFIER = NULL,
  @metadata NVARCHAR(MAX) = NULL,
  @ip VARCHAR(50) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    INSERT INTO dbo.audit_logs (userId, action, entity, entityId, metadata, ip, createdAt)
    VALUES (@userId, @action, @entity, @entityId, @metadata, @ip, GETDATE());
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END