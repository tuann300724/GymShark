-- Tạo/ghi đè yêu cầu đặt lại mật khẩu (gộp delete + create trong transaction).
CREATE OR ALTER PROCEDURE sp_auth_create_password_reset
    @email     VARCHAR(100),
    @codeHash  VARCHAR(255),
    @expiresAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM password_resets WHERE email = @email;

        DECLARE @out TABLE (id UNIQUEIDENTIFIER);
        INSERT INTO password_resets (email, codeHash, attempts, expiresAt, lastSentAt)
        OUTPUT INSERTED.id INTO @out
        VALUES (@email, @codeHash, 0, @expiresAt, SYSUTCDATETIME());
        DECLARE @id UNIQUEIDENTIFIER = (SELECT id FROM @out);

        COMMIT TRANSACTION;
        SELECT @id AS id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
