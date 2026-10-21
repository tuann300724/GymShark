-- Đọc chi nhánh ACTIVE đầu tiên (theo createdAt) — dùng cho luồng đăng ký / google tạo member.
CREATE OR ALTER PROCEDURE sp_auth_find_active_branch
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP 1 id
        FROM branches
        WHERE status = 'ACTIVE'
        ORDER BY createdAt ASC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
