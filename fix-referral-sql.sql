USE gym_db;

-- Kiểm tra cột referral có thiếu không
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Member') AND name = 'referralCode')
BEGIN
    ALTER TABLE Member ADD referralCode NVARCHAR(50) NULL;
    PRINT 'Added referralCode';
END
ELSE
    PRINT 'referralCode already exists';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Member') AND name = 'referredById')
BEGIN
    ALTER TABLE Member ADD referredById NVARCHAR(100) NULL;
    PRINT 'Added referredById';
END
ELSE
    PRINT 'referredById already exists';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Member') AND name = 'referralRewardedAt')
BEGIN
    ALTER TABLE Member ADD referralRewardedAt DATETIME2 NULL;
    PRINT 'Added referralRewardedAt';
END
ELSE
    PRINT 'referralRewardedAt already exists';

-- Kiểm tra bảng FaceEmbedding (cho quét khuôn mặt)
IF OBJECT_ID('FaceEmbedding', 'U') IS NULL
BEGIN
    PRINT 'WARNING: Table FaceEmbedding does NOT exist!';
END
ELSE
BEGIN
    PRINT 'FaceEmbedding table exists';
END
