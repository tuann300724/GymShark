CREATE OR ALTER PROCEDURE [dbo].[sp_payments_reject]
  @id UNIQUEIDENTIFIER,
  @actorId UNIQUEIDENTIFIER,
  @reason NVARCHAR(500) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @now DATETIME2 = GETDATE();
    DECLARE @memberId UNIQUEIDENTIFIER;
    DECLARE @membershipId UNIQUEIDENTIFIER;
    DECLARE @paymentStatus VARCHAR(20);
    DECLARE @paymentCode VARCHAR(30);
    DECLARE @notes NVARCHAR(1000);
    DECLARE @membershipStatus VARCHAR(20);

    SELECT @memberId = p.memberId, @membershipId = p.membershipId, @paymentStatus = p.status,
           @paymentCode = p.code, @notes = p.notes, @membershipStatus = ms.status
    FROM dbo.payments p
    LEFT JOIN dbo.memberships ms ON p.membershipId = ms.id
    WHERE p.id = @id;

    IF @memberId IS NULL
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50001, N'Không tìm thấy giao dịch thanh toán', 1;
    END

    IF @paymentStatus <> 'PENDING'
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50002, N'Chỉ hóa đơn đang chờ (PENDING) mới có thể từ chối/hủy', 1;
    END

    UPDATE dbo.payments
    SET status = 'CANCELLED',
        confirmedById = @actorId,
        confirmedAt = @now,
        notes = CASE WHEN @reason IS NOT NULL AND @reason <> ''
                     THEN ISNULL(@notes + ' | ' + N'Lý do: ' + @reason, N'Lý do: ' + @reason)
                     ELSE notes END,
        updatedAt = @now
    WHERE id = @id;

    IF @membershipId IS NOT NULL AND @membershipStatus = 'PENDING'
    BEGIN
      UPDATE dbo.memberships SET status = 'CANCELLED', updatedAt = @now WHERE id = @membershipId;
    END

    UPDATE dbo.invoices SET status = 'CANCELLED', updatedAt = @now WHERE paymentId = @id AND status = 'ISSUED';

    INSERT INTO dbo.notifications (memberId, title, content, type, link, isRead, createdAt, referenceType, referenceId)
    VALUES (@memberId, N'Thanh toán chưa được xác nhận ⚠️',
            CASE WHEN @reason IS NOT NULL AND @reason <> '' THEN N'Hóa đơn ' + @paymentCode + N' đã bị từ chối. Lý do: ' + @reason
                 ELSE N'Hóa đơn ' + @paymentCode + N' đã bị từ chối. Vui lòng liên hệ lễ tân phòng tập để được hỗ trợ.' END,
            'PAYMENT', '/member/payments', 0, @now, 'PAYMENT_REJECTED', @id);

    COMMIT TRANSACTION;

    SELECT p.id, p.code, p.memberId, p.membershipId, p.promotionId, p.amount, p.discountAmount,
           p.currency, p.method, p.status, p.transactionRef, p.notes, p.confirmedById,
           p.confirmedAt, p.paidAt, p.createdAt, p.updatedAt
    FROM dbo.payments p WHERE p.id = @id;

    SELECT ms.id, ms.memberId, ms.packageId, ms.startDate, ms.endDate, ms.price,
           ms.discountAmount, ms.finalAmount, ms.remainingSessions, ms.status, ms.createdAt, ms.updatedAt
    FROM dbo.memberships ms WHERE ms.id = @membershipId;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
