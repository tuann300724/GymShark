-- GymShark Prompt Log for SQL Server

IF OBJECT_ID(N'dbo.prompt_log', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.prompt_log (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_prompt_log PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    purpose NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_prompt_log_created_at DEFAULT SYSUTCDATETIME()
  );
END;

INSERT INTO dbo.prompt_log (title, content, purpose) VALUES
(N'Schema + AuditLog', N'Thêm model Branch, AuditLog 34 action @Global log() không throw.', N'Bảo mật + phân hệ phòng'),
(N'Face-checkout endpoint', N'POST /checkins/face-checkout — nhận embedding, matchGlobal, kiểm tra CHECKED_IN → CHECKED_OUT + notification + audit.', N'Tự động check-out tại kiosk'),
(N'Kiosk page /kiosk', N'Full-screen, camera liên tục, face-scan, tự gọi face-checkout khi "trong phòng", reset 3s.', N'Quét mặt tự phục vụ'),
(N'SQL Server database', N'Cấu hình backend sử dụng SQL Server 2022, database gym_db; không lưu credentials trong repo.', N'Môi trường khai báo'),
(N'Member face-checkin', N'Trang /member/face-checkin, POST /checkins/face, consent NĐ13/2023, model human.', N'Hội viên tự quét'),
(N'Promotion STEP 8', N'Promotions + notifications + reports: CRUD, auto-expire, usage, bell ticker, CSV BOM, 8 tabs.', N'Khuyến mãi + báo cáo'),
(N'Payment + Invoice STEP 6', N'PaymentGateway CASH/BANK thật, MOMO/VNPAY stub, Invoice INV-2026-NNNNNN, confirm/refund.', N'Thanh toán thật'),
(N'AGENTS.md + WORKLOG', N'Cập nhật AGENTS.md + WORKLOG.md: commit, bẫy QA, smoke, browser, encoding.', N'Hướng dẫn làm việc'),
(N'Canva presentation prompt', N'Tạo prompt Canva 7 slide dark+neon: bìa, quét mặt, thanh toán, khuyến mãi, kiến trúc, kết luận.', N'Thuyết trình đồ án'),
(N'Thuyet-trinh doc update', N'Sửa docs/thuyet-trinh.md thêm thanh toán/chat/quét mặt/audit — không chỉ quét mặt.', N'Tài liệu đầy đủ');
