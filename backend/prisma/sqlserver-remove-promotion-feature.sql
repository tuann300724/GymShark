-- Gỡ hoàn toàn tính năng KHUYẾN MÃI & VOUCHER (Promotion) khỏi gym_db.
-- Chiến lược ARCHIVE + DROP: chép toàn bộ dữ liệu sang bảng backup trước, rồi mới xoá.
-- KHÔNG tự chạy. Trình tự bắt buộc:
--   1) BACKUP DATABASE gym_db TO DISK = '...'  (backup đầy đủ)
--   2) Review script này
--   3) Chạy bằng sqlcmd / SSMS trên đúng database gym_db
--   4) Kiểm tra: backup tables còn nguyên, Promotion đã biến mất, Payment không còn promotionId
--
-- Giữ lại: dbo.Payment.discountAmount (lịch sử tiền giảm thật tại thời điểm thanh toán).
-- Script idempotent: chạy lại lần 2 không lỗi, backup cũ không bị ghi đè.
--
-- Sau khi chạy xong, đồng bộ lại client:  cd backend  &&  npx prisma generate
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51030, 'Refusing to remove promotion feature outside gym_db.', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  -- ========== 1) BACKUP dbo.Promotion ==========
  IF OBJECT_ID(N'dbo.Promotion', N'U') IS NOT NULL
  BEGIN
    IF OBJECT_ID(N'dbo._Backup_Promotion_20261119', N'U') IS NULL
    BEGIN
      SELECT * INTO dbo._Backup_Promotion_20261119 FROM dbo.Promotion;
      DECLARE @promoRows BIGINT = (SELECT COUNT_BIG(*) FROM dbo._Backup_Promotion_20261119);
      PRINT CONCAT('Backup dbo.Promotion -> dbo._Backup_Promotion_20261119 (', @promoRows, ' dong).');
    END
    ELSE
      PRINT 'dbo._Backup_Promotion_20261119 da ton tai - bo qua tao lai (giu snapshot cu).';
  END
  ELSE
    PRINT 'dbo.Promotion khong ton tai - bo qua backup bang Promotion.';

  -- ========== 2) BACKUP Payment.promotionId (truoc khi drop cot) ==========
  IF COL_LENGTH(N'dbo.Payment', N'promotionId') IS NOT NULL
  BEGIN
    IF OBJECT_ID(N'dbo._Backup_Payment_Promotion_20261119', N'U') IS NULL
    BEGIN
      SELECT id AS paymentId,
             code AS paymentCode,
             promotionId,
             discountAmount,
             createdAt
      INTO dbo._Backup_Payment_Promotion_20261119
      FROM dbo.Payment
      WHERE promotionId IS NOT NULL;
      DECLARE @payPromoRows BIGINT = (SELECT COUNT_BIG(*) FROM dbo._Backup_Payment_Promotion_20261119);
      PRINT CONCAT('Backup Payment.promotionId -> dbo._Backup_Payment_Promotion_20261119 (', @payPromoRows, ' dong).');
    END
    ELSE
      PRINT 'dbo._Backup_Payment_Promotion_20261119 da ton tai - bo qua tao lai (giu snapshot cu).';
  END
  ELSE
    PRINT 'dbo.Payment.promotionId khong ton tai - bo qua backup cot.';

  -- ========== 3) Drop foreign keys tham chieu dbo.Promotion (moi bang) ==========
  DECLARE @fkName NVARCHAR(128), @fkParent NVARCHAR(128);
  DECLARE fk_cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT fk.name, OBJECT_NAME(fk.parent_object_id)
    FROM sys.foreign_keys AS fk
    WHERE fk.referenced_object_id = OBJECT_ID(N'dbo.Promotion');
  OPEN fk_cur;
  FETCH NEXT FROM fk_cur INTO @fkName, @fkParent;
  WHILE @@FETCH_STATUS = 0
  BEGIN
    DECLARE @dropFk NVARCHAR(400) =
      N'ALTER TABLE dbo.' + QUOTENAME(@fkParent) + N' DROP CONSTRAINT ' + QUOTENAME(@fkName) + N';';
    EXEC sys.sp_executesql @dropFk;
    PRINT CONCAT('Dropped FK ', @fkName, ' tren bang ', @fkParent);
    FETCH NEXT FROM fk_cur INTO @fkName, @fkParent;
  END
  CLOSE fk_cur;
  DEALLOCATE fk_cur;

  -- ========== 4) Drop indexes tren dbo.Payment co chua cot promotionId ==========
  DECLARE @ixName NVARCHAR(128);
  DECLARE ix_cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT DISTINCT i.name
    FROM sys.indexes AS i
    JOIN sys.index_columns AS ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns AS c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.Payment')
      AND c.name = N'promotionId'
      AND i.is_primary_key = 0
      AND i.is_unique_constraint = 0
      AND i.type > 0;
  OPEN ix_cur;
  FETCH NEXT FROM ix_cur INTO @ixName;
  WHILE @@FETCH_STATUS = 0
  BEGIN
    DECLARE @dropIx NVARCHAR(400) =
      N'DROP INDEX ' + QUOTENAME(@ixName) + N' ON dbo.Payment;';
    EXEC sys.sp_executesql @dropIx;
    PRINT CONCAT('Dropped index dbo.Payment.', @ixName);
    FETCH NEXT FROM ix_cur INTO @ixName;
  END
  CLOSE ix_cur;
  DEALLOCATE ix_cur;

  -- ========== 5) Drop cot dbo.Payment.promotionId ==========
  IF COL_LENGTH(N'dbo.Payment', N'promotionId') IS NOT NULL
  BEGIN
    ALTER TABLE dbo.Payment DROP COLUMN promotionId;
    PRINT 'Dropped column dbo.Payment.promotionId';
  END

  -- ========== 6) Drop bang dbo.Promotion ==========
  IF OBJECT_ID(N'dbo.Promotion', N'U') IS NOT NULL
  BEGIN
    -- Chan neu van con bang khac tham chieu (an toan tuyet doi)
    IF EXISTS (
      SELECT 1
      FROM sys.foreign_keys
      WHERE referenced_object_id = OBJECT_ID(N'dbo.Promotion')
    )
      THROW 51031, 'Con bang khac tham chieu Promotion - da bao ve trong transaction, chi backup de dang chay.', 1;

    DROP TABLE dbo.Promotion;
    PRINT 'Dropped table dbo.Promotion';
  END

  COMMIT TRANSACTION;
  PRINT 'HOAN TAT: da archive + xoa tinh nang Khuyen mai & Voucher.';
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
