-- Tăng số lần nhập sai mã đặt lại mật khẩu — trả về attempts mới.
CREATE OR ALTER PROCEDURE sp_auth_increment_reset_attempts
    @id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE password_resets
        SET attempts = attempts + 1
        WHERE id = @id;

        SELECT attempts FROM password_resets WHERE id = @id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
