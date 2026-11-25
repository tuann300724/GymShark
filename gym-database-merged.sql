USE [gym_db]
GO
/****** Object:  User [gym_app]    Script Date: 25/11/2026 12:14:03 PM ******/
CREATE USER [gym_app] FOR LOGIN [gym_app] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_owner] ADD MEMBER [gym_app]
GO

/****** Object:  Table [dbo].[Branch]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Branch](
	[id] [nvarchar](100) NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[address] [nvarchar](max) NULL,
	[phone] [nvarchar](400) NULL,
	[status] [nvarchar](400) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [Branch_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BeverageSale]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BeverageSale](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](50) NOT NULL,
	[branchId] [nvarchar](100) NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[staffId] [uniqueidentifier] NOT NULL,
	[saleDate] [datetime2](7) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[paymentMethod] [nvarchar](30) NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[discountAmount] [decimal](18, 2) NOT NULL,
	[totalAmount] [decimal](18, 2) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[paidAt] [datetime2](7) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_BeverageSale] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_BeverageSale_code] UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BeverageSaleItem]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BeverageSaleItem](
	[id] [uniqueidentifier] NOT NULL,
	[saleId] [uniqueidentifier] NOT NULL,
	[productId] [uniqueidentifier] NOT NULL,
	[quantity] [decimal](18, 3) NOT NULL,
	[unitPrice] [decimal](18, 2) NOT NULL,
	[unitCost] [decimal](18, 2) NOT NULL,
	[lineTotal]  AS (CONVERT([decimal](18,2),[quantity]*[unitPrice])) PERSISTED,
	[notes] [nvarchar](500) NULL,
	[createdAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_BeverageSaleItem] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[User]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[User](
	[id] [uniqueidentifier] NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[passwordHash] [nvarchar](500) NOT NULL,
	[fullName] [nvarchar](255) NOT NULL,
	[phone] [nvarchar](50) NULL,
	[role] [nvarchar](20) NOT NULL,
	[status] [nvarchar](20) NULL,
	[avatarUrl] [nvarchar](500) NULL,
	[provider] [nvarchar](50) NULL,
	[providerId] [nvarchar](200) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Member]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Member](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](20) NOT NULL,
	[userId] [uniqueidentifier] NULL,
	[fullName] [nvarchar](255) NOT NULL,
	[email] [nvarchar](255) NULL,
	[phone] [nvarchar](50) NOT NULL,
	[gender] [nvarchar](10) NULL,
	[dateOfBirth] [date] NULL,
	[address] [nvarchar](500) NULL,
	[status] [nvarchar](20) NULL,
	[notes] [nvarchar](max) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[joinedAt] [datetime2](7) NOT NULL,
	[avatarUrl] [nvarchar](400) NULL,
	[emergencyContact] [nvarchar](max) NULL,
	[referralCode] [nvarchar](400) NULL,
	[referredById] [uniqueidentifier] NULL,
	[referralRewardedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_BeverageSalesStatistics]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[vw_BeverageSalesStatistics]
AS
SELECT
    s.id AS saleId,
    s.code AS saleCode,
    s.branchId,
    b.name AS branchName,
    s.memberId,
    mem.fullName AS memberName,
    s.staffId,
    usr.fullName AS staffName,
    s.saleDate,
    s.status,
    s.paymentMethod,
    COUNT(si.id) AS productLineCount,
    COALESCE(SUM(si.quantity), 0) AS totalSoldQuantity,
    s.subtotal,
    s.discountAmount,
    s.totalAmount,
    CASE WHEN s.status = N'PAID' THEN s.totalAmount ELSE 0 END AS recognizedRevenue,
    s.paidAt
FROM dbo.BeverageSale AS s
INNER JOIN dbo.Branch AS b ON b.id = s.branchId
INNER JOIN dbo.Member AS mem ON mem.id = s.memberId
INNER JOIN dbo.[User] AS usr ON usr.id = s.staffId
LEFT JOIN dbo.BeverageSaleItem AS si ON si.saleId = s.id
GROUP BY
    s.id, s.code, s.branchId, b.name, s.memberId, mem.fullName,
    s.staffId, usr.fullName, s.saleDate, s.status,
    s.paymentMethod, s.subtotal, s.discountAmount, s.totalAmount, s.paidAt;
GO
/****** Object:  Table [dbo].[BeverageStockMovement]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BeverageStockMovement](
	[id] [uniqueidentifier] NOT NULL,
	[branchId] [nvarchar](100) NOT NULL,
	[productId] [uniqueidentifier] NOT NULL,
	[importItemId] [uniqueidentifier] NULL,
	[saleItemId] [uniqueidentifier] NULL,
	[movementType] [nvarchar](30) NOT NULL,
	[quantityChange] [decimal](18, 3) NOT NULL,
	[createdById] [uniqueidentifier] NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[notes] [nvarchar](500) NULL,
 CONSTRAINT [PK_BeverageStockMovement] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BeverageProduct]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BeverageProduct](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](50) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[category] [nvarchar](100) NULL,
	[brand] [nvarchar](150) NULL,
	[unit] [nvarchar](30) NOT NULL,
	[volumeMl] [int] NULL,
	[costPrice] [decimal](18, 2) NOT NULL,
	[sellingPrice] [decimal](18, 2) NOT NULL,
	[minStock] [decimal](18, 3) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[description] [nvarchar](max) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_BeverageProduct] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_BeverageProduct_code] UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_BeverageStock]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* 8. View ton kho hien tai theo chi nhanh va san pham */
CREATE   VIEW [dbo].[vw_BeverageStock]
AS
SELECT
    m.branchId,
    b.name AS branchName,
    m.productId,
    p.code AS productCode,
    p.name AS productName,
    p.category,
    p.unit,
    p.volumeMl,
    p.costPrice,
    p.sellingPrice,
    p.minStock,
    SUM(m.quantityChange) AS stockQuantity,
    CASE WHEN SUM(m.quantityChange) <= 0 THEN N'OUT_OF_STOCK'
         WHEN SUM(m.quantityChange) <= p.minStock THEN N'LOW_STOCK'
         ELSE N'IN_STOCK' END AS stockStatus
FROM dbo.BeverageStockMovement AS m
INNER JOIN dbo.BeverageProduct AS p ON p.id = m.productId
INNER JOIN dbo.Branch AS b ON b.id = m.branchId
GROUP BY
    m.branchId, b.name, m.productId, p.code, p.name,
    p.category, p.unit, p.volumeMl, p.costPrice, p.sellingPrice, p.minStock;
GO
/****** Object:  Table [dbo].[BeverageImportItem]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BeverageImportItem](
	[id] [uniqueidentifier] NOT NULL,
	[importId] [uniqueidentifier] NOT NULL,
	[productId] [uniqueidentifier] NOT NULL,
	[quantity] [decimal](18, 3) NOT NULL,
	[unitCost] [decimal](18, 2) NOT NULL,
	[lineTotal]  AS (CONVERT([decimal](18,2),[quantity]*[unitCost])) PERSISTED,
	[batchNumber] [nvarchar](100) NULL,
	[expiryDate] [date] NULL,
	[notes] [nvarchar](500) NULL,
	[createdAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_BeverageImportItem] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BeverageImport]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BeverageImport](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](50) NOT NULL,
	[branchId] [nvarchar](100) NOT NULL,
	[supplierName] [nvarchar](255) NULL,
	[supplierPhone] [nvarchar](50) NULL,
	[importDate] [datetime2](7) NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[subtotal] [decimal](18, 2) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[createdById] [uniqueidentifier] NULL,
	[receivedById] [uniqueidentifier] NULL,
	[receivedAt] [datetime2](7) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_BeverageImport] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_BeverageImport_code] UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_BeverageImportStatistics]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* 9. View thong ke nhap hang */
CREATE   VIEW [dbo].[vw_BeverageImportStatistics]
AS
SELECT
    i.id AS importId,
    i.code AS importCode,
    i.branchId,
    b.name AS branchName,
    i.supplierName,
    i.importDate,
    i.status,
    i.createdById,
    i.receivedById,
    i.receivedAt,
    COUNT(ii.id) AS productLineCount,
    COALESCE(SUM(ii.quantity), 0) AS totalImportedQuantity,
    COALESCE(SUM(ii.lineTotal), 0) AS calculatedImportCost
FROM dbo.BeverageImport AS i
INNER JOIN dbo.Branch AS b ON b.id = i.branchId
LEFT JOIN dbo.BeverageImportItem AS ii ON ii.importId = i.id
GROUP BY
    i.id, i.code, i.branchId, b.name, i.supplierName, i.importDate,
    i.status, i.createdById, i.receivedById, i.receivedAt;
GO
/****** Object:  View [dbo].[vw_BeverageProductSalesStatistics]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* 11. View thong ke doanh thu theo san pham */
CREATE   VIEW [dbo].[vw_BeverageProductSalesStatistics]
AS
SELECT
    s.branchId,
    b.name AS branchName,
    si.productId,
    p.code AS productCode,
    p.name AS productName,
    p.category,
    p.unit,
    SUM(si.quantity) AS soldQuantity,
    SUM(si.lineTotal) AS salesRevenue,
    SUM(si.quantity * si.unitCost) AS estimatedCost,
    SUM(si.lineTotal - (si.quantity * si.unitCost)) AS estimatedGrossProfit
FROM dbo.BeverageSale AS s
INNER JOIN dbo.BeverageSaleItem AS si ON si.saleId = s.id
INNER JOIN dbo.BeverageProduct AS p ON p.id = si.productId
INNER JOIN dbo.Branch AS b ON b.id = s.branchId
WHERE s.status = N'PAID'
GROUP BY s.branchId, b.name, si.productId, p.code, p.name, p.category, p.unit;
GO
/****** Object:  Table [dbo].[AuditLog]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AuditLog](
	[id] [nvarchar](100) NOT NULL,
	[userId] [nvarchar](100) NULL,
	[action] [nvarchar](400) NOT NULL,
	[entity] [nvarchar](400) NOT NULL,
	[entityId] [nvarchar](100) NULL,
	[metadata] [nvarchar](max) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[ip] [nvarchar](400) NULL,
 CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BodyMetric]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BodyMetric](
	[id] [nvarchar](100) NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[recordedAt] [datetime2](7) NOT NULL,
	[weightKg] [float] NULL,
	[bodyFatPercent] [float] NULL,
	[waistCm] [float] NULL,
	[chestCm] [float] NULL,
	[armCm] [float] NULL,
	[thighCm] [float] NULL,
	[note] [nvarchar](max) NULL,
	[createdAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BranchMemberAssignmentArchive]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BranchMemberAssignmentArchive](
	[entityId] [nvarchar](100) NOT NULL,
	[branchId] [nvarchar](100) NULL,
	[archivedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_BranchMemberAssignmentArchive] PRIMARY KEY CLUSTERED 
(
	[entityId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CheckIn]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CheckIn](
	[id] [nvarchar](100) NOT NULL,
	[memberId] [nvarchar](100) NOT NULL,
	[method] [nvarchar](400) NOT NULL,
	[checkInTime] [datetime2](7) NOT NULL,
	[checkOutTime] [datetime2](7) NULL,
	[status] [nvarchar](400) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[equipmentId] [nvarchar](100) NULL,
	[partnerId] [uniqueidentifier] NULL,
	[unitPrice] [decimal](12, 2) NULL,
	[commissionRate] [decimal](5, 4) NULL,
	[commissionAmount] [decimal](12, 2) NULL,
 CONSTRAINT [CheckIn_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ClassBooking]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ClassBooking](
	[id] [nvarchar](100) NOT NULL,
	[scheduleId] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_ClassBooking_schedule_member] UNIQUE NONCLUSTERED 
(
	[scheduleId] ASC,
	[memberId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Conversation]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Conversation](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NULL,
	[trainerId] [uniqueidentifier] NULL,
	[status] [nvarchar](20) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[lastMessageAt] [datetime2](7) NULL,
	[lastMessagePreview] [nvarchar](max) NULL,
	[lastSenderRole] [nvarchar](400) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EmailVerification]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EmailVerification](
	[id] [nvarchar](100) NOT NULL,
	[email] [nvarchar](400) NOT NULL,
	[fullName] [nvarchar](400) NOT NULL,
	[phone] [nvarchar](400) NOT NULL,
	[passwordHash] [nvarchar](400) NOT NULL,
	[codeHash] [nvarchar](400) NOT NULL,
	[gender] [nvarchar](400) NOT NULL,
	[dateOfBirth] [datetime2](7) NULL,
	[address] [nvarchar](max) NULL,
	[emergencyContact] [nvarchar](max) NULL,
	[attempts] [int] NOT NULL,
	[expiresAt] [datetime2](7) NOT NULL,
	[lastSentAt] [datetime2](7) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [EmailVerification_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Equipment]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Equipment](
	[id] [nvarchar](100) NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[code] [nvarchar](400) NOT NULL,
	[type] [nvarchar](400) NOT NULL,
	[status] [nvarchar](400) NOT NULL,
	[capacity] [int] NULL,
	[createdAt] [datetime] NOT NULL,
	[updatedAt] [datetime] NOT NULL,
 CONSTRAINT [PK_Equipment] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Equipment_code] UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EquipmentMaintenance]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EquipmentMaintenance](
	[id] [nvarchar](100) NOT NULL,
	[equipmentId] [nvarchar](100) NOT NULL,
	[status] [nvarchar](400) NOT NULL,
	[startDate] [datetime] NOT NULL,
	[endDate] [datetime] NULL,
	[description] [nvarchar](max) NULL,
	[notes] [nvarchar](max) NULL,
	[createdAt] [datetime] NOT NULL,
	[updatedAt] [datetime] NOT NULL,
 CONSTRAINT [PK_EquipmentMaintenance] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Exercise]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Exercise](
	[id] [nvarchar](100) NOT NULL,
	[name] [nvarchar](400) NULL,
	[enName] [nvarchar](400) NULL,
	[group] [nvarchar](400) NULL,
	[equipment] [nvarchar](400) NULL,
	[description] [nvarchar](max) NULL,
	[imageUrl] [nvarchar](400) NULL,
	[createdAt] [datetime] NULL,
	[updatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FaceEmbedding]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FaceEmbedding](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[embedding] [nvarchar](max) NULL,
	[imageData] [nvarchar](max) NULL,
	[consentAt] [datetime2](7) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Food]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Food](
	[id] [nvarchar](100) NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[category] [nvarchar](400) NOT NULL,
	[imageUrl] [nvarchar](400) NULL,
	[description] [nvarchar](max) NULL,
	[servingSize] [float] NOT NULL,
	[servingUnit] [nvarchar](400) NOT NULL,
	[caloriesPer100g] [float] NOT NULL,
	[proteinPer100g] [float] NOT NULL,
	[carbsPer100g] [float] NOT NULL,
	[fatPer100g] [float] NOT NULL,
	[isActive] [bit] NOT NULL,
	[createdById] [nvarchar](100) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [Food_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Invoice]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Invoice](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](50) NULL,
	[status] [nvarchar](20) NULL,
	[amount] [decimal](12, 2) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[invoiceNumber] [nvarchar](400) NOT NULL,
	[membershipId] [uniqueidentifier] NULL,
	[paymentId] [uniqueidentifier] NULL,
	[subtotal] [decimal](12, 2) NOT NULL,
	[discount] [decimal](12, 2) NOT NULL,
	[total] [decimal](12, 2) NOT NULL,
	[issuedAt] [datetime2](7) NOT NULL,
	[dueDate] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Meal]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Meal](
	[id] [nvarchar](100) NOT NULL,
	[mealPlanId] [nvarchar](100) NOT NULL,
	[type] [nvarchar](400) NOT NULL,
	[dayIndex] [int] NULL,
	[time] [nvarchar](400) NULL,
	[note] [nvarchar](400) NULL,
	[imageData] [nvarchar](max) NULL,
	[totalCalories] [float] NOT NULL,
	[totalProtein] [float] NOT NULL,
	[totalCarbs] [float] NOT NULL,
	[totalFat] [float] NOT NULL,
	[orderIndex] [int] NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [Meal_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MealItem]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MealItem](
	[id] [nvarchar](100) NOT NULL,
	[mealId] [nvarchar](100) NOT NULL,
	[foodId] [nvarchar](100) NULL,
	[name] [nvarchar](400) NOT NULL,
	[imageUrl] [nvarchar](400) NULL,
	[quantity] [float] NOT NULL,
	[unit] [nvarchar](400) NOT NULL,
	[calories] [float] NOT NULL,
	[protein] [float] NOT NULL,
	[carbs] [float] NOT NULL,
	[fat] [float] NOT NULL,
	[orderIndex] [int] NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [MealItem_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MealPlan]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MealPlan](
	[id] [nvarchar](100) NOT NULL,
	[trainerId] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NULL,
	[title] [nvarchar](400) NOT NULL,
	[description] [nvarchar](max) NULL,
	[scope] [nvarchar](400) NOT NULL,
	[startDate] [datetime2](7) NULL,
	[status] [nvarchar](400) NOT NULL,
	[isTemplate] [bit] NOT NULL,
	[templateName] [nvarchar](400) NULL,
	[imageData] [nvarchar](max) NULL,
	[totalCalories] [float] NOT NULL,
	[totalProtein] [float] NOT NULL,
	[totalCarbs] [float] NOT NULL,
	[totalFat] [float] NOT NULL,
	[version] [int] NOT NULL,
	[confirmedAt] [datetime2](7) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [MealPlan_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Membership]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Membership](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[packageType] [nvarchar](20) NULL,
	[status] [nvarchar](20) NULL,
	[startDate] [datetime2](7) NOT NULL,
	[endDate] [datetime2](7) NOT NULL,
	[price] [decimal](12, 2) NULL,
	[note] [nvarchar](500) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[packageId] [uniqueidentifier] NOT NULL,
	[discountAmount] [decimal](12, 2) NULL,
	[finalAmount] [decimal](12, 2) NULL,
	[remainingSessions] [int] NULL,
	[cancelRequestedAt] [datetime2](7) NULL,
	[cancelRequestReason] [nvarchar](max) NULL,
	[ptSessionsIncluded] [int] NULL,
	[ptSessionsUsed] [int] NOT NULL,
	[ptSessionValue] [decimal](12, 2) NULL,
	[visitLimit] [int] NULL,
	[dailyVisitLimit] [int] NOT NULL,
	[gymTierAccess] [nvarchar](max) NULL,
	[freezeStartedAt] [datetime2](7) NULL,
	[freezeEndsAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MembershipChangeRequest]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MembershipChangeRequest](
	[id] [uniqueidentifier] NOT NULL,
	[membershipId] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[type] [nvarchar](40) NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[reason] [nvarchar](max) NULL,
	[reviewNote] [nvarchar](max) NULL,
	[freezeDays] [int] NULL,
	[freezeStartsAt] [datetime2](7) NULL,
	[freezeEndsAt] [datetime2](7) NULL,
	[ptSessionsUsed] [int] NULL,
	[proposedRefundAmount] [decimal](12, 2) NULL,
	[proposedRefundReason] [nvarchar](max) NULL,
	[refundAmount] [decimal](12, 2) NULL,
	[refundMethod] [nvarchar](40) NULL,
	[refundReference] [nvarchar](400) NULL,
	[memberConfirmedAt] [datetime2](7) NULL,
	[reviewedAt] [datetime2](7) NULL,
	[reviewedById] [uniqueidentifier] NULL,
	[approvedAt] [datetime2](7) NULL,
	[approvedById] [uniqueidentifier] NULL,
	[completedAt] [datetime2](7) NULL,
	[completedById] [uniqueidentifier] NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_MembershipChangeRequest] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MembershipPackage]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MembershipPackage](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[durationDays] [int] NULL,
	[sessionCount] [int] NULL,
	[price] [decimal](12, 2) NOT NULL,
	[isActive] [bit] NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[code] [nvarchar](400) NOT NULL,
	[features] [nvarchar](max) NULL,
	[sessions] [int] NULL,
	[type] [nvarchar](400) NOT NULL,
	[status] [nvarchar](400) NOT NULL,
	[ptSessionValue] [decimal](12, 2) NULL,
	[visitLimit] [int] NULL,
	[dailyVisitLimit] [int] NOT NULL,
	[gymTierAccess] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Message]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Message](
	[id] [uniqueidentifier] NOT NULL,
	[conversationId] [uniqueidentifier] NOT NULL,
	[senderId] [uniqueidentifier] NOT NULL,
	[receiverId] [uniqueidentifier] NULL,
	[content] [nvarchar](max) NULL,
	[isRead] [bit] NULL,
	[createdAt] [datetime2](7) NULL,
	[type] [nvarchar](400) NOT NULL,
	[mealPlanId] [nvarchar](100) NULL,
	[readAt] [datetime2](7) NULL,
	[editedAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deliveredAt] [datetime2](7) NULL,
	[recalledAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MessageAttachment]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MessageAttachment](
	[id] [nvarchar](100) NOT NULL,
	[messageId] [uniqueidentifier] NOT NULL,
	[kind] [nvarchar](400) NOT NULL,
	[fileName] [nvarchar](400) NULL,
	[mimeType] [nvarchar](400) NULL,
	[sizeBytes] [int] NULL,
	[dataUrl] [nvarchar](max) NOT NULL,
	[width] [int] NULL,
	[height] [int] NULL,
	[createdAt] [datetime2](7) NOT NULL,
 CONSTRAINT [MessageAttachment_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Notification]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Notification](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NULL,
	[title] [nvarchar](255) NOT NULL,
	[content] [nvarchar](1000) NOT NULL,
	[type] [nvarchar](30) NULL,
	[link] [nvarchar](500) NULL,
	[referenceType] [nvarchar](50) NULL,
	[referenceId] [nvarchar](200) NULL,
	[isRead] [bit] NULL,
	[createdAt] [datetime2](7) NULL,
	[userId] [uniqueidentifier] NULL,
	[readAt] [datetime2](7) NULL,
	[data] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Partner]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Partner](
	[id] [uniqueidentifier] NOT NULL,
	[userId] [uniqueidentifier] NOT NULL,
	[businessName] [nvarchar](400) NOT NULL,
	[taxCode] [nvarchar](100) NULL,
	[phone] [nvarchar](400) NULL,
	[email] [nvarchar](400) NULL,
	[address] [nvarchar](max) NULL,
	[status] [nvarchar](40) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[commissionRate] [decimal](5, 4) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PartnerBranch]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PartnerBranch](
	[id] [uniqueidentifier] NOT NULL,
	[partnerId] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](400) NOT NULL,
	[address] [nvarchar](max) NULL,
	[phone] [nvarchar](400) NULL,
	[status] [nvarchar](40) NOT NULL,
	[latitude] [float] NULL,
	[longitude] [float] NULL,
	[notes] [nvarchar](max) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PasswordReset]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PasswordReset](
	[id] [nvarchar](100) NOT NULL,
	[email] [nvarchar](400) NOT NULL,
	[codeHash] [nvarchar](400) NOT NULL,
	[attempts] [int] NOT NULL,
	[expiresAt] [datetime2](7) NOT NULL,
	[lastSentAt] [datetime2](7) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PasswordReset_pkey] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Payment]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Payment](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[amount] [decimal](12, 2) NOT NULL,
	[method] [nvarchar](20) NULL,
	[status] [nvarchar](20) NULL,
	[currency] [nvarchar](10) NULL,
	[transactionRef] [nvarchar](200) NULL,
	[confirmedById] [uniqueidentifier] NULL,
	[paidAt] [datetime2](7) NULL,
	[note] [nvarchar](500) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[code] [nvarchar](400) NOT NULL,
	[membershipId] [uniqueidentifier] NULL,
	[promotionId] [uniqueidentifier] NULL,
	[discountAmount] [decimal](12, 2) NULL,
	[notes] [nvarchar](max) NULL,
	[confirmedAt] [datetime2](7) NULL,
	[refundAmount] [decimal](12, 2) NULL,
	[refundMethod] [nvarchar](400) NULL,
	[partnerId] [uniqueidentifier] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Program]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Program](
	[id] [nvarchar](100) NOT NULL,
	[slug] [nvarchar](400) NULL,
	[name] [nvarchar](400) NULL,
	[group] [nvarchar](400) NULL,
	[duration] [int] NULL,
	[summary] [nvarchar](max) NULL,
	[img] [nvarchar](400) NULL,
	[alt] [nvarchar](400) NULL,
	[createdAt] [datetime] NULL,
	[updatedAt] [datetime] NULL,
	[trainerId] [nvarchar](100) NULL,
	[memberId] [nvarchar](100) NULL,
	[status] [nvarchar](400) NULL,
	[isTemplate] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProgramExercise]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProgramExercise](
	[id] [nvarchar](100) NOT NULL,
	[programId] [nvarchar](100) NOT NULL,
	[exerciseId] [nvarchar](100) NOT NULL,
	[sets] [int] NULL,
	[reps] [nvarchar](100) NULL,
	[rest] [nvarchar](400) NULL,
	[orderIndex] [int] NULL,
	[createdAt] [datetime] NULL,
	[updatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_ProgramExercise_program_order] UNIQUE NONCLUSTERED 
(
	[programId] ASC,
	[orderIndex] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Promotion]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Promotion](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](50) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[discountType] [nvarchar](20) NULL,
	[discountValue] [decimal](10, 2) NULL,
	[minOrderValue] [decimal](12, 2) NULL,
	[maxDiscount] [decimal](12, 2) NULL,
	[usageLimit] [int] NULL,
	[usageCount] [int] NULL,
	[startDate] [datetime2](7) NULL,
	[endDate] [datetime2](7) NULL,
	[isActive] [bit] NULL,
	[perMemberLimit] [int] NULL,
	[branchId] [uniqueidentifier] NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[usedCount] [int] NOT NULL,
	[status] [nvarchar](400) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Room]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Room](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](20) NULL,
	[name] [nvarchar](255) NOT NULL,
	[type] [nvarchar](20) NULL,
	[capacity] [int] NULL,
	[floor] [nvarchar](10) NULL,
	[description] [nvarchar](max) NULL,
	[status] [nvarchar](20) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Trainer]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Trainer](
	[id] [uniqueidentifier] NOT NULL,
	[userId] [uniqueidentifier] NOT NULL,
	[specialization] [nvarchar](255) NOT NULL,
	[certification] [nvarchar](500) NULL,
	[experienceYears] [int] NULL,
	[bio] [nvarchar](max) NULL,
	[gender] [nvarchar](10) NULL,
	[dateOfBirth] [datetime2](7) NULL,
	[rating] [float] NULL,
	[hourlyRate] [decimal](10, 2) NULL,
	[status] [nvarchar](20) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TrainerMember]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrainerMember](
	[id] [uniqueidentifier] NOT NULL,
	[trainerId] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[status] [nvarchar](20) NULL,
	[assignedAt] [datetime2](7) NULL,
	[startDate] [datetime2](7) NOT NULL,
	[endDate] [datetime2](7) NULL,
	[note] [nvarchar](400) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TrainerReview]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrainerReview](
	[id] [nvarchar](100) NOT NULL,
	[trainerId] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[rating] [int] NOT NULL,
	[comment] [nvarchar](2000) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_TrainerReview] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_TrainerReview_trainerId_memberId] UNIQUE NONCLUSTERED 
(
	[trainerId] ASC,
	[memberId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TrainingProgress]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrainingProgress](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[trainerId] [uniqueidentifier] NOT NULL,
	[sessionType] [nvarchar](30) NULL,
	[date] [date] NULL,
	[durationMinutes] [int] NULL,
	[notes] [nvarchar](1000) NULL,
	[caloriesBurned] [int] NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[sessionId] [uniqueidentifier] NOT NULL,
	[note] [nvarchar](400) NOT NULL,
	[performance] [nvarchar](max) NULL,
	[recommendation] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TrainingSchedule]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrainingSchedule](
	[id] [uniqueidentifier] NOT NULL,
	[roomId] [uniqueidentifier] NULL,
	[trainerId] [uniqueidentifier] NULL,
	[sessionType] [nvarchar](30) NULL,
	[title] [nvarchar](255) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[startTime] [datetime2](7) NOT NULL,
	[endTime] [datetime2](7) NOT NULL,
	[status] [nvarchar](20) NULL,
	[maxParticipants] [int] NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[memberId] [uniqueidentifier] NULL,
	[type] [nvarchar](400) NOT NULL,
	[notes] [nvarchar](max) NULL,
	[cancellationNote] [nvarchar](max) NULL,
	[completedAt] [datetime2](7) NULL,
	[capacity] [int] NULL,
	[membershipId] [uniqueidentifier] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[AuditLog] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BeverageImport] ADD  CONSTRAINT [DF_BeverageImport_id]  DEFAULT (newsequentialid()) FOR [id]
GO
ALTER TABLE [dbo].[BeverageImport] ADD  CONSTRAINT [DF_BeverageImport_importDate]  DEFAULT (sysdatetime()) FOR [importDate]
GO
ALTER TABLE [dbo].[BeverageImport] ADD  CONSTRAINT [DF_BeverageImport_status]  DEFAULT (N'DRAFT') FOR [status]
GO
ALTER TABLE [dbo].[BeverageImport] ADD  CONSTRAINT [DF_BeverageImport_subtotal]  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[BeverageImport] ADD  CONSTRAINT [DF_BeverageImport_createdAt]  DEFAULT (sysdatetime()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BeverageImport] ADD  CONSTRAINT [DF_BeverageImport_updatedAt]  DEFAULT (sysdatetime()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[BeverageImportItem] ADD  CONSTRAINT [DF_BeverageImportItem_id]  DEFAULT (newsequentialid()) FOR [id]
GO
ALTER TABLE [dbo].[BeverageImportItem] ADD  CONSTRAINT [DF_BeverageImportItem_createdAt]  DEFAULT (sysdatetime()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_id]  DEFAULT (newsequentialid()) FOR [id]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_unit]  DEFAULT (N'CHAI') FOR [unit]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_costPrice]  DEFAULT ((0)) FOR [costPrice]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_sellingPrice]  DEFAULT ((0)) FOR [sellingPrice]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_minStock]  DEFAULT ((0)) FOR [minStock]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_status]  DEFAULT (N'ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_createdAt]  DEFAULT (sysdatetime()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BeverageProduct] ADD  CONSTRAINT [DF_BeverageProduct_updatedAt]  DEFAULT (sysdatetime()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_id]  DEFAULT (newsequentialid()) FOR [id]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_saleDate]  DEFAULT (sysdatetime()) FOR [saleDate]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_status]  DEFAULT (N'DRAFT') FOR [status]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_subtotal]  DEFAULT ((0)) FOR [subtotal]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_discount]  DEFAULT ((0)) FOR [discountAmount]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_total]  DEFAULT ((0)) FOR [totalAmount]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_createdAt]  DEFAULT (sysdatetime()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BeverageSale] ADD  CONSTRAINT [DF_BeverageSale_updatedAt]  DEFAULT (sysdatetime()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[BeverageSaleItem] ADD  CONSTRAINT [DF_BeverageSaleItem_id]  DEFAULT (newsequentialid()) FOR [id]
GO
ALTER TABLE [dbo].[BeverageSaleItem] ADD  CONSTRAINT [DF_BeverageSaleItem_unitCost]  DEFAULT ((0)) FOR [unitCost]
GO
ALTER TABLE [dbo].[BeverageSaleItem] ADD  CONSTRAINT [DF_BeverageSaleItem_createdAt]  DEFAULT (sysdatetime()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BeverageStockMovement] ADD  CONSTRAINT [DF_BeverageStockMovement_id]  DEFAULT (newsequentialid()) FOR [id]
GO
ALTER TABLE [dbo].[BeverageStockMovement] ADD  CONSTRAINT [DF_BeverageStockMovement_createdAt]  DEFAULT (sysdatetime()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BodyMetric] ADD  DEFAULT (getdate()) FOR [recordedAt]
GO
ALTER TABLE [dbo].[BodyMetric] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Branch] ADD  CONSTRAINT [Branch_status_df]  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[Branch] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[BranchMemberAssignmentArchive] ADD  CONSTRAINT [DF_BranchMemberAssignmentArchive_archivedAt]  DEFAULT (sysutcdatetime()) FOR [archivedAt]
GO
ALTER TABLE [dbo].[CheckIn] ADD  CONSTRAINT [CheckIn_method_df]  DEFAULT ('MANUAL') FOR [method]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT (getdate()) FOR [checkInTime]
GO
ALTER TABLE [dbo].[CheckIn] ADD  CONSTRAINT [CheckIn_status_df]  DEFAULT ('CHECKED_IN') FOR [status]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[ClassBooking] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Conversation] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[EmailVerification] ADD  CONSTRAINT [EmailVerification_gender_df]  DEFAULT (N'MALE') FOR [gender]
GO
ALTER TABLE [dbo].[EmailVerification] ADD  CONSTRAINT [EmailVerification_attempts_df]  DEFAULT ((0)) FOR [attempts]
GO
ALTER TABLE [dbo].[EmailVerification] ADD  CONSTRAINT [EmailVerification_lastSentAt_df]  DEFAULT (getdate()) FOR [lastSentAt]
GO
ALTER TABLE [dbo].[EmailVerification] ADD  CONSTRAINT [EmailVerification_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[EmailVerification] ADD  CONSTRAINT [EmailVerification_updatedAt_df]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_id]  DEFAULT (CONVERT([nvarchar](100),newid())) FOR [id]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_type]  DEFAULT (N'CARDIO') FOR [type]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_status]  DEFAULT (N'AVAILABLE') FOR [status]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_createdAt]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_updatedAt]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[EquipmentMaintenance] ADD  CONSTRAINT [DF_EquipmentMaintenance_id]  DEFAULT (CONVERT([nvarchar](100),newid())) FOR [id]
GO
ALTER TABLE [dbo].[EquipmentMaintenance] ADD  CONSTRAINT [DF_EquipmentMaintenance_status]  DEFAULT (N'PENDING') FOR [status]
GO
ALTER TABLE [dbo].[EquipmentMaintenance] ADD  CONSTRAINT [DF_EquipmentMaintenance_createdAt]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[EquipmentMaintenance] ADD  CONSTRAINT [DF_EquipmentMaintenance_updatedAt]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Exercise] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Exercise] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[FaceEmbedding] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[FaceEmbedding] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[FaceEmbedding] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_category_df]  DEFAULT (N'PROTEIN') FOR [category]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_servingSize_df]  DEFAULT ((100)) FOR [servingSize]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_servingUnit_df]  DEFAULT (N'g') FOR [servingUnit]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_caloriesPer100g_df]  DEFAULT ((0)) FOR [caloriesPer100g]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_proteinPer100g_df]  DEFAULT ((0)) FOR [proteinPer100g]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_carbsPer100g_df]  DEFAULT ((0)) FOR [carbsPer100g]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_fatPer100g_df]  DEFAULT ((0)) FOR [fatPer100g]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_isActive_df]  DEFAULT ((1)) FOR [isActive]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Food] ADD  CONSTRAINT [Food_updatedAt_df]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Invoice] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Invoice] ADD  DEFAULT ('DRAFT') FOR [status]
GO
ALTER TABLE [dbo].[Invoice] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[Invoice] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Invoice] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Meal] ADD  CONSTRAINT [Meal_totalCalories_df]  DEFAULT ((0)) FOR [totalCalories]
GO
ALTER TABLE [dbo].[Meal] ADD  CONSTRAINT [Meal_totalProtein_df]  DEFAULT ((0)) FOR [totalProtein]
GO
ALTER TABLE [dbo].[Meal] ADD  CONSTRAINT [Meal_totalCarbs_df]  DEFAULT ((0)) FOR [totalCarbs]
GO
ALTER TABLE [dbo].[Meal] ADD  CONSTRAINT [Meal_totalFat_df]  DEFAULT ((0)) FOR [totalFat]
GO
ALTER TABLE [dbo].[Meal] ADD  CONSTRAINT [Meal_orderIndex_df]  DEFAULT ((0)) FOR [orderIndex]
GO
ALTER TABLE [dbo].[Meal] ADD  CONSTRAINT [Meal_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Meal] ADD  CONSTRAINT [Meal_updatedAt_df]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_quantity_df]  DEFAULT ((100)) FOR [quantity]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_unit_df]  DEFAULT (N'g') FOR [unit]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_calories_df]  DEFAULT ((0)) FOR [calories]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_protein_df]  DEFAULT ((0)) FOR [protein]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_carbs_df]  DEFAULT ((0)) FOR [carbs]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_fat_df]  DEFAULT ((0)) FOR [fat]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_orderIndex_df]  DEFAULT ((0)) FOR [orderIndex]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[MealItem] ADD  CONSTRAINT [MealItem_updatedAt_df]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_scope_df]  DEFAULT (N'DAY') FOR [scope]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_status_df]  DEFAULT (N'SENT') FOR [status]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_isTemplate_df]  DEFAULT ((0)) FOR [isTemplate]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_totalCalories_df]  DEFAULT ((0)) FOR [totalCalories]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_totalProtein_df]  DEFAULT ((0)) FOR [totalProtein]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_totalCarbs_df]  DEFAULT ((0)) FOR [totalCarbs]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_totalFat_df]  DEFAULT ((0)) FOR [totalFat]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_version_df]  DEFAULT ((1)) FOR [version]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[MealPlan] ADD  CONSTRAINT [MealPlan_updatedAt_df]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Member] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Member] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[Member] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Member] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Membership] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Membership] ADD  DEFAULT ('FIXED_TERM') FOR [packageType]
GO
ALTER TABLE [dbo].[Membership] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Membership] ADD  DEFAULT ((0)) FOR [price]
GO
ALTER TABLE [dbo].[Membership] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Membership] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Membership] ADD  CONSTRAINT [DF_Membership_ptSessionsUsed]  DEFAULT ((0)) FOR [ptSessionsUsed]
GO
ALTER TABLE [dbo].[MembershipChangeRequest] ADD  CONSTRAINT [DF_MembershipChangeRequest_status]  DEFAULT (N'REQUESTED') FOR [status]
GO
ALTER TABLE [dbo].[MembershipChangeRequest] ADD  CONSTRAINT [DF_MembershipChangeRequest_createdAt]  DEFAULT (sysutcdatetime()) FOR [createdAt]
GO
ALTER TABLE [dbo].[MembershipChangeRequest] ADD  CONSTRAINT [DF_MembershipChangeRequest_updatedAt]  DEFAULT (sysutcdatetime()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[MembershipPackage] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[MembershipPackage] ADD  DEFAULT ((30)) FOR [durationDays]
GO
ALTER TABLE [dbo].[MembershipPackage] ADD  DEFAULT ((0)) FOR [sessionCount]
GO
ALTER TABLE [dbo].[MembershipPackage] ADD  DEFAULT ((0)) FOR [price]
GO
ALTER TABLE [dbo].[MembershipPackage] ADD  DEFAULT ((1)) FOR [isActive]
GO
ALTER TABLE [dbo].[MembershipPackage] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[MembershipPackage] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Message] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Message] ADD  DEFAULT ((0)) FOR [isRead]
GO
ALTER TABLE [dbo].[Message] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Message] ADD  CONSTRAINT [Message_type_df]  DEFAULT (N'TEXT') FOR [type]
GO
ALTER TABLE [dbo].[MessageAttachment] ADD  CONSTRAINT [MessageAttachment_kind_df]  DEFAULT (N'IMAGE') FOR [kind]
GO
ALTER TABLE [dbo].[MessageAttachment] ADD  CONSTRAINT [MessageAttachment_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Notification] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Notification] ADD  DEFAULT ('GENERAL') FOR [type]
GO
ALTER TABLE [dbo].[Notification] ADD  DEFAULT ((0)) FOR [isRead]
GO
ALTER TABLE [dbo].[Notification] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Partner] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Partner] ADD  DEFAULT (N'PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Partner] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Partner] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Partner] ADD  CONSTRAINT [DF_Partner_commissionRate]  DEFAULT ((0.3000)) FOR [commissionRate]
GO
ALTER TABLE [dbo].[PartnerBranch] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[PartnerBranch] ADD  DEFAULT (N'ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[PartnerBranch] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[PartnerBranch] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[PasswordReset] ADD  CONSTRAINT [PasswordReset_attempts_df]  DEFAULT ((0)) FOR [attempts]
GO
ALTER TABLE [dbo].[PasswordReset] ADD  CONSTRAINT [PasswordReset_lastSentAt_df]  DEFAULT (getdate()) FOR [lastSentAt]
GO
ALTER TABLE [dbo].[PasswordReset] ADD  CONSTRAINT [PasswordReset_createdAt_df]  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[PasswordReset] ADD  CONSTRAINT [PasswordReset_updatedAt_df]  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Payment] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Payment] ADD  DEFAULT ((0)) FOR [amount]
GO
ALTER TABLE [dbo].[Payment] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[Payment] ADD  DEFAULT ('VND') FOR [currency]
GO
ALTER TABLE [dbo].[Payment] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Payment] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Program] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Program] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Program] ADD  DEFAULT ('DRAFT') FOR [status]
GO
ALTER TABLE [dbo].[Program] ADD  DEFAULT ((0)) FOR [isTemplate]
GO
ALTER TABLE [dbo].[ProgramExercise] ADD  DEFAULT ((3)) FOR [sets]
GO
ALTER TABLE [dbo].[ProgramExercise] ADD  DEFAULT ((0)) FOR [orderIndex]
GO
ALTER TABLE [dbo].[ProgramExercise] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[ProgramExercise] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT ('PERCENTAGE') FOR [discountType]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT ((0)) FOR [discountValue]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT ((0)) FOR [minOrderValue]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT ((0)) FOR [usageLimit]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT ((0)) FOR [usageCount]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT (getdate()) FOR [startDate]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT ((1)) FOR [isActive]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT ((1)) FOR [perMemberLimit]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Promotion] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Room] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Room] ADD  DEFAULT ('GYM_AREA') FOR [type]
GO
ALTER TABLE [dbo].[Room] ADD  DEFAULT ((20)) FOR [capacity]
GO
ALTER TABLE [dbo].[Room] ADD  DEFAULT ('AVAILABLE') FOR [status]
GO
ALTER TABLE [dbo].[Room] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Room] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Trainer] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Trainer] ADD  DEFAULT ((1)) FOR [experienceYears]
GO
ALTER TABLE [dbo].[Trainer] ADD  DEFAULT ((5.0)) FOR [rating]
GO
ALTER TABLE [dbo].[Trainer] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[Trainer] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Trainer] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[TrainerMember] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[TrainerMember] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[TrainerMember] ADD  DEFAULT (getdate()) FOR [assignedAt]
GO
ALTER TABLE [dbo].[TrainerReview] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[TrainerReview] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[TrainingProgress] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[TrainingProgress] ADD  DEFAULT ('PERSONAL_TRAINING') FOR [sessionType]
GO
ALTER TABLE [dbo].[TrainingProgress] ADD  DEFAULT (getdate()) FOR [date]
GO
ALTER TABLE [dbo].[TrainingProgress] ADD  DEFAULT ((60)) FOR [durationMinutes]
GO
ALTER TABLE [dbo].[TrainingProgress] ADD  DEFAULT ((0)) FOR [caloriesBurned]
GO
ALTER TABLE [dbo].[TrainingProgress] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[TrainingProgress] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[TrainingSchedule] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[TrainingSchedule] ADD  DEFAULT ('GROUP_CLASS') FOR [sessionType]
GO
ALTER TABLE [dbo].[TrainingSchedule] ADD  DEFAULT ('SCHEDULED') FOR [status]
GO
ALTER TABLE [dbo].[TrainingSchedule] ADD  DEFAULT ((0)) FOR [maxParticipants]
GO
ALTER TABLE [dbo].[TrainingSchedule] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[TrainingSchedule] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT ('MEMBER') FOR [role]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT ('LOCAL') FOR [provider]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[User] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[BeverageImport]  WITH CHECK ADD  CONSTRAINT [FK_BeverageImport_Branch] FOREIGN KEY([branchId])
REFERENCES [dbo].[Branch] ([id])
GO
ALTER TABLE [dbo].[BeverageImport] CHECK CONSTRAINT [FK_BeverageImport_Branch]
GO
ALTER TABLE [dbo].[BeverageImport]  WITH CHECK ADD  CONSTRAINT [FK_BeverageImport_CreatedBy] FOREIGN KEY([createdById])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[BeverageImport] CHECK CONSTRAINT [FK_BeverageImport_CreatedBy]
GO
ALTER TABLE [dbo].[BeverageImport]  WITH CHECK ADD  CONSTRAINT [FK_BeverageImport_ReceivedBy] FOREIGN KEY([receivedById])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[BeverageImport] CHECK CONSTRAINT [FK_BeverageImport_ReceivedBy]
GO
ALTER TABLE [dbo].[BeverageImportItem]  WITH CHECK ADD  CONSTRAINT [FK_BeverageImportItem_Import] FOREIGN KEY([importId])
REFERENCES [dbo].[BeverageImport] ([id])
GO
ALTER TABLE [dbo].[BeverageImportItem] CHECK CONSTRAINT [FK_BeverageImportItem_Import]
GO
ALTER TABLE [dbo].[BeverageImportItem]  WITH CHECK ADD  CONSTRAINT [FK_BeverageImportItem_Product] FOREIGN KEY([productId])
REFERENCES [dbo].[BeverageProduct] ([id])
GO
ALTER TABLE [dbo].[BeverageImportItem] CHECK CONSTRAINT [FK_BeverageImportItem_Product]
GO
ALTER TABLE [dbo].[BeverageSaleItem]  WITH CHECK ADD  CONSTRAINT [FK_BeverageSaleItem_Product] FOREIGN KEY([productId])
REFERENCES [dbo].[BeverageProduct] ([id])
GO
ALTER TABLE [dbo].[BeverageSaleItem] CHECK CONSTRAINT [FK_BeverageSaleItem_Product]
GO
ALTER TABLE [dbo].[BeverageSaleItem]  WITH CHECK ADD  CONSTRAINT [FK_BeverageSaleItem_Sale] FOREIGN KEY([saleId])
REFERENCES [dbo].[BeverageSale] ([id])
GO
ALTER TABLE [dbo].[BeverageSaleItem] CHECK CONSTRAINT [FK_BeverageSaleItem_Sale]
GO
ALTER TABLE [dbo].[BeverageStockMovement]  WITH CHECK ADD  CONSTRAINT [FK_BeverageStockMovement_Branch] FOREIGN KEY([branchId])
REFERENCES [dbo].[Branch] ([id])
GO
ALTER TABLE [dbo].[BeverageStockMovement] CHECK CONSTRAINT [FK_BeverageStockMovement_Branch]
GO
ALTER TABLE [dbo].[BeverageStockMovement]  WITH CHECK ADD  CONSTRAINT [FK_BeverageStockMovement_CreatedBy] FOREIGN KEY([createdById])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[BeverageStockMovement] CHECK CONSTRAINT [FK_BeverageStockMovement_CreatedBy]
GO
ALTER TABLE [dbo].[BeverageStockMovement]  WITH CHECK ADD  CONSTRAINT [FK_BeverageStockMovement_ImportItem] FOREIGN KEY([importItemId])
REFERENCES [dbo].[BeverageImportItem] ([id])
GO
ALTER TABLE [dbo].[BeverageStockMovement] CHECK CONSTRAINT [FK_BeverageStockMovement_ImportItem]
GO
ALTER TABLE [dbo].[BeverageStockMovement]  WITH CHECK ADD  CONSTRAINT [FK_BeverageStockMovement_Product] FOREIGN KEY([productId])
REFERENCES [dbo].[BeverageProduct] ([id])
GO
ALTER TABLE [dbo].[BeverageStockMovement] CHECK CONSTRAINT [FK_BeverageStockMovement_Product]
GO
ALTER TABLE [dbo].[BeverageStockMovement]  WITH CHECK ADD  CONSTRAINT [FK_BeverageStockMovement_SaleItem] FOREIGN KEY([saleItemId])
REFERENCES [dbo].[BeverageSaleItem] ([id])
GO
ALTER TABLE [dbo].[BeverageStockMovement] CHECK CONSTRAINT [FK_BeverageStockMovement_SaleItem]
GO
ALTER TABLE [dbo].[BodyMetric]  WITH CHECK ADD  CONSTRAINT [FK_BodyMetric_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[BodyMetric] CHECK CONSTRAINT [FK_BodyMetric_Member]
GO
ALTER TABLE [dbo].[CheckIn]  WITH CHECK ADD  CONSTRAINT [FK_CheckIn_Equipment] FOREIGN KEY([equipmentId])
REFERENCES [dbo].[Equipment] ([id])
ON UPDATE CASCADE
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[CheckIn] CHECK CONSTRAINT [FK_CheckIn_Equipment]
GO
ALTER TABLE [dbo].[CheckIn]  WITH CHECK ADD  CONSTRAINT [FK_CheckIn_Partner] FOREIGN KEY([partnerId])
REFERENCES [dbo].[Partner] ([id])
GO
ALTER TABLE [dbo].[CheckIn] CHECK CONSTRAINT [FK_CheckIn_Partner]
GO
ALTER TABLE [dbo].[ClassBooking]  WITH CHECK ADD  CONSTRAINT [FK_ClassBooking_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[ClassBooking] CHECK CONSTRAINT [FK_ClassBooking_Member]
GO
ALTER TABLE [dbo].[ClassBooking]  WITH CHECK ADD  CONSTRAINT [FK_ClassBooking_TrainingSchedule] FOREIGN KEY([scheduleId])
REFERENCES [dbo].[TrainingSchedule] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ClassBooking] CHECK CONSTRAINT [FK_ClassBooking_TrainingSchedule]
GO
ALTER TABLE [dbo].[EquipmentMaintenance]  WITH CHECK ADD  CONSTRAINT [FK_EquipmentMaintenance_Equipment] FOREIGN KEY([equipmentId])
REFERENCES [dbo].[Equipment] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[EquipmentMaintenance] CHECK CONSTRAINT [FK_EquipmentMaintenance_Equipment]
GO
ALTER TABLE [dbo].[Meal]  WITH CHECK ADD  CONSTRAINT [Meal_mealPlanId_fkey] FOREIGN KEY([mealPlanId])
REFERENCES [dbo].[MealPlan] ([id])
GO
ALTER TABLE [dbo].[Meal] CHECK CONSTRAINT [Meal_mealPlanId_fkey]
GO
ALTER TABLE [dbo].[MealItem]  WITH CHECK ADD  CONSTRAINT [MealItem_foodId_fkey] FOREIGN KEY([foodId])
REFERENCES [dbo].[Food] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[MealItem] CHECK CONSTRAINT [MealItem_foodId_fkey]
GO
ALTER TABLE [dbo].[MealItem]  WITH CHECK ADD  CONSTRAINT [MealItem_mealId_fkey] FOREIGN KEY([mealId])
REFERENCES [dbo].[Meal] ([id])
GO
ALTER TABLE [dbo].[MealItem] CHECK CONSTRAINT [MealItem_mealId_fkey]
GO
ALTER TABLE [dbo].[Member]  WITH CHECK ADD  CONSTRAINT [FK_Member_referredBy] FOREIGN KEY([referredById])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[Member] CHECK CONSTRAINT [FK_Member_referredBy]
GO
ALTER TABLE [dbo].[MembershipChangeRequest]  WITH CHECK ADD  CONSTRAINT [FK_MembershipChangeRequest_ApprovedBy] FOREIGN KEY([approvedById])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[MembershipChangeRequest] CHECK CONSTRAINT [FK_MembershipChangeRequest_ApprovedBy]
GO
ALTER TABLE [dbo].[MembershipChangeRequest]  WITH CHECK ADD  CONSTRAINT [FK_MembershipChangeRequest_CompletedBy] FOREIGN KEY([completedById])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[MembershipChangeRequest] CHECK CONSTRAINT [FK_MembershipChangeRequest_CompletedBy]
GO
ALTER TABLE [dbo].[MembershipChangeRequest]  WITH CHECK ADD  CONSTRAINT [FK_MembershipChangeRequest_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[MembershipChangeRequest] CHECK CONSTRAINT [FK_MembershipChangeRequest_Member]
GO
ALTER TABLE [dbo].[MembershipChangeRequest]  WITH CHECK ADD  CONSTRAINT [FK_MembershipChangeRequest_Membership] FOREIGN KEY([membershipId])
REFERENCES [dbo].[Membership] ([id])
GO
ALTER TABLE [dbo].[MembershipChangeRequest] CHECK CONSTRAINT [FK_MembershipChangeRequest_Membership]
GO
ALTER TABLE [dbo].[MembershipChangeRequest]  WITH CHECK ADD  CONSTRAINT [FK_MembershipChangeRequest_ReviewedBy] FOREIGN KEY([reviewedById])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[MembershipChangeRequest] CHECK CONSTRAINT [FK_MembershipChangeRequest_ReviewedBy]
GO
ALTER TABLE [dbo].[Message]  WITH CHECK ADD  CONSTRAINT [Message_mealPlanId_fkey] FOREIGN KEY([mealPlanId])
REFERENCES [dbo].[MealPlan] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Message] CHECK CONSTRAINT [Message_mealPlanId_fkey]
GO
ALTER TABLE [dbo].[Partner]  WITH CHECK ADD  CONSTRAINT [FK_Partner_User] FOREIGN KEY([userId])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[Partner] CHECK CONSTRAINT [FK_Partner_User]
GO
ALTER TABLE [dbo].[PartnerBranch]  WITH CHECK ADD  CONSTRAINT [FK_PartnerBranch_Partner] FOREIGN KEY([partnerId])
REFERENCES [dbo].[Partner] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PartnerBranch] CHECK CONSTRAINT [FK_PartnerBranch_Partner]
GO
ALTER TABLE [dbo].[TrainerReview]  WITH CHECK ADD  CONSTRAINT [FK_TrainerReview_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[TrainerReview] CHECK CONSTRAINT [FK_TrainerReview_Member]
GO
ALTER TABLE [dbo].[TrainerReview]  WITH CHECK ADD  CONSTRAINT [FK_TrainerReview_Trainer] FOREIGN KEY([trainerId])
REFERENCES [dbo].[Trainer] ([id])
GO
ALTER TABLE [dbo].[TrainerReview] CHECK CONSTRAINT [FK_TrainerReview_Trainer]
GO
ALTER TABLE [dbo].[TrainingSchedule]  WITH CHECK ADD  CONSTRAINT [FK_TrainingSchedule_Membership] FOREIGN KEY([membershipId])
REFERENCES [dbo].[Membership] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[TrainingSchedule] CHECK CONSTRAINT [FK_TrainingSchedule_Membership]
GO
ALTER TABLE [dbo].[BeverageImport]  WITH CHECK ADD  CONSTRAINT [CK_BeverageImport_status] CHECK  (([status]=N'CANCELLED' OR [status]=N'RECEIVED' OR [status]=N'DRAFT'))
GO
ALTER TABLE [dbo].[BeverageImport] CHECK CONSTRAINT [CK_BeverageImport_status]
GO
ALTER TABLE [dbo].[BeverageImport]  WITH CHECK ADD  CONSTRAINT [CK_BeverageImport_subtotal] CHECK  (([subtotal]>=(0)))
GO
ALTER TABLE [dbo].[BeverageImport] CHECK CONSTRAINT [CK_BeverageImport_subtotal]
GO
ALTER TABLE [dbo].[BeverageImportItem]  WITH CHECK ADD  CONSTRAINT [CK_BeverageImportItem_quantity] CHECK  (([quantity]>(0)))
GO
ALTER TABLE [dbo].[BeverageImportItem] CHECK CONSTRAINT [CK_BeverageImportItem_quantity]
GO
ALTER TABLE [dbo].[BeverageImportItem]  WITH CHECK ADD  CONSTRAINT [CK_BeverageImportItem_unitCost] CHECK  (([unitCost]>=(0)))
GO
ALTER TABLE [dbo].[BeverageImportItem] CHECK CONSTRAINT [CK_BeverageImportItem_unitCost]
GO
ALTER TABLE [dbo].[BeverageProduct]  WITH CHECK ADD  CONSTRAINT [CK_BeverageProduct_minStock] CHECK  (([minStock]>=(0)))
GO
ALTER TABLE [dbo].[BeverageProduct] CHECK CONSTRAINT [CK_BeverageProduct_minStock]
GO
ALTER TABLE [dbo].[BeverageProduct]  WITH CHECK ADD  CONSTRAINT [CK_BeverageProduct_prices] CHECK  (([costPrice]>=(0) AND [sellingPrice]>=(0)))
GO
ALTER TABLE [dbo].[BeverageProduct] CHECK CONSTRAINT [CK_BeverageProduct_prices]
GO
ALTER TABLE [dbo].[BeverageProduct]  WITH CHECK ADD  CONSTRAINT [CK_BeverageProduct_status] CHECK  (([status]=N'INACTIVE' OR [status]=N'ACTIVE'))
GO
ALTER TABLE [dbo].[BeverageProduct] CHECK CONSTRAINT [CK_BeverageProduct_status]
GO
ALTER TABLE [dbo].[BeverageProduct]  WITH CHECK ADD  CONSTRAINT [CK_BeverageProduct_volume] CHECK  (([volumeMl] IS NULL OR [volumeMl]>(0)))
GO
ALTER TABLE [dbo].[BeverageProduct] CHECK CONSTRAINT [CK_BeverageProduct_volume]
GO
ALTER TABLE [dbo].[BeverageSale]  WITH CHECK ADD  CONSTRAINT [CK_BeverageSale_amounts] CHECK  (([subtotal]>=(0) AND [discountAmount]>=(0) AND [totalAmount]>=(0) AND [discountAmount]<=[subtotal]))
GO
ALTER TABLE [dbo].[BeverageSale] CHECK CONSTRAINT [CK_BeverageSale_amounts]
GO
ALTER TABLE [dbo].[BeverageSale]  WITH CHECK ADD  CONSTRAINT [CK_BeverageSale_status] CHECK  (([status]=N'REFUNDED' OR [status]=N'CANCELLED' OR [status]=N'PAID' OR [status]=N'DRAFT'))
GO
ALTER TABLE [dbo].[BeverageSale] CHECK CONSTRAINT [CK_BeverageSale_status]
GO
ALTER TABLE [dbo].[BeverageSaleItem]  WITH CHECK ADD  CONSTRAINT [CK_BeverageSaleItem_prices] CHECK  (([unitPrice]>=(0) AND [unitCost]>=(0)))
GO
ALTER TABLE [dbo].[BeverageSaleItem] CHECK CONSTRAINT [CK_BeverageSaleItem_prices]
GO
ALTER TABLE [dbo].[BeverageSaleItem]  WITH CHECK ADD  CONSTRAINT [CK_BeverageSaleItem_quantity] CHECK  (([quantity]>(0)))
GO
ALTER TABLE [dbo].[BeverageSaleItem] CHECK CONSTRAINT [CK_BeverageSaleItem_quantity]
GO
ALTER TABLE [dbo].[BeverageStockMovement]  WITH CHECK ADD  CONSTRAINT [CK_BeverageStockMovement_quantity] CHECK  (([quantityChange]<>(0)))
GO
ALTER TABLE [dbo].[BeverageStockMovement] CHECK CONSTRAINT [CK_BeverageStockMovement_quantity]
GO
ALTER TABLE [dbo].[BeverageStockMovement]  WITH CHECK ADD  CONSTRAINT [CK_BeverageStockMovement_type] CHECK  (([movementType]=N'IMPORT_RETURN' OR [movementType]=N'SALE_RETURN' OR [movementType]=N'ADJUSTMENT' OR [movementType]=N'SALE' OR [movementType]=N'IMPORT'))
GO
ALTER TABLE [dbo].[BeverageStockMovement] CHECK CONSTRAINT [CK_BeverageStockMovement_type]
GO
/****** Object:  StoredProcedure [dbo].[usp_CompleteBeverageSale]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* 13. Hoan tat ban hang: kiem tra ton kho va tru kho trong cung transaction */
CREATE   PROCEDURE [dbo].[usp_CompleteBeverageSale]
    @SaleId uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @BranchId nvarchar(100);
        DECLARE @Status nvarchar(20);

        SELECT @BranchId = branchId, @Status = status
        FROM dbo.BeverageSale WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @SaleId;

        IF @BranchId IS NULL
            THROW 51011, N'Khong tim thay phieu ban nuoc.', 1;
        IF @Status <> N'DRAFT'
            THROW 51012, N'Phieu ban khong o trang thai DRAFT hoac da duoc thanh toan.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.BeverageSaleItem WHERE saleId = @SaleId)
            THROW 51013, N'Phieu ban chua co san pham nao.', 1;

        DECLARE @Required TABLE
        (
            productId uniqueidentifier PRIMARY KEY,
            requiredQuantity decimal(18,3) NOT NULL
        );

        INSERT INTO @Required(productId, requiredQuantity)
        SELECT productId, SUM(quantity)
        FROM dbo.BeverageSaleItem
        WHERE saleId = @SaleId
        GROUP BY productId;

        IF EXISTS
        (
            SELECT 1
            FROM @Required AS r
            OUTER APPLY
            (
                SELECT SUM(sm.quantityChange) AS availableQuantity
                FROM dbo.BeverageStockMovement AS sm WITH (UPDLOCK, HOLDLOCK)
                WHERE sm.branchId = @BranchId
                  AND sm.productId = r.productId
            ) AS stock
            WHERE COALESCE(stock.availableQuantity, 0) < r.requiredQuantity
        )
            THROW 51014, N'Ton kho khong du de hoan tat phieu ban.', 1;

        INSERT INTO dbo.BeverageStockMovement
            (branchId, productId, saleItemId, movementType, quantityChange, createdById, notes)
        SELECT
            @BranchId, si.productId, si.id, N'SALE', -si.quantity, s.staffId,
            N'Xuat kho tu phieu ban ' + s.code
        FROM dbo.BeverageSaleItem AS si
        INNER JOIN dbo.BeverageSale AS s ON s.id = si.saleId
        WHERE si.saleId = @SaleId;

        UPDATE dbo.BeverageSale
        SET subtotal = COALESCE((SELECT SUM(lineTotal) FROM dbo.BeverageSaleItem WHERE saleId = @SaleId), 0),
            totalAmount = COALESCE((SELECT SUM(lineTotal) FROM dbo.BeverageSaleItem WHERE saleId = @SaleId), 0) - discountAmount,
            status = N'PAID',
            paidAt = SYSDATETIME(),
            updatedAt = SYSDATETIME()
        WHERE id = @SaleId;

        COMMIT TRANSACTION;
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
        THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_ReceiveBeverageImport]    Script Date: 11/25/2026 12:14:13 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* 12. Nhan phieu nhap: tao phat sinh ton kho mot lan duy nhat */
CREATE   PROCEDURE [dbo].[usp_ReceiveBeverageImport]
    @ImportId uniqueidentifier,
    @ReceivedById uniqueidentifier = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @BranchId nvarchar(100);
        DECLARE @Status nvarchar(20);

        SELECT @BranchId = branchId, @Status = status
        FROM dbo.BeverageImport WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @ImportId;

        IF @BranchId IS NULL
            THROW 51001, N'Khong tim thay phieu nhap.', 1;
        IF @Status <> N'DRAFT'
            THROW 51002, N'Phieu nhap khong o trang thai DRAFT hoac da duoc nhan.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.BeverageImportItem WHERE importId = @ImportId)
            THROW 51003, N'Phieu nhap chua co san pham nao.', 1;

        INSERT INTO dbo.BeverageStockMovement
            (branchId, productId, importItemId, movementType, quantityChange, createdById, notes)
        SELECT
            @BranchId, ii.productId, ii.id, N'IMPORT', ii.quantity, @ReceivedById,
            N'Nhap kho tu phieu ' + i.code
        FROM dbo.BeverageImportItem AS ii
        INNER JOIN dbo.BeverageImport AS i ON i.id = ii.importId
        WHERE ii.importId = @ImportId;

        UPDATE dbo.BeverageImport
        SET status = N'RECEIVED',
            receivedById = @ReceivedById,
            receivedAt = SYSDATETIME(),
            subtotal = COALESCE((SELECT SUM(lineTotal) FROM dbo.BeverageImportItem WHERE importId = @ImportId), 0),
            updatedAt = SYSDATETIME()
        WHERE id = @ImportId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
ALTER TABLE [dbo].[MembershipPackage] ADD  CONSTRAINT [DF_MembershipPackage_dailyVisitLimit]  DEFAULT ((1)) FOR [dailyVisitLimit]
GO
GO
