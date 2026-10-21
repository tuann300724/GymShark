-- Liên kết tài khoản LOCAL với provider Google (email đã có, lần đầu login Google).
CREATE OR ALTER PROCEDURE sp_auth_link_google_provider
    @id         UNIQUEIDENTIFIER,
    @providerId VARCHAR(64),
    @avatarUrl  VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE users
        SET provider = 'GOOGLE',
            providerId = @providerId,
            avatarUrl = COALESCE(avatarUrl, @avatarUrl),
            updatedAt = SYSUTCDATETIME()
        WHERE id = @id;

        SELECT id, email, fullName, phone, role, status, avatarUrl,
               provider, providerId, branchId, createdAt
        FROM users WHERE id = @id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
