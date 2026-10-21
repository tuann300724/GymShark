-- Đọc user theo email — dùng cho validateUser/login, assertEmailAvailable, forgot-password, google.
-- Trả về đầy đủ cột cần cho login (passwordHash cho bcrypt.compare) + các cột trả về profile.
CREATE OR ALTER PROCEDURE sp_auth_find_user_by_email
    @email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            id, email, passwordHash, fullName, phone, role, status,
            avatarUrl, provider, providerId, branchId, createdAt
        FROM users
        WHERE email = @email;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
