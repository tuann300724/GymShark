-- Xoá yêu cầu đặt lại mật khẩu (theo id hoặc email).
CREATE OR ALTER PROCEDURE sp_auth_delete_password_reset
    @id    UNIQUEIDENTIFIER = NULL,
    @email VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @id IS NOT NULL
            DELETE FROM password_resets WHERE id = @id;
        ELSE IF @email IS NOT NULL
            DELETE FROM password_resets WHERE email = @email;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
