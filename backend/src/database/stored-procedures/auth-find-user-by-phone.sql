-- Đọc user theo phone — dùng cho assertPhoneAvailable (chặn trùng số điện thoại).
CREATE OR ALTER PROCEDURE sp_auth_find_user_by_phone
    @phone VARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP 1 id, fullName, phone
        FROM users
        WHERE phone = @phone;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
