-- Đọc yêu cầu đặt lại mật khẩu đang chờ theo email.
CREATE OR ALTER PROCEDURE sp_auth_find_password_reset
    @email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP 1 id, email, codeHash, attempts, expiresAt, lastSentAt
        FROM password_resets
        WHERE email = @email
        ORDER BY createdAt DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
