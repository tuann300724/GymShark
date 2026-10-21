-- Đọc user theo id — dùng cho JwtStrategy.validate (mọi request đã đăng nhập) và getProfile base.
CREATE OR ALTER PROCEDURE sp_auth_find_user_by_id
    @id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            id, email, passwordHash, fullName, phone, role, status,
            avatarUrl, provider, providerId, branchId, createdAt
        FROM users
        WHERE id = @id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
