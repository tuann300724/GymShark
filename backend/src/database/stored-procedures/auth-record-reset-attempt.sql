-- Tăng số lần nhập sai mã xác minh cho password reset (dùng chung bảng password_resets).
-- Giữ tên riêng cho rõ nghĩa trong luồng quên mật khẩu.
CREATE OR ALTER PROCEDURE sp_auth_record_reset_attempt
    @email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE password_resets
        SET attempts = attempts + 1
        WHERE email = @email;

        SELECT TOP 1 attempts FROM password_resets WHERE email = @email;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
