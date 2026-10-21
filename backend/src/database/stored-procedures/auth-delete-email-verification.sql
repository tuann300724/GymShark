-- Xoá yêu cầu xác minh (theo id hoặc email) — dọn khi xác minh xong / hết hạn / lỗi gửi mail.
CREATE OR ALTER PROCEDURE sp_auth_delete_email_verification
    @id    UNIQUEIDENTIFIER = NULL,
    @email VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @id IS NOT NULL
            DELETE FROM email_verifications WHERE id = @id;
        ELSE IF @email IS NOT NULL
            DELETE FROM email_verifications WHERE email = @email;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
