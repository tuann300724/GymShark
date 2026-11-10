-- Migration an toàn (chỉ THÊM cột nullable, KHÔNG sửa/xoá dữ liệu cũ):
--   + Membership: yêu cầu hủy gói do hội viên gửi (chờ admin duyệt)
--   + Payment:   số tiền hoàn thực tế + phương thức hoàn (chuyển khoản/tiền mặt)
-- Idempotent: chạy lại nhiều lần không sao.
-- Chạy: npx prisma db execute --file prisma/sqlserver-cancel-refund-columns.sql

IF COL_LENGTH('Membership', 'cancelRequestedAt') IS NULL
  ALTER TABLE Membership ADD cancelRequestedAt DATETIME2 NULL;

IF COL_LENGTH('Membership', 'cancelRequestReason') IS NULL
  ALTER TABLE Membership ADD cancelRequestReason NVARCHAR(MAX) NULL;

IF COL_LENGTH('Payment', 'refundAmount') IS NULL
  ALTER TABLE Payment ADD refundAmount DECIMAL(12, 2) NULL;

IF COL_LENGTH('Payment', 'refundMethod') IS NULL
  ALTER TABLE Payment ADD refundMethod NVARCHAR(400) NULL;
