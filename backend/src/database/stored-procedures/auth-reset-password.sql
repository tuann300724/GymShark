-- ĐẶT LẠI MẬT KHẨU — cập nhật mật khẩu + xoá yêu cầu trong MỘT TRANSACTION.
-- Yêu cầu thầy: transaction cho tác vụ nhiều thao tác. Sai 1 bước -> rollback hết
-- (không xoá yêu cầu khi chưa đổi mật khẩu được).
CREATE OR ALTER PROCEDURE sp_auth_reset_password
    @email VARCHAR(100),
    @passwordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Đổi mật khẩu
        UPDATE users SET passwordHash = @passwordHash, updatedAt = SYSUTCDATETIME()
        WHERE email = @email;

        IF @@ROWCOUNT = 0
            THROW 51003, 'Tài khoản không còn tồn tại', 1;

        -- Xoá toàn bộ yêu cầu đặt lại mật khẩu của email này
        DELETE FROM password_resets WHERE email = @email;

        COMMIT TRANSACTION;

        SELECT id, email, fullName FROM users WHERE email = @email;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
