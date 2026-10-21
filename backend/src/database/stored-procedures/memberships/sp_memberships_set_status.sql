CREATE OR ALTER PROCEDURE [dbo].[sp_memberships_set_status]
  @id UNIQUEIDENTIFIER,
  @status VARCHAR(20),
  @notificationTitle NVARCHAR(255) = NULL,
  @notificationContent NVARCHAR(2000) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE dbo.memberships
    SET status = @status, updatedAt = GETDATE()
    WHERE id = @id;

    IF @@ROWCOUNT = 0
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50001, N'Không tìm thấy hợp đồng/thẻ hội viên', 1;
    END

    -- Hủy hợp đồng → hủy luôn payment đang PENDING
    IF @status = 'CANCELLED'
    BEGIN
      UPDATE dbo.payments
      SET status = 'CANCELLED', notes = N'Hủy theo yêu cầu quản trị viên', updatedAt = GETDATE()
      WHERE membershipId = @id AND status = 'PENDING';
    END

    -- Tạo thông báo cho hội viên (nếu có nội dung)
    IF @notificationContent IS NOT NULL
    BEGIN
      DECLARE @memberId UNIQUEIDENTIFIER = (SELECT memberId FROM dbo.memberships WHERE id = @id);
      INSERT INTO dbo.notifications (memberId, title, content, type, link, isRead, createdAt)
      VALUES (@memberId, @notificationTitle, @notificationContent, 'MEMBERSHIP', '/member/membership', 0, GETDATE());
    END

    COMMIT TRANSACTION;

    SELECT id, memberId, packageId, startDate, endDate, price, discountAmount, finalAmount,
           remainingSessions, status, createdAt, updatedAt
    FROM dbo.memberships WHERE id = @id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
