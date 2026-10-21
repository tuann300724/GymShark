-- Đọc member theo userId — dùng cho login/googleLogin lấy memberId đính kèm token.
CREATE OR ALTER PROCEDURE sp_auth_find_member_by_user_id
    @userId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP 1 id, code, userId
        FROM members
        WHERE userId = @userId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
