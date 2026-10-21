-- Đọc profile đầy đủ (user + branch + trainer) cho GET /auth/profile.
-- LEFT JOIN branch/trainer vì user có thể không liên kết trainer.
CREATE OR ALTER PROCEDURE sp_auth_get_profile
    @userId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT
            u.id, u.email, u.fullName, u.phone, u.role, u.status,
            u.avatarUrl, u.branchId, u.createdAt,
            b.id   AS branchId_rel,
            b.name AS branchName,
            b.code AS branchCode,
            t.id   AS trainerId,
            t.specialization,
            t.rating
        FROM users u
        LEFT JOIN branches b ON b.id = u.branchId
        LEFT JOIN trainers t ON t.userId = u.id
        WHERE u.id = @userId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
