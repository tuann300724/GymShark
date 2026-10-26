USE [gym_db]
GO
/****** Object:  Table [dbo].[AuditLog]    Script Date: 10/26/2026 7:44:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AuditLog](
	[id] [uniqueidentifier] NOT NULL,
	[userId] [uniqueidentifier] NULL,
	[action] [nvarchar](50) NOT NULL,
	[entity] [nvarchar](50) NULL,
	[entityId] [nvarchar](200) NULL,
	[metadata] [nvarchar](max) NULL,
	[createdAt] [datetime2](7) NULL,
	[ip] [nvarchar](400) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Branch]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Branch](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[address] [nvarchar](500) NULL,
	[phone] [nvarchar](50) NULL,
	[status] [nvarchar](20) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CheckIn]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CheckIn](
	[id] [uniqueidentifier] NOT NULL,
	[memberId] [uniqueidentifier] NOT NULL,
	[method] [nvarchar](20) NULL,
	[checkInTime] [datetime2](7) NULL,
	[checkOutTime] [datetime2](7) NULL,
	[status] [nvarchar](20) NULL,
	[note] [nvarchar](1000) NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CheckInMethod]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CheckInMethod](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CheckInStatus]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CheckInStatus](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Conversation]    Script Date: 10/26/2026 7:44:25 AM ******/
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
	[lastSenderRole] [nvarchar](400) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DiscountType]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DiscountType](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EmailVerification]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[FaceEmbedding]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[Food]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[Gender]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Gender](
	[value] [nvarchar](10) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Invoice]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[InvoiceStatusTbl]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InvoiceStatusTbl](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Meal]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[MealItem]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[MealPlan]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[Member]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Member](
	[id] [uniqueidentifier] NOT NULL,
	[code] [nvarchar](20) NOT NULL,
	[userId] [uniqueidentifier] NULL,
	[branchId] [uniqueidentifier] NULL,
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
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Membership]    Script Date: 10/26/2026 7:44:25 AM ******/
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
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MembershipPackage]    Script Date: 10/26/2026 7:44:25 AM ******/
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
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MembershipStatusTbl]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MembershipStatusTbl](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MemberStatusTbl]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MemberStatusTbl](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Message]    Script Date: 10/26/2026 7:44:25 AM ******/
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
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MessageAttachment]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[Notification]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[PackageType]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PackageType](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PasswordReset]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[Payment]    Script Date: 10/26/2026 7:44:25 AM ******/
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
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PaymentMethodTbl]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PaymentMethodTbl](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PaymentStatusTbl]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PaymentStatusTbl](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Promotion]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[Room]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[RoomStatus]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RoomStatus](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RoomType]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RoomType](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ScheduleStatus]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ScheduleStatus](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SessionType]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SessionType](
	[value] [nvarchar](30) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Trainer]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[TrainerMember]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[TrainerMemberStatus]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrainerMemberStatus](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TrainerStatus]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrainerStatus](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TrainingProgress]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[TrainingSchedule]    Script Date: 10/26/2026 7:44:25 AM ******/
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
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[User]    Script Date: 10/26/2026 7:44:25 AM ******/
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
/****** Object:  Table [dbo].[UserRole]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserRole](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserStatus]    Script Date: 10/26/2026 7:44:25 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserStatus](
	[value] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'7fa7fbc2-6a88-4416-ad4d-06337439e8c8', N'7f8393a2-563f-455e-b0b3-e731305ee873', N'CHAT_MESSAGE_SEND', N'Conversation', N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'{"messageId":"9db38341-e855-4756-83f2-13c304c5de75","type":"TEXT"}', CAST(N'2026-10-25T04:57:33.7940000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'1a5b6b98-e3a8-431c-9788-065189aeceae', N'7f8393a2-563f-455e-b0b3-e731305ee873', N'CHAT_MESSAGE_SEND', N'Conversation', N'66dd54d8-1440-4493-adbd-74e640e4cf44', N'{"messageId":"37430c96-7c13-4419-843a-b8314f225b39","type":"TEXT"}', CAST(N'2026-10-25T04:57:16.0570000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'4b81c7fa-7ea5-4206-b8e2-07cf18b5fcb3', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'CHECK_OUT', N'CheckIn', N'd80c54ff-ffa6-411d-bf1e-7e788036f222', N'{"method":"FACE_ID","memberCode":"MEM-0004","via":"staff-face-checkout"}', CAST(N'2026-10-25T04:55:17.7330000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'b9a51351-12fb-4121-86b7-0c854af38e72', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'MEMBERSHIP_STATUS_CHANGE', N'Membership', N'0206e18f-41bc-4a83-bd93-3b202b3a3ddc', N'{"from":"PENDING","to":"CANCELLED","reason":"Hủy bởi quản trị viên","memberName":"Vũ Đức Thành"}', CAST(N'2026-10-25T04:39:06.6890000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'79d89098-dccb-4fc4-83ce-17af98f1bd19', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'CHECK_OUT', N'CheckIn', N'1b199a45-ed93-4e5b-9378-c037b866c39e', N'{"memberCode":"MEM-0002","via":"staff"}', CAST(N'2026-10-25T04:41:30.8460000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'db4f42c5-a8d5-4995-947a-1870cabc6cf2', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'PAYMENT_CONFIRM', N'Payment', N'71218274-dd92-44e5-ae1e-8d8d913e2cee', N'{"code":"INV-2026-0002","amount":"2000","method":"BANK_TRANSFER","memberName":"nguyen anh tuan","transactionRef":"16238005","source":"MANUAL"}', CAST(N'2026-10-25T04:43:00.8050000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'9c696a92-756e-4e66-940d-23fcb3e64f5a', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'CHECK_IN', N'CheckIn', N'd80c54ff-ffa6-411d-bf1e-7e788036f222', N'{"method":"FACE_ID","memberCode":"MEM-0004","via":"staff"}', CAST(N'2026-10-25T04:55:07.4160000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'64f05a2b-82e1-4bbe-b5c7-2d2f86fb7f0b', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'MEMBERSHIP_REGISTER', N'Membership', N'b97e8e98-fef8-44e8-b6d6-6ae850a782d4', N'{"packageName":"1 ngày","amount":"2000","paymentCode":"INV-2026-0002","promotionCode":null,"memberCode":"MEM-0004","via":"staff"}', CAST(N'2026-10-25T04:42:18.6810000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'f94d9d2c-88de-4e5f-bda7-332aca7b26e2', N'4a157c66-3a59-4baf-839e-12603dbe2da5', N'CHAT_MESSAGE_SEND', N'Conversation', N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'{"messageId":"18291e4e-b568-483b-8253-37e87794d105","type":"TEXT"}', CAST(N'2026-10-25T04:57:27.6900000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'1db7618c-06b8-4d44-bfaf-3b0a800b4d86', N'4a157c66-3a59-4baf-839e-12603dbe2da5', N'AUTH_LOGIN', N'Auth', N'4a157c66-3a59-4baf-839e-12603dbe2da5', N'{"email":"test1@gym.local","role":"MEMBER"}', CAST(N'2026-10-25T04:56:13.5960000' AS DateTime2), N'::1')
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'b7e47e99-792b-4c99-a46e-4221bb5a3bf9', N'4a157c66-3a59-4baf-839e-12603dbe2da5', N'CHAT_MESSAGE_SEND', N'Conversation', N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'{"messageId":"6b6fd199-90a5-4093-90ce-83201accd1c4","type":"TEXT"}', CAST(N'2026-10-25T04:59:47.8350000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'e49e8205-cae1-423b-8bcb-46182bca51a4', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'CHECK_OUT', N'CheckIn', N'70df012e-e710-4bd2-90c6-42639f4a6ee0', N'{"memberCode":"MEM-0001","via":"staff"}', CAST(N'2026-10-25T04:41:29.7070000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'dd37dadb-e0a1-4c9d-bc6a-47f9502b12e2', N'7f8393a2-563f-455e-b0b3-e731305ee873', N'MEALPLAN_SEND', N'MealPlan', N'd90fd6eb-6707-4a65-9a1b-6c33f8b9f0e7', N'{"memberId":"470189f4-5c98-407f-8a4b-2c39d40285fa","messageId":"d387cd6c-48ea-412b-9f9f-5adbb247c8d8"}', CAST(N'2026-10-25T04:59:36.5270000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'1fd4825b-88eb-4357-8f51-5f1e91c8fe12', N'7f8393a2-563f-455e-b0b3-e731305ee873', N'AUTH_LOGIN', N'Auth', N'7f8393a2-563f-455e-b0b3-e731305ee873', N'{"email":"trainer@gym.local","role":"TRAINER"}', CAST(N'2026-10-25T04:56:45.8210000' AS DateTime2), N'::1')
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'f55149da-a0a2-4275-8bd3-60a2993f8cce', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'AUTH_LOGIN', N'Auth', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'{"email":"admin@gymshark.com","role":"ADMIN"}', CAST(N'2026-10-25T04:37:44.2450000' AS DateTime2), N'::1')
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'76f464f1-5689-4e19-a325-7241156dfe24', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'MEMBERSHIP_REGISTER', N'Membership', N'0206e18f-41bc-4a83-bd93-3b202b3a3ddc', N'{"packageName":"Gói 30 ngày","amount":"299000","paymentCode":"INV-2026-0001","promotionCode":null,"memberCode":"MEM-0003","via":"staff"}', CAST(N'2026-10-25T04:38:52.4260000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'fc14f488-1bbe-4e57-a70b-8582d4eb021a', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'MEMBER_CREATE', N'Member', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'{"memberCode":"MEM-0004","fullName":"nguyen anh tuan","email":"tuann302@gmail.com","phone":"0799951104","via":"admin","tempPassword":true}', CAST(N'2026-10-25T04:42:11.1540000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'8d5ec437-f497-4dd1-9708-98238cf39840', N'7f8393a2-563f-455e-b0b3-e731305ee873', N'MEALPLAN_CREATE', N'MealPlan', N'd90fd6eb-6707-4a65-9a1b-6c33f8b9f0e7', N'{"title":"giảm cân","memberId":"470189f4-5c98-407f-8a4b-2c39d40285fa","isTemplate":false}', CAST(N'2026-10-25T04:59:36.4780000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'55e53f7f-551a-4165-b537-98f453539eb3', N'4a157c66-3a59-4baf-839e-12603dbe2da5', N'MEMBERSHIP_RENEW', N'Membership', N'48703b66-d108-4716-af57-2d3c17fadf61', N'{"packageName":"1 ngày","amount":"2000","paymentCode":"INV-2026-0003","promotionCode":null}', CAST(N'2026-10-25T05:00:00.5470000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'd091f42a-9164-417c-8e57-9ae56d14ed71', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'CHECK_OUT', N'CheckIn', N'cd4ce48d-9d57-4b09-90c6-d13efd8a105f', N'{"method":"FACE_ID","memberCode":"MEM-0004","via":"staff-face-checkout"}', CAST(N'2026-10-25T04:55:28.4550000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'1819e002-f67e-45e9-8eb9-a292b1a4fb1e', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'CHECK_IN', N'CheckIn', N'cd4ce48d-9d57-4b09-90c6-d13efd8a105f', N'{"method":"FACE_ID","memberCode":"MEM-0004","via":"staff"}', CAST(N'2026-10-25T04:55:22.0620000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'd7a2feb4-6c8d-4037-8dff-bc33045334ba', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'FACE_ENROLL', N'Face', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'{"memberCode":"MEM-0004","sampleCount":5,"dimensions":1024,"hasImage":true,"via":"staff"}', CAST(N'2026-10-25T04:43:13.6800000' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'ca731589-b4d3-4c12-837e-de9a9060c625', N'64bdaca9-17b2-4295-a4ed-a8a544eeaed8', N'MEMBER_CREATE', N'Member', NULL, NULL, CAST(N'2026-10-25T10:18:27.2266667' AS DateTime2), NULL)
INSERT [dbo].[AuditLog] ([id], [userId], [action], [entity], [entityId], [metadata], [createdAt], [ip]) VALUES (N'61a5c5e4-45bf-436b-88c2-f7531df8a01b', N'64bdaca9-17b2-4295-a4ed-a8a544eeaed8', N'CHECK_IN', N'CheckIn', NULL, NULL, CAST(N'2026-10-25T10:18:27.2266667' AS DateTime2), NULL)
GO
INSERT [dbo].[Branch] ([id], [name], [address], [phone], [status], [createdAt], [updatedAt]) VALUES (N'1f155ae2-40e6-450d-9086-177763fb846e', N'Chi nhánh Quận 2', N'TP. Hồ Chí Minh', NULL, N'ACTIVE', CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2))
INSERT [dbo].[Branch] ([id], [name], [address], [phone], [status], [createdAt], [updatedAt]) VALUES (N'e5c91863-5330-409c-bfb6-68a7f45b5bba', N'Chi nhánh Quận 1', N'TP. Hồ Chí Minh', NULL, N'ACTIVE', CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2))
GO
INSERT [dbo].[CheckIn] ([id], [memberId], [method], [checkInTime], [checkOutTime], [status], [note], [createdAt], [updatedAt], [notes]) VALUES (N'70df012e-e710-4bd2-90c6-42639f4a6ee0', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'FACE_ID', CAST(N'2026-10-25T08:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T04:41:29.6870000' AS DateTime2), N'CHECKED_OUT', NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T04:41:29.6880000' AS DateTime2), NULL)
INSERT [dbo].[CheckIn] ([id], [memberId], [method], [checkInTime], [checkOutTime], [status], [note], [createdAt], [updatedAt], [notes]) VALUES (N'd80c54ff-ffa6-411d-bf1e-7e788036f222', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'FACE_ID', CAST(N'2026-10-25T04:55:07.4020000' AS DateTime2), CAST(N'2026-10-25T04:55:17.7270000' AS DateTime2), N'CHECKED_OUT', NULL, CAST(N'2026-10-25T04:55:07.4040000' AS DateTime2), CAST(N'2026-10-25T04:55:17.7280000' AS DateTime2), N'Quét khuôn mặt — độ khớp 86.4%')
INSERT [dbo].[CheckIn] ([id], [memberId], [method], [checkInTime], [checkOutTime], [status], [note], [createdAt], [updatedAt], [notes]) VALUES (N'1b199a45-ed93-4e5b-9378-c037b866c39e', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'MANUAL', CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T04:41:30.8400000' AS DateTime2), N'CHECKED_OUT', NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T04:41:30.8400000' AS DateTime2), NULL)
INSERT [dbo].[CheckIn] ([id], [memberId], [method], [checkInTime], [checkOutTime], [status], [note], [createdAt], [updatedAt], [notes]) VALUES (N'cd4ce48d-9d57-4b09-90c6-d13efd8a105f', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'FACE_ID', CAST(N'2026-10-25T04:55:22.0550000' AS DateTime2), CAST(N'2026-10-25T04:55:28.4500000' AS DateTime2), N'CHECKED_OUT', NULL, CAST(N'2026-10-25T04:55:22.0570000' AS DateTime2), CAST(N'2026-10-25T04:55:28.4510000' AS DateTime2), N'Quét khuôn mặt — độ khớp 75.9%')
GO
INSERT [dbo].[CheckInMethod] ([value]) VALUES (N'FACE_ID')
INSERT [dbo].[CheckInMethod] ([value]) VALUES (N'MANUAL')
INSERT [dbo].[CheckInMethod] ([value]) VALUES (N'QR_CODE')
INSERT [dbo].[CheckInMethod] ([value]) VALUES (N'STAFF')
GO
INSERT [dbo].[CheckInStatus] ([value]) VALUES (N'CHECKED_IN')
INSERT [dbo].[CheckInStatus] ([value]) VALUES (N'CHECKED_OUT')
GO
INSERT [dbo].[Conversation] ([id], [memberId], [trainerId], [status], [createdAt], [updatedAt], [lastMessageAt], [lastMessagePreview], [lastSenderRole]) VALUES (N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'ACTIVE', CAST(N'2026-10-25T04:56:15.4690000' AS DateTime2), CAST(N'2026-10-25T04:59:47.8270000' AS DateTime2), CAST(N'2026-10-25T04:59:47.8240000' AS DateTime2), N'oke shop', NULL)
INSERT [dbo].[Conversation] ([id], [memberId], [trainerId], [status], [createdAt], [updatedAt], [lastMessageAt], [lastMessagePreview], [lastSenderRole]) VALUES (N'66dd54d8-1440-4493-adbd-74e640e4cf44', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'ACTIVE', CAST(N'2026-10-25T04:56:47.1110000' AS DateTime2), CAST(N'2026-10-25T04:57:16.0530000' AS DateTime2), CAST(N'2026-10-25T04:57:16.0410000' AS DateTime2), N'alo e', NULL)
GO
INSERT [dbo].[DiscountType] ([value]) VALUES (N'FIXED_AMOUNT')
INSERT [dbo].[DiscountType] ([value]) VALUES (N'PERCENTAGE')
GO
INSERT [dbo].[FaceEmbedding] ([id], [memberId], [embedding], [imageData], [consentAt], [createdAt], [updatedAt]) VALUES (N'48ebbcaa-b56f-4f01-b983-12e2cbb2980e', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'[0,0.241,0.05762,0.1243,0.06785,0,0,0,0.25696,0.45288,0,0,0.00537,0,0,0,0.01005,0.00588,0,0,0,0.03434,0,0.35716,0,0,0.63816,0.47109,0.04798,0.68997,0.0131,0.70989,0.20685,0,0.96368,0.97081,0.10565,0,0,0.05468,0.6683,0,0,0.17894,0.26071,0.05893,0,0.04817,0,0.32746,0.03709,0.00213,0.13006,0.32932,0.02288,1.68824,0,0.29435,0,0,0.14795,0,0.2834,0,0,0.19637,0.02323,0.554,0.90423,0,0.0986,0,0.11569,0.02215,0,0.87549,0,0.00587,0,0.01982,0,0.02484,1.07859,0.44864,0.0127,0,0,0.01095,0.82767,1.09183,0,0.79838,0.17553,0.0593,0.24706,0.0354,0.00651,0,0,0.14671,0,0,0,0,0.00527,0.21102,0,0,0.01904,0.0282,0.57289,0,0.08381,0.01076,0.62807,0,0,0,0.00445,0.4899,0,0.30662,0,0.93652,0.20963,0.00426,0.00106,0.08516,0.86338,0.07474,0.00029,0.25063,0,0,0,0.52573,0,0.4869,0,0.02879,0,0,0.01122,1.06778,0.0247,0.13901,0,0.01093,0,0,0,0.0284,0,0,0.51446,0,0,0,0.07305,0.12972,0,0.52219,0.30118,0.09137,0.03449,0.02614,0,0.00424,0.00769,0,0.72498,0.31792,0.01995,0.1723,0.26568,0.04271,0,0,0.05846,0.90867,0.32815,0,0.08005,0.19023,0,0.10998,0.02319,0.42235,0.17532,0,0,0,0.01645,0.02938,0,0,0,0,0.06261,0,0.17225,0,0.0131,0.8061,0.33396,0,0.02603,0.21395,0.00524,0.00852,0,0.359,0.01972,0.02717,0.65119,0,0.20327,0,0.021,0,0.06161,0.68581,0.07669,0.87255,0.22375,0,0.41588,0,0,0.73357,0.266,0.00737,0.04547,0.65146,0.22027,0,0,0,0.0212,0,0.17142,0,0,0,0.32386,0.00426,0,0.2546,0,0.24792,0,0.35731,0,0.12985,0.22115,0,0.02166,0,0.00929,0.07993,0.00561,0.0138,0.02342,0.60237,0.39168,0,0.50324,0.23085,0.36272,0.27849,0.09779,0.18089,0.03539,0,0.197,0,0.24606,0.44817,0.08915,0.67763,0,0.04598,0.51412,0,0,0.14575,0.54843,0,0,0.76577,0.03304,0.70253,0,0,0,0.50307,0.05424,0.38878,0.06461,0,0,0.02212,0.03776,0,0.08117,1.12105,0,0.41129,0.45597,0.29372,0.05886,0.17863,0,0,0.31777,0.44087,0,0.22461,0.33133,0.20685,0,0.00771,0.04101,0,0.75866,0,0.61722,0,1.01517,0.10979,0,0,0,0,0,0.02185,0.19207,0,0.01154,0,0.4399,0,0.20829,0,0.01852,0.15445,0,0.06417,0,0.81582,0.07732,0,0.01785,0,0,0,0,0.05824,0,0.53516,0.21151,0.39802,0.15877,0.04559,0.05896,0.02607,0.95423,0.02779,0.18139,0,1.07958,0.84989,0,0.20184,0,0,0.3826,0,0.00405,0,0,0,0.01938,0.14575,0.15721,0,0,0,0.66002,0.1147,0,0.21029,0.21029,0.60365,0.47693,0.05731,0.37952,0.01581,0,0,0.06617,0.00026,0.51587,0.15094,0,0.24139,0,0.58457,0,0,0.01288,0.27366,0,0,0,0,0.08158,0.88635,0,0.14419,0.03162,0,0,0.24117,0.89149,1.3173,0,0.58001,0.01685,1.07491,0,0.27686,0.56925,0,0.33023,0.19875,0.43915,0,0.00236,0,0.0084,0.13636,0.17248,0,0.73192,0.84785,0,0.2303,0.01698,0.14923,0.94821,0.11315,0.09193,0.05288,0,0.25706,0,0.82837,0.00677,0.0132,0,0,0.00733,1.59219,0,0.0208,0,0,0,1.40089,0.0371,0.47244,0,0,0,0.00832,0,0.85226,0.27344,0.18485,0.13607,0,0.14323,0,0,0,0.05816,0.33142,0.0069,0,0,0.0286,0,0.15151,0,0.00204,0.34298,0.87513,0,0.2299,0.23761,0.11443,0.16656,1.07683,0,0.33672,0.04961,0,0,0.20157,0.44851,0,0,0.44521,0,0.01507,0.32694,0.50479,0,0.02245,0,0.77239,0.05753,0,0,0.16803,0.11029,0.17234,0,0.66897,0.05823,0.53368,0.01826,0.25197,0,0,0.06896,0,0,0,0.09679,0.05789,0.75667,0.64817,0,0,0,0,0.01873,0,0,0.11704,0.64481,0,0.0881,0.44224,0.00151,0.23837,0,0.61524,0.08416,0.05497,0,0.23357,0.02274,0.08805,0,0.57155,0,0.34605,0,0.45834,0,0.40023,0.83665,0,0.0096,0,0.21776,0.12911,0.46096,0,0.12792,1.15649,0.00363,0,0.07366,0,0.10073,0,1.01242,0,0.39753,0,0.01323,0,0,0.49905,0.11561,1.26911,0.45829,0,0.28477,0.13968,0,0.83084,0.02613,0,0.08637,0.73164,0,0.09303,0,0,0.03564,0.76553,0.00971,0.89511,0,0.42294,0.10216,0.21052,0.75162,0.03135,0,0.08021,0.03821,0.1427,0.14875,0.23344,0,0,0,0.54818,0.2042,0,0,0.13328,0.24437,0.03022,0,0,0.03239,0.04541,0,0.016,0.54765,0,0.49481,0.72586,0,0.0903,0,0,0,0,0,0.00623,0,1.19868,0.00194,0.00841,0,0.2111,0.01995,0,0.06207,0.24267,0.62481,0,0.33598,0,0.21904,0.66078,0,0,0.13775,0.59394,0.35777,0,0,0.27705,0.08727,0.12275,0,0,0.53469,0.04402,0,0,0,0.32354,0.11689,0.0279,0,0,0,0,0,0.50859,0.06821,0,0.72545,0,0,0,0,0,0.06854,0.00566,0,0.00223,0.08375,0.00715,0.02764,0,0.0084,0,0,0,0,0,0.04247,0,0,0,0.18254,0.48779,0,0.00978,0.04659,0.01979,0.21475,0,0.01415,0,0.01397,0,0,0.17455,0,0.07348,0,0,0,0.01473,0,0,0,0,0,0.05599,0,0,0,0.46291,0.04091,0.12656,0,0,0,0,0.13839,0.00644,0,0,0.42049,0,0.1277,0,0.1636,0.72456,0,0.00859,0.68044,0,0,0.00892,0.19979,0.24687,0.08298,0.02338,0.02744,0.2406,0.06028,0.03786,0.18331,0,0.87645,0.45728,0.08726,0.01166,0.37365,0.1768,0.10796,0.04049,0,0.01733,0,0,0,0.09656,0,0.23327,0,0.2368,0,0,0.06598,0.09173,0.22001,0.03081,0,0,0.0149,0.11386,0.11636,0.73129,0.24391,0,0.3321,0,0.97234,0,0.03736,0.38324,0.03552,0.35977,0,0.15801,0.09249,0.24393,0.71656,1.08521,0,0,0,0.11141,0,0,0.1974,0,0.65743,0.01132,0.01325,0,0.07399,0,0.33073,0.36497,0.4208,0.0819,0.05051,0.33342,0,0,0.85267,0.0026,0.04622,0,0,0,0.05813,0.50187,0.55427,0.00187,0.76901,0.77643,0.60963,0.01423,0.00409,0.05681,0.75197,0,0,0,0,1.51591,0.60423,0.15638,0.18703,0.46258,0.15066,0.14782,0.02979,0,1.04967,0.44461,0.11761,0.09801,0.01056,0,0,0.42165,0,0,0,0.61713,0.08517,0,0.11273,0,0.02792,0,0.4476,0,0.68472,0,0,0,0.78234,0,0,0.47971,0.0039,0.12895,0,0.05612,0,0,0.58489,0.04043,0,0.39898,0.56091,0,0,0.58954,0.13246,0.10484,0,0.1461,0,0.06925,0,0.43743,0,0,0,0.40551,0,0.04108,0,0.19268,0,0,0.64534,0,0,0,0.01099,0.09403,0.44124,0.1435,0.10783,0,0,0.1499,0,0,0.22282,0,0.01153,0.26884,0.34902,0.01651,0,0.01079,0.0732,0.09088,0,0,0.14058,0.03448,0,0,0,0.03727,0,0.01992,0.02279,0.07242,0,0,0,0.38812,0,0.6355,0.76402,0.00051,0.25471,0,0.33709,0,0,0.50701,0,0.01931,0.00552,1.1558,0.69906,0,0,0.63767,0.81489,0.02858,0.26678,0.45423,0,0.07863,0.0197,0,0.42952,0.01395,0.06738,0.00631,0.01479,0.01204,0.00938,0,0,0.25578,0.00422,0.00043]', NULL, CAST(N'2026-10-25T04:43:13.6680000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2))
INSERT [dbo].[FaceEmbedding] ([id], [memberId], [embedding], [imageData], [consentAt], [createdAt], [updatedAt]) VALUES (N'baa76d7d-b67c-4d76-978e-9604fea4bec6', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'[0,0.34911,0.15728,0.15509,0.3835,0,0,0,0.14339,0.01741,0.00069,0.0059,0.10682,0.00194,0,0,0.07252,0.00374,0.00094,0,0,0.07231,0,0.36096,0,0.00611,0.64964,0.17391,0.03521,0.94623,0,0.70091,0.23641,0,0.90117,1.00776,0.26637,0,0.00238,0.03812,1.07549,0.08826,0,0.19826,0.14311,0.20686,0.08564,0.03995,0.02985,0.31393,0.08506,0,0.02138,0.1942,0.03405,1.82885,0,0.33573,0,0,0.07296,0,0.54636,0,0.16723,0.13355,0.07721,0.77873,0.53056,0,0.00611,0,0.09279,0.06713,0,0.95428,0,0.0052,0,0,0,0.01808,1.20699,0.9239,0.02145,0,0,0,0.93635,0.95235,0,0.94513,0.1443,0.06384,0.35073,0.04136,0.03251,0.00731,0,0.13262,0,0.00354,0,0,0.08036,0.15617,0.01684,0.00738,0.00009,0.13978,0.29981,0,0.07641,0.13692,0.48962,0,0,0,0.15364,0.79686,0,0.13629,0,0.60941,0.02757,0.0957,0,0.28017,1.06869,0.03982,0,0.02597,0,0,0,0.85802,0,0.25103,0,0.19284,0,0,0.12911,1.11817,0.6593,0.21654,0,0,0,0.05881,0.09187,0,0,0,0.28409,0,0,0,0.23611,0.21271,0.02298,0.28345,0.34069,0.33686,0.00852,0.01481,0,0.05946,0.03105,0,0.66516,0.21308,0,0.08508,0.46007,0.12058,0,0.0402,0.02323,1.09346,0.25161,0,0.05652,0.1202,0.073,0,0.03639,0.63285,0.10994,0.05928,0,0,0.0064,0.31462,0,0,0.01948,0,0.12168,0,0.57355,0.00152,0.07505,0.64066,0.30649,0.01104,0.00867,0.18215,0,0.00279,0,0.42204,0.03192,0.16997,0.5592,0,0.20482,0,0.02043,0.1573,0.0622,1.3519,0.15243,0.96115,0.1193,0,0.28412,0,0.02608,0.45237,0.32271,0,0.19086,0.47337,0.20216,0,0,0,0.04285,0.04477,0.09998,0.09641,0.01766,0,0.3014,0.05602,0,0.53355,0,0.22992,0,0.65837,0,0.19174,0.26754,0,0.01181,0,0.01095,0.10451,0,0.01844,0.0175,0.59322,0.75734,0,0.85248,0.3143,0.78589,0.22164,0.00096,0.0788,0.16192,0,0.18047,0,0.22415,0.18519,0.03888,0.52947,0,0.08622,0.30774,0,0.00107,0.15127,0.50042,0,0,0.77838,0,0.76319,0,0,0,0.99675,0,0.18073,0.10396,0,0,0.12377,0.02689,0,0.06701,0.56182,0.00289,0.60572,0.33242,0.23376,0.10146,0.21781,0,0,0.38119,0.70829,0,0.52366,0.38917,0.11168,0,0.03103,0.02737,0,0.9061,0,0.62851,0,1.14346,0.10167,0,0,0,0.01681,0,0,0.43737,0.00794,0.0427,0,0.20909,0,0.11549,0,0,0.01864,0,0.07354,0,0.84203,0.0354,0,0,0.03465,0.01355,0,0.01425,0,0.13354,0.17589,0.20286,0.15525,0.35525,0,0.07725,0.02558,1.12609,0.01282,0.45388,0,1.06151,1.05535,0,0.40072,0,0,0.19038,0,0,0,0,0,0.05506,0.09158,0.17506,0,0,0.06218,0.35715,0.00496,0,0.23671,0.08803,0.68245,0.41882,0.10541,0.30873,0.02914,0.0013,0.01737,0.13736,0.09084,0.62522,0.10762,0,0.23423,0,0.99461,0,0,0,0.0996,0.00891,0,0,0,0.13187,0.8771,0,0.18259,0,0,0,0.32952,0.80316,1.22195,0,0.79628,0.04182,0.81599,0.17741,0.07259,0.64303,0,0.30338,0.26853,0.25612,0,0,0,0.00327,0.62879,0.27543,0.01707,0.65578,1.15764,0.04632,0.4068,0.1918,0.05862,0.9736,0.27923,0.0245,0.03505,0,0.03298,0.0095,0.12719,0,0,0,0,0.01278,1.43222,0,0.11077,0,0,0,1.37137,0.00509,0.27248,0.02482,0,0,0,0.06835,0.58402,0.39137,0.0293,0.25522,0,0.03434,0,0,0,0.09432,0.41207,0.07892,0,0,0.03617,0,0.23017,0,0.04839,0.62502,1.16571,0.00004,0.5586,0.18741,0.17437,0.22997,1.03501,0.22837,0.18619,0.0137,0.05019,0,0.2197,0.5388,0,0,0.32109,0,0.01679,0.54645,0.40447,0,0.11843,0,0.74169,0.14525,0,0,0.24964,0,0.47492,0.13012,0.86695,0.02936,0.77181,0,0.09239,0,0,0.00356,0,0,0,0.1503,0,0.52854,0.55736,0,0,0,0,0.03279,0,0.0086,0.23114,0.54049,0.00578,0.07572,0.56554,0.1029,0.14214,0,0.51146,0.04339,0.04797,0,0.31659,0.07764,0.01982,0,0.59633,0,0.37101,0,0.20071,0.0076,0.39093,0.89951,0,0.01167,0,0.14615,0.11825,0.40219,0,0.24131,1.22148,0,0,0.0166,0,0.13342,0,0.86677,0,0.48842,0,0.04056,0,0,0.49636,0.46735,1.45085,0.55399,0,0.44253,0.0122,0,1.47179,0.06703,0,0.52359,0.74613,0,0,0,0.0671,0.00554,0.95294,0.00192,1.02951,0.04633,0.55259,0.1726,0.00717,0.8048,0.01484,0,0.06145,0,0.36623,0.1888,0.40843,0,0,0,0.82296,0.17533,0,0,0.33904,0.72971,0,0,0,0.11416,0.16661,0,0,0.48149,0,0.51362,0.77603,0,0.0675,0,0,0.00495,0,0,0.093,0,0.95216,0.16493,0,0,0.22012,0,0,0.00607,0.04163,0.55734,0,0.55194,0,0.37936,0.59875,0,0.00221,0.0439,0.82546,0.58792,0,0,0.15223,0.02716,0.24021,0.0247,0.02535,0.26058,0.02731,0,0,0,0.22638,0.02194,0.01486,0,0,0,0,0,0.50055,0.05377,0,0.81707,0,0,0.00134,0,0,0.24252,0.08971,0,0.00239,0.00036,0.03599,0.15442,0,0.02119,0,0,0,0,0,0,0,0,0,0.27278,0.26054,0,0,0.0122,0.00762,0.14707,0,0.02002,0.01743,0,0,0,0.12956,0.14209,0.08885,0,0,0,0.03851,0,0,0,0,0,0,0,0,0,0.78063,0.03239,0.19408,0,0,0,0.00186,0.01031,0,0,0.0668,0.52012,0,0.05468,0,0.061,0.8517,0,0.19547,0.55764,0,0,0,0.40828,0.16024,0.22984,0.09687,0.01876,0.17258,0.10734,0.09399,0.14881,0,0.49379,0.3511,0.28421,0.02673,0.54325,0.03597,0.19063,0.07086,0,0.00329,0,0,0,0.08314,0,0.40449,0,0.30363,0,0,0.15892,0.07035,0.15788,0.07922,0,0,0.00881,0.13339,0.02323,0.68555,0.65553,0.00772,0.05841,0,1.22476,0,0.45447,0.68207,0.00514,0.09853,0,0.24673,0.2057,0.09958,0.50864,1.45316,0,0.05444,0,0.17517,0,0,0.13517,0,1.07083,0.22764,0.00802,0,0.09117,0,0.21008,0.27175,0.3174,0.11066,0.10609,0.58362,0.00241,0,0.41608,0,0,0,0,0,0.10462,0.47992,0.54307,0,0.7769,1.12075,0.42338,0.0467,0.04937,0.13645,1.0908,0,0,0.01434,0,1.42662,0.44999,0.14099,0.19368,0.9012,0.48112,0.1103,0.05697,0,1.04647,0.26433,0.02331,0.18722,0.00928,0,0,0.52714,0,0.06627,0,0.55469,0.17939,0,0,0,0.17051,0,0.51003,0,0.46777,0.01208,0,0,0.7394,0,0,0.18641,0,0.10427,0,0.05452,0.00242,0,0.74794,0,0,0.2719,0.50586,0,0,0.55547,0.16562,0.02199,0,0.18387,0,0,0,0.31677,0,0.0101,0.01382,0.64509,0,0.04037,0.02418,0.52294,0,0.03768,0.75669,0,0,0,0.01722,0.05611,0.32754,0.03568,0.08773,0.00267,0,0.02695,0.17795,0,0.24145,0,0,0.02631,0.28824,0.0199,0,0.01491,0.22374,0.12224,0,0,0.06752,0.17799,0,0,0,0,0,0.04525,0.05685,0.01148,0,0,0,0.2991,0,0.68342,0.42943,0,0.33116,0.01119,0.26635,0,0,0.66084,0,0.15284,0.00497,1.14595,0.54507,0,0.00805,0.59384,0.98859,0.17683,0.67559,0.33556,0,0.063,0,0,0.19943,0.03308,0.14081,0,0.01393,0.04254,0,0.0171,0,0.18483,0.21422,0.00247]', NULL, CAST(N'2026-10-25T04:43:13.6680000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2))
INSERT [dbo].[FaceEmbedding] ([id], [memberId], [embedding], [imageData], [consentAt], [createdAt], [updatedAt]) VALUES (N'5c7b96ea-81b1-4d7d-b850-9fd41bd78a79', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'[0,0.241,0.05762,0.1243,0.06785,0,0,0,0.25696,0.45288,0,0,0.00537,0,0,0,0.01005,0.00588,0,0,0,0.03434,0,0.35716,0,0,0.63816,0.47109,0.04798,0.68997,0.0131,0.70989,0.20685,0,0.96368,0.97081,0.10565,0,0,0.05468,0.6683,0,0,0.17894,0.26071,0.05893,0,0.04817,0,0.32746,0.03709,0.00213,0.13006,0.32932,0.02288,1.68824,0,0.29435,0,0,0.14795,0,0.2834,0,0,0.19637,0.02323,0.554,0.90423,0,0.0986,0,0.11569,0.02215,0,0.87549,0,0.00587,0,0.01982,0,0.02484,1.07859,0.44864,0.0127,0,0,0.01095,0.82767,1.09183,0,0.79838,0.17553,0.0593,0.24706,0.0354,0.00651,0,0,0.14671,0,0,0,0,0.00527,0.21102,0,0,0.01904,0.0282,0.57289,0,0.08381,0.01076,0.62807,0,0,0,0.00445,0.4899,0,0.30662,0,0.93652,0.20963,0.00426,0.00106,0.08516,0.86338,0.07474,0.00029,0.25063,0,0,0,0.52573,0,0.4869,0,0.02879,0,0,0.01122,1.06778,0.0247,0.13901,0,0.01093,0,0,0,0.0284,0,0,0.51446,0,0,0,0.07305,0.12972,0,0.52219,0.30118,0.09137,0.03449,0.02614,0,0.00424,0.00769,0,0.72498,0.31792,0.01995,0.1723,0.26568,0.04271,0,0,0.05846,0.90867,0.32815,0,0.08005,0.19023,0,0.10998,0.02319,0.42235,0.17532,0,0,0,0.01645,0.02938,0,0,0,0,0.06261,0,0.17225,0,0.0131,0.8061,0.33396,0,0.02603,0.21395,0.00524,0.00852,0,0.359,0.01972,0.02717,0.65119,0,0.20327,0,0.021,0,0.06161,0.68581,0.07669,0.87255,0.22375,0,0.41588,0,0,0.73357,0.266,0.00737,0.04547,0.65146,0.22027,0,0,0,0.0212,0,0.17142,0,0,0,0.32386,0.00426,0,0.2546,0,0.24792,0,0.35731,0,0.12985,0.22115,0,0.02166,0,0.00929,0.07993,0.00561,0.0138,0.02342,0.60237,0.39168,0,0.50324,0.23085,0.36272,0.27849,0.09779,0.18089,0.03539,0,0.197,0,0.24606,0.44817,0.08915,0.67763,0,0.04598,0.51412,0,0,0.14575,0.54843,0,0,0.76577,0.03304,0.70253,0,0,0,0.50307,0.05424,0.38878,0.06461,0,0,0.02212,0.03776,0,0.08117,1.12105,0,0.41129,0.45597,0.29372,0.05886,0.17863,0,0,0.31777,0.44087,0,0.22461,0.33133,0.20685,0,0.00771,0.04101,0,0.75866,0,0.61722,0,1.01517,0.10979,0,0,0,0,0,0.02185,0.19207,0,0.01154,0,0.4399,0,0.20829,0,0.01852,0.15445,0,0.06417,0,0.81582,0.07732,0,0.01785,0,0,0,0,0.05824,0,0.53516,0.21151,0.39802,0.15877,0.04559,0.05896,0.02607,0.95423,0.02779,0.18139,0,1.07958,0.84989,0,0.20184,0,0,0.3826,0,0.00405,0,0,0,0.01938,0.14575,0.15721,0,0,0,0.66002,0.1147,0,0.21029,0.21029,0.60365,0.47693,0.05731,0.37952,0.01581,0,0,0.06617,0.00026,0.51587,0.15094,0,0.24139,0,0.58457,0,0,0.01288,0.27366,0,0,0,0,0.08158,0.88635,0,0.14419,0.03162,0,0,0.24117,0.89149,1.3173,0,0.58001,0.01685,1.07491,0,0.27686,0.56925,0,0.33023,0.19875,0.43915,0,0.00236,0,0.0084,0.13636,0.17248,0,0.73192,0.84785,0,0.2303,0.01698,0.14923,0.94821,0.11315,0.09193,0.05288,0,0.25706,0,0.82837,0.00677,0.0132,0,0,0.00733,1.59219,0,0.0208,0,0,0,1.40089,0.0371,0.47244,0,0,0,0.00832,0,0.85226,0.27344,0.18485,0.13607,0,0.14323,0,0,0,0.05816,0.33142,0.0069,0,0,0.0286,0,0.15151,0,0.00204,0.34298,0.87513,0,0.2299,0.23761,0.11443,0.16656,1.07683,0,0.33672,0.04961,0,0,0.20157,0.44851,0,0,0.44521,0,0.01507,0.32694,0.50479,0,0.02245,0,0.77239,0.05753,0,0,0.16803,0.11029,0.17234,0,0.66897,0.05823,0.53368,0.01826,0.25197,0,0,0.06896,0,0,0,0.09679,0.05789,0.75667,0.64817,0,0,0,0,0.01873,0,0,0.11704,0.64481,0,0.0881,0.44224,0.00151,0.23837,0,0.61524,0.08416,0.05497,0,0.23357,0.02274,0.08805,0,0.57155,0,0.34605,0,0.45834,0,0.40023,0.83665,0,0.0096,0,0.21776,0.12911,0.46096,0,0.12792,1.15649,0.00363,0,0.07366,0,0.10073,0,1.01242,0,0.39753,0,0.01323,0,0,0.49905,0.11561,1.26911,0.45829,0,0.28477,0.13968,0,0.83084,0.02613,0,0.08637,0.73164,0,0.09303,0,0,0.03564,0.76553,0.00971,0.89511,0,0.42294,0.10216,0.21052,0.75162,0.03135,0,0.08021,0.03821,0.1427,0.14875,0.23344,0,0,0,0.54818,0.2042,0,0,0.13328,0.24437,0.03022,0,0,0.03239,0.04541,0,0.016,0.54765,0,0.49481,0.72586,0,0.0903,0,0,0,0,0,0.00623,0,1.19868,0.00194,0.00841,0,0.2111,0.01995,0,0.06207,0.24267,0.62481,0,0.33598,0,0.21904,0.66078,0,0,0.13775,0.59394,0.35777,0,0,0.27705,0.08727,0.12275,0,0,0.53469,0.04402,0,0,0,0.32354,0.11689,0.0279,0,0,0,0,0,0.50859,0.06821,0,0.72545,0,0,0,0,0,0.06854,0.00566,0,0.00223,0.08375,0.00715,0.02764,0,0.0084,0,0,0,0,0,0.04247,0,0,0,0.18254,0.48779,0,0.00978,0.04659,0.01979,0.21475,0,0.01415,0,0.01397,0,0,0.17455,0,0.07348,0,0,0,0.01473,0,0,0,0,0,0.05599,0,0,0,0.46291,0.04091,0.12656,0,0,0,0,0.13839,0.00644,0,0,0.42049,0,0.1277,0,0.1636,0.72456,0,0.00859,0.68044,0,0,0.00892,0.19979,0.24687,0.08298,0.02338,0.02744,0.2406,0.06028,0.03786,0.18331,0,0.87645,0.45728,0.08726,0.01166,0.37365,0.1768,0.10796,0.04049,0,0.01733,0,0,0,0.09656,0,0.23327,0,0.2368,0,0,0.06598,0.09173,0.22001,0.03081,0,0,0.0149,0.11386,0.11636,0.73129,0.24391,0,0.3321,0,0.97234,0,0.03736,0.38324,0.03552,0.35977,0,0.15801,0.09249,0.24393,0.71656,1.08521,0,0,0,0.11141,0,0,0.1974,0,0.65743,0.01132,0.01325,0,0.07399,0,0.33073,0.36497,0.4208,0.0819,0.05051,0.33342,0,0,0.85267,0.0026,0.04622,0,0,0,0.05813,0.50187,0.55427,0.00187,0.76901,0.77643,0.60963,0.01423,0.00409,0.05681,0.75197,0,0,0,0,1.51591,0.60423,0.15638,0.18703,0.46258,0.15066,0.14782,0.02979,0,1.04967,0.44461,0.11761,0.09801,0.01056,0,0,0.42165,0,0,0,0.61713,0.08517,0,0.11273,0,0.02792,0,0.4476,0,0.68472,0,0,0,0.78234,0,0,0.47971,0.0039,0.12895,0,0.05612,0,0,0.58489,0.04043,0,0.39898,0.56091,0,0,0.58954,0.13246,0.10484,0,0.1461,0,0.06925,0,0.43743,0,0,0,0.40551,0,0.04108,0,0.19268,0,0,0.64534,0,0,0,0.01099,0.09403,0.44124,0.1435,0.10783,0,0,0.1499,0,0,0.22282,0,0.01153,0.26884,0.34902,0.01651,0,0.01079,0.0732,0.09088,0,0,0.14058,0.03448,0,0,0,0.03727,0,0.01992,0.02279,0.07242,0,0,0,0.38812,0,0.6355,0.76402,0.00051,0.25471,0,0.33709,0,0,0.50701,0,0.01931,0.00552,1.1558,0.69906,0,0,0.63767,0.81489,0.02858,0.26678,0.45423,0,0.07863,0.0197,0,0.42952,0.01395,0.06738,0.00631,0.01479,0.01204,0.00938,0,0,0.25578,0.00422,0.00043]', NULL, CAST(N'2026-10-25T04:43:13.6680000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2))
INSERT [dbo].[FaceEmbedding] ([id], [memberId], [embedding], [imageData], [consentAt], [createdAt], [updatedAt]) VALUES (N'f8958302-1fab-4bdd-9f3f-a6714a6f8b0d', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'[0,0.0218,0.0725,0.13403,0.14127,0,0,0,0.08246,0.27614,0.02925,0,0,0,0,0,0.00999,0.02264,0,0,0,0.20004,0,0.33637,0,0,0.88933,0.18012,0.0273,0.95245,0.04461,0.53813,0.38909,0,0.68686,0.83968,0.35668,0,0.04785,0.02167,0.61722,0.02883,0,0.38754,0.33325,0.09988,0.01588,0.09757,0.0052,0.24815,0.07509,0.00068,0.05145,0.40306,0.07444,1.69827,0,0.18321,0,0,0.0204,0,0.21456,0,0.10362,0.18385,0.03364,0.57115,1.11344,0,0,0,0.0351,0.04615,0,0.9805,0.01538,0.04214,0,0.01876,0,0.02125,0.62905,0.49329,0.09307,0,0,0.03813,0.50585,0.6778,0,0.57717,0.05878,0.33418,0.3925,0.00974,0.07791,0.0012,0,0.22908,0,0.02318,0,0,0.00579,0.50105,0.05171,0,0,0,0.20258,0,0.06591,0,0.47089,0,0,0,0.00922,0.40055,0.03238,0.12178,0,0.61362,0.04799,0,0,0.10257,0.9672,0,0.04955,0.21543,0.00273,0,0,0.41846,0,0.40082,0,0.25644,0.02056,0,0.04605,0.61812,0.02651,0.28717,0,0.16188,0,0,0,0.06151,0.02152,0,0.50524,0,0,0,0.05947,0.07493,0,0.27459,0.34127,0.24926,0.03884,0.03646,0,0.15051,0,0,0.72363,0.14383,0,0.17038,0.4605,0.02708,0.01964,0.0877,0.00878,0.91105,0.35868,0,0.13642,0.16752,0,0.00449,0.01444,0.3727,0.09045,0.06835,0,0,0.13521,0.09642,0.08718,0,0,0,0.0368,0,0.35624,0,0.02784,0.85959,0.35126,0,0.08572,0.11597,0.00741,0.00407,0,0.21819,0.00566,0.02589,0.53798,0,0.2422,0,0.06499,0,0.07821,0.76438,0.08206,0.70259,0.57738,0,0.32569,0.00141,0.04927,0.91828,0.36237,0,0.04946,0.60647,0.1035,0,0.02006,0,0.07213,0.0709,0.01804,0.05449,0,0,0.10239,0.05017,0,0.39295,0,0.24824,0.0212,0.77715,0,0.30606,0.29468,0,0.00311,0,0.01005,0.22878,0.00363,0.02403,0.03062,0.79117,0.42655,0,0.3732,0.13348,0.66133,0.14275,0.01156,0.04615,0.04569,0,0.17471,0,0.0859,0.28216,0.0503,0.799,0,0.18818,0.38216,0,0,0.14593,0.5484,0,0.03124,0.70026,0.11051,0.76217,0,0,0,0.22028,0.02576,0.30733,0.1472,0,0,0.00803,0.00183,0,0.08263,1.05767,0,0.65485,0.47346,0.33451,0.08989,0.20321,0,0,0.3736,0.27896,0,0.44925,0.34664,0.52596,0,0.0108,0.01812,0,0.47486,0,0.68337,0,1.12843,0.0295,0,0,0,0.01198,0.00485,0,0.13867,0,0,0,0.02714,0,0.04717,0,0.03071,0.148,0,0.05486,0,0.81433,0.13235,0,0.0156,0.01325,0,0.03724,0,0,0.09865,0.07802,0.3049,0.20848,0.19188,0.05988,0.01785,0.08339,0.70239,0.08563,0.22301,0,0.79904,0.67898,0.07356,0.24676,0,0,0.30568,0,0,0,0,0,0.01843,0.03875,0.00832,0,0,0.02754,0.44975,0.01152,0,0.32008,0.05815,0.91531,0.30088,0.00527,0.31629,0,0.0212,0.02483,0.06967,0.02808,0.34349,0.11893,0,0.20377,0,0.49469,0,0,0,0.0492,0,0,0,0,0.01469,0.67874,0,0.08806,0.08977,0,0,0.23829,0.57623,1.10802,0,0.60482,0.03383,0.91449,0.00513,0.25663,0.45647,0,0.59941,0.11721,0.29702,0,0.01671,0,0,0.08757,0.22788,0,0.70449,0.99018,0,0.18279,0,0.05589,1.29584,0.19026,0,0.09104,0,0.49301,0,0.58035,0.03472,0.00543,0,0,0,1.61807,0,0.00337,0,0,0,1.23868,0.02189,0.59927,0,0,0,0.03212,0,0.56674,0.26575,0.08979,0.122,0,0.16298,0,0,0.06645,0.10641,0.05378,0,0,0,0.04186,0.00547,0.11347,0,0.05533,0.42814,0.85121,0,0.10863,0.12275,0.16678,0.06438,1.32791,0,0.21789,0,0,0,0.07711,0.21228,0,0,0.20386,0,0.03006,0.07885,0.2735,0,0.0313,0,0.50347,0.10994,0,0,0.15124,0.05378,0.18788,0.04105,0.79103,0.00508,0.8043,0,0.24967,0,0,0,0,0,0,0.05341,0.01876,0.3218,0.67366,0,0,0,0,0,0,0.00778,0.09319,0.33847,0,0.04813,0.3569,0,0.1564,0,0.50589,0.00353,0.11731,0,0.11331,0,0,0,0.48592,0,0.18617,0,0.46038,0,0.30572,0.86095,0,0,0.01162,0.14434,0.30952,0.36166,0,0.04551,1.15788,0.02103,0.03646,0.18042,0,0.14517,0,0.84021,0,0.64189,0,0,0.00659,0,0.76301,0.15468,1.2204,0.42709,0.00914,0.81482,0,0,1.06829,0.00631,0,0.2466,0.67227,0,0.01278,0,0.01485,0.37894,0.25522,0,0.79444,0.0052,0.06438,0.06327,0.09383,0.88981,0.007,0,0.02644,0.05286,0.09837,0.10971,0.40815,0,0,0,0.69484,0.09531,0,0,0.20494,0.13431,0,0,0,0.15244,0.12997,0,0.02297,0.2007,0,0.68032,0.52846,0,0,0,0,0,0,0,0.0124,0,0.85806,0.07497,0.01401,0,0.17306,0,0,0.00015,0.03547,0.65793,0,0.57547,0,0.36867,0.47394,0,0.00622,0.13393,0.84643,0.40798,0,0,0.23252,0.01034,0.18782,0.00593,0,0.77294,0.0491,0,0,0,0.21217,0.15742,0.01237,0.03975,0,0,0,0,0.4843,0.28362,0,0.8187,0,0,0,0,0,0.42746,0.08485,0,0.01325,0.06945,0,0.12092,0,0,0,0,0,0,0,0.00675,0.04678,0.0518,0,0.0689,0.73581,0,0.00675,0.0385,0.03066,0.08553,0,0.03201,0.00969,0.00727,0,0,0.39824,0.07995,0.03077,0,0,0,0.04383,0,0,0,0,0,0.05061,0.00223,0,0,0.25039,0.03474,0.2418,0,0,0,0,0,0.12049,0,0,0.57919,0,0.09935,0,0.20197,0.45221,0,0,0.73729,0,0,0.00712,0.39677,0.17693,0,0.07407,0.03063,0.18653,0.07408,0.16959,0.27544,0,0.54559,0.39116,0.07924,0.03311,0.40409,0.17886,0.06677,0.04593,0,0,0,0,0.01732,0.14374,0,0.36959,0,0.02269,0,0,0.14953,0.04578,0.09936,0.0729,0,0,0.00866,0.35566,0.05644,0.64534,0.01884,0.0166,0.03528,0,0.88297,0,0.11399,0.42152,0.04362,0.16469,0.01142,0.10525,0.11433,0.25668,0.76083,0.95803,0,0.10345,0,0.08519,0,0,0.03409,0,0.95426,0.01669,0.02225,0,0.06042,0,0.28182,0.13947,0.20804,0.10666,0.08569,0.71286,0,0,0.39467,0.0625,0.00385,0,0,0,0.0851,0.62647,0.623,0.13977,0.65251,0.65677,0.3311,0.03278,0.02623,0.11598,0.72252,0,0,0,0,1.36337,0.25674,0.20562,0.07141,0.83069,0.07142,0.21738,0.04732,0,0.96433,0.45487,0,0.03209,0.0273,0,0.0478,0.30117,0,0,0,0.52842,0.02361,0,0.00868,0,0.04149,0.02803,0.4304,0,0.27594,0.01873,0,0,0.69289,0,0.00027,0.09959,0,0.15817,0,0.04951,0,0,0.67682,0,0,0.16793,0.2768,0,0,0.36257,0.17016,0.30947,0,0.08288,0.03279,0.00246,0,0.23487,0,0.03255,0.02392,0.51578,0.01079,0,0.0506,0.11926,0,0.00345,0.75033,0.01949,0,0,0,0,0.44438,0.1835,0.03101,0.21952,0,0.19739,0,0,0.20603,0,0.02727,0.18479,0.20406,0.0029,0,0.01015,0.0641,0.0476,0,0,0,0.09512,0,0.00764,0,0,0,0,0,0.05459,0,0,0,0.38236,0,0.73366,0.53545,0,0.20546,0,0.33759,0,0,0.42075,0,0,0,1.09677,0.48052,0,0,0.38271,0.84128,0.0235,0.57818,0.18303,0,0.13358,0.01506,0.01385,0.40606,0,0.04667,0.00249,0.02162,0.0269,0.0546,0,0.01768,0.21806,0.14929,0]', NULL, CAST(N'2026-10-25T04:43:13.6680000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2))
INSERT [dbo].[FaceEmbedding] ([id], [memberId], [embedding], [imageData], [consentAt], [createdAt], [updatedAt]) VALUES (N'502e02e5-a0ff-45c7-948f-b1d0b8fc0840', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'[0,0.13254,0.08611,0.17797,0,0,0,0.00852,0.23025,0.17324,0,0,0,0,0,0,0.01155,0,0.00138,0,0,0.27714,0,0.55605,0,0,0.83217,0.66229,0.01413,0.84531,0.03037,0.63227,0.27024,0,0.9214,0.81406,0.11035,0,0.00059,0.10047,0.68385,0,0,0.35309,0.38225,0.11482,0,0.19199,0,0.50311,0.07276,0,0.05311,0.48884,0.04709,1.7107,0,0.42464,0,0,0.11541,0,0.16059,0,0.04974,0.05983,0.07598,0.67502,0.53922,0,0.00502,0,0.0997,0.03805,0,1.0194,0.01109,0,0,0,0,0.01524,0.68139,0.63462,0.03484,0,0,0.00792,0.76108,0.7897,0,0.8428,0.1229,0.15458,0.41718,0,0.10905,0,0,0.22761,0,0.00165,0,0,0.0043,0.21274,0.0324,0.02507,0.04782,0,0.6414,0,0.00802,0.01058,0.51012,0,0,0,0,0.40527,0.05839,0.18715,0,0.82547,0.09104,0.12295,0.00382,0.15597,0.81794,0.08151,0,0.32143,0.00774,0,0,0.55133,0,0.43846,0,0.37914,0.03071,0,0.04032,0.90329,0.08979,0.08682,0,0.03218,0,0,0,0.29548,0,0,0.41428,0,0,0,0.03775,0.09817,0,0.39443,0.27712,0.18018,0.03071,0.05092,0,0.0561,0.0359,0,0.44576,0.19746,0,0.46362,0.4397,0.01927,0.00162,0,0.07585,0.49216,0.20109,0.01116,0.06686,0.24027,0,0.04503,0.25622,0.50174,0.17246,0.01272,0,0,0.01597,0.03013,0,0,0,0,0,0,0.17838,0,0,1.19975,0.37154,0.05832,0,0.2595,0,0,0,0.2582,0.01839,0.35429,0.58681,0,0.0519,0,0.18598,0.02893,0.11962,0.74256,0.06786,1.06747,0.41101,0,0.41076,0,0.00281,1.06123,0.19287,0.22727,0.08898,0.59931,0.27104,0,0,0,0.11512,0.01495,0.22085,0.04707,0,0,0.2541,0.00516,0,0.31489,0,0.11163,0.01842,0.23619,0,0.06483,0.26271,0,0.06183,0,0.11165,0.01991,0,0.1842,0.1234,0.84744,0.60449,0,0.36984,0.03415,0.40049,0.18276,0,0.11287,0.1529,0,0.28838,0,0.03265,0.02639,0.38707,0.40313,0,0.00371,0.69715,0,0,0.04955,0.67335,0,0,0.43181,0.2678,0.93065,0,0,0,0.4789,0.07168,0.45267,0.00798,0,0,0.03086,0.10966,0,0.03356,1.0773,0.00416,0.49996,0.54893,0.38236,0,0.19036,0,0,0.19588,0.27239,0.00128,0.44629,0.32986,0.19094,0,0.11037,0,0,0.72407,0,0.66747,0,1.24364,0.04419,0,0,0,0,0.03037,0.00371,0.22904,0,0.01086,0,0.41568,0,0.15652,0,0.02014,0.10986,0,0.12732,0,0.9814,0.08096,0,0,0,0,0.04235,0.04879,0.0403,0.07079,0.23903,0.18738,0.37209,0.27945,0,0.0641,0.00953,1.02863,0.14125,0.21673,0,1.00942,0.68869,0,0.11145,0,0.00859,0.29266,0,0.001,0,0,0,0,0.2297,0.02953,0,0,0.00938,0.8998,0.25058,0,0.38212,0.253,0.64289,0.31708,0.02795,0.40582,0,0.14945,0,0.08314,0.04745,0.70268,0.3052,0,0.11378,0,0.77179,0,0,0.09042,0.18646,0.00069,0.01194,0,0,0.04613,0.77271,0,0.35162,0.02781,0.131,0,0.17068,0.68357,1.22281,0,0.50112,0.05969,1.01919,0.02208,0.06371,0.62577,0,0.18927,0.24729,0.35707,0,0.00651,0,0.00006,0.15763,0.24013,0,1.15257,0.72482,0,0.11084,0,0.01178,1.03637,0.24896,0.0434,0.23394,0,0.24527,0,0.45048,0,0,0,0,0,1.68945,0,0.0028,0,0,0,1.16151,0.05434,0.61132,0,0,0,0,0.01278,0.70512,0.16973,0.33909,0.08016,0,0.39161,0,0,0.05194,0.10646,0.10489,0.10533,0,0,0.00532,0,0.1445,0,0.05184,0.46606,0.80824,0,0.4012,0.24116,0.27048,0.19645,1.05065,0.03943,0.10888,0.01681,0,0,0.07648,0.13206,0,0,0.34979,0.00551,0.07742,0.24851,0.6417,0,0.00383,0,0.87856,0.07887,0,0,0.30439,0.05956,0.14029,0,0.58055,0.07277,0.59869,0,0.44086,0,0,0.13256,0,0,0,0.06846,0,0.32545,0.54049,0,0,0.04607,0,0,0.00015,0,0.12764,0.69355,0,0.10504,0.59364,0,0.45195,0,0.58145,0.00244,0.11057,0,0.30691,0.00474,0.07199,0,0.55856,0,0.35205,0,0.51039,0,0.3874,0.86494,0.01806,0.00338,0,0.2999,0.1822,0.39314,0,0.0601,0.8008,0,0.01467,0.15183,0,0.32816,0,1.08491,0,0.47367,0,0.03023,0.01431,0,0.56285,0.53477,1.20002,0.50303,0,0.25626,0.03825,0,0.96753,0.02303,0,0.21503,0.76354,0,0.11471,0,0,0.04959,0.44093,0,0.95631,0,0.11782,0.07436,0.09551,0.80352,0.07241,0,0.05473,0.14835,0.04163,0.09643,0.40075,0,0.00972,0,0.84764,0.14274,0,0,0.12281,0.11961,0,0,0,0.08102,0.11746,0,0.01412,0.37562,0,0.73964,0.60582,0,0.04949,0,0,0,0,0,0.06246,0,0.66632,0,0,0,0.13074,0,0,0.04461,0.24475,0.82243,0,0.47622,0,0.2187,0.42171,0,0,0.11252,0.65902,0.53465,0,0,0.37808,0.1249,0.31131,0,0.01608,0.68324,0.00946,0,0,0,0.08193,0.07027,0.02274,0.00314,0.08977,0,0,0,0.54026,0.19001,0,0.6638,0,0,0,0,0,0.32819,0.03091,0,0,0.06395,0,0.00794,0,0,0,0,0,0,0.01068,0.06436,0,0,0.00224,0.08949,0.37073,0,0.02407,0.01105,0.02333,0.21855,0,0.0637,0,0,0,0,0.10803,0,0.11899,0,0,0,0.03111,0,0,0,0,0,0,0,0,0,0.49293,0.09017,0.30879,0,0,0,0,0.26139,0,0,0,0.64989,0,0.12884,0,0.40477,0.76867,0,0,0.82056,0,0,0.00436,0.1113,0.20932,0.15406,0.13801,0.07972,0.3864,0.0327,0.10939,0.2903,0,0.57787,0.72062,0.00292,0.04566,0.30549,0.50156,0.23857,0.01765,0,0,0,0.02924,0,0.06508,0,0.34593,0,0.24252,0,0,0.16463,0.01664,0.11317,0.02901,0,0,0.00383,0.13248,0.05683,0.76171,0.03725,0.01106,0.46847,0.00644,1.10513,0,0.01381,0.44063,0.15362,0.33353,0.01292,0.0898,0.20764,0.22085,1.04389,0.96491,0,0.12355,0.00002,0.11019,0,0,0.02082,0,0.74661,0.06575,0,0,0.09097,0,0.34184,0.32098,0.27676,0.03541,0.08351,0.66142,0,0.00464,0.79829,0.03453,0.05535,0,0,0,0.00856,0.42672,0.28262,0.04506,0.55539,0.69853,0.31251,0.08734,0.02408,0.09628,0.81979,0,0,0,0,1.7357,0.34622,0.30368,0.39816,0.45131,0.14403,0.27126,0.00609,0,1.14242,0.52906,0.04127,0.10786,0.01778,0,0,0.40298,0,0.0136,0,0.6775,0.07406,0,0.24379,0,0.03663,0,0.64825,0,0.36591,0.04006,0,0,0.7627,0,0,0.43706,0.12946,0.0906,0,0.0249,0.04011,0,0.64567,0.10402,0,0.37028,0.57963,0.0099,0,0.43513,0.09628,0.41498,0,0.18762,0.01689,0.18988,0,0.30125,0,0.00383,0.11225,0.67028,0,0.0156,0,0.15098,0,0,0.49749,0.24611,0,0,0.00917,0.0511,0.21553,0.24197,0.53719,0.21613,0,0.27056,0,0,0.23661,0,0,0.00682,0.34149,0.02135,0,0.01275,0.12329,0.07652,0,0,0.03805,0.08254,0,0,0,0,0,0.02967,0.07892,0.08927,0,0,0,0.49831,0,0.85938,0.8845,0.00302,0.22356,0,0.22272,0,0,0.45214,0,0.05008,0,1.17294,0.43385,0,0.03096,0.57028,0.683,0.19432,0.26023,0.33181,0,0.06326,0.01567,0.00676,0.52521,0.10472,0.09968,0,0.00028,0,0.05133,0.01513,0,0.26089,0.00761,0]', N'data:image/jpeg;base64,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', CAST(N'2026-10-25T04:43:13.6680000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2), CAST(N'2026-10-25T04:43:13.6710000' AS DateTime2))
INSERT [dbo].[FaceEmbedding] ([id], [memberId], [embedding], [imageData], [consentAt], [createdAt], [updatedAt]) VALUES (N'7f264106-3c1c-4e69-ae99-fce3a63ba3d6', N'470189f4-5c98-407f-8a4b-2c39d40285fa', NULL, NULL, CAST(N'2026-10-25T10:18:27.2266667' AS DateTime2), CAST(N'2026-10-25T10:18:27.2266667' AS DateTime2), CAST(N'2026-10-25T10:18:27.2266667' AS DateTime2))
GO
INSERT [dbo].[Gender] ([value]) VALUES (N'FEMALE')
INSERT [dbo].[Gender] ([value]) VALUES (N'MALE')
INSERT [dbo].[Gender] ([value]) VALUES (N'OTHER')
GO
INSERT [dbo].[Invoice] ([id], [memberId], [code], [status], [amount], [createdAt], [updatedAt], [invoiceNumber], [membershipId], [paymentId], [subtotal], [discount], [total], [issuedAt], [dueDate]) VALUES (N'33ce7b61-e2b5-417f-9d3b-509c912d7d5f', N'b20d308f-b26b-46b9-9533-d280fed97a8b', NULL, N'PAID', CAST(0.00 AS Decimal(12, 2)), CAST(N'2026-10-25T04:42:18.6700000' AS DateTime2), CAST(N'2026-10-25T04:43:00.7920000' AS DateTime2), N'INV-2026-0002', N'b97e8e98-fef8-44e8-b6d6-6ae850a782d4', N'71218274-dd92-44e5-ae1e-8d8d913e2cee', CAST(2000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(2000.00 AS Decimal(12, 2)), CAST(N'2026-10-25T04:42:18.6680000' AS DateTime2), CAST(N'2026-11-01T04:42:18.6480000' AS DateTime2))
INSERT [dbo].[Invoice] ([id], [memberId], [code], [status], [amount], [createdAt], [updatedAt], [invoiceNumber], [membershipId], [paymentId], [subtotal], [discount], [total], [issuedAt], [dueDate]) VALUES (N'ac195aae-dfc1-43c9-a063-5f9d965f119d', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'INV-2026-1002', N'PAID', CAST(250000.00 AS Decimal(12, 2)), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), N'INV-2026-1002', NULL, N'89c857f1-7ac2-46e0-9eca-d1043a86f1d9', CAST(250000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(250000.00 AS Decimal(12, 2)), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), NULL)
INSERT [dbo].[Invoice] ([id], [memberId], [code], [status], [amount], [createdAt], [updatedAt], [invoiceNumber], [membershipId], [paymentId], [subtotal], [discount], [total], [issuedAt], [dueDate]) VALUES (N'fc51e6fc-0e30-4276-8550-71ac58d6db34', N'470189f4-5c98-407f-8a4b-2c39d40285fa', NULL, N'ISSUED', CAST(0.00 AS Decimal(12, 2)), CAST(N'2026-10-25T05:00:00.5410000' AS DateTime2), CAST(N'2026-10-25T05:00:00.5410000' AS DateTime2), N'INV-2026-0003', N'48703b66-d108-4716-af57-2d3c17fadf61', N'396f0e09-3a37-4a80-a12f-2d3d8268db2e', CAST(2000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(2000.00 AS Decimal(12, 2)), CAST(N'2026-10-25T05:00:00.5390000' AS DateTime2), CAST(N'2026-12-02T00:00:00.0000000' AS DateTime2))
INSERT [dbo].[Invoice] ([id], [memberId], [code], [status], [amount], [createdAt], [updatedAt], [invoiceNumber], [membershipId], [paymentId], [subtotal], [discount], [total], [issuedAt], [dueDate]) VALUES (N'ca987f3e-2faa-4675-86aa-97a7454d4d5f', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'INV-2026-1001', N'PAID', CAST(299000.00 AS Decimal(12, 2)), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), N'INV-2026-1001', N'cbdd5126-661e-4792-804f-c822a602cd03', N'77194593-79f3-4410-be01-39065ffe76b1', CAST(299000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(299000.00 AS Decimal(12, 2)), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), NULL)
INSERT [dbo].[Invoice] ([id], [memberId], [code], [status], [amount], [createdAt], [updatedAt], [invoiceNumber], [membershipId], [paymentId], [subtotal], [discount], [total], [issuedAt], [dueDate]) VALUES (N'386df1e0-9373-43cc-90b7-a2edf9242baa', N'9a1daf0c-8207-440a-9b5c-d478b1d401f3', NULL, N'ISSUED', CAST(0.00 AS Decimal(12, 2)), CAST(N'2026-10-25T04:38:52.4070000' AS DateTime2), CAST(N'2026-10-25T04:38:52.4070000' AS DateTime2), N'INV-2026-0001', N'0206e18f-41bc-4a83-bd93-3b202b3a3ddc', N'd262b372-5e89-417d-a537-30bf9f85b2e5', CAST(299000.00 AS Decimal(12, 2)), CAST(0.00 AS Decimal(12, 2)), CAST(299000.00 AS Decimal(12, 2)), CAST(N'2026-10-25T04:38:52.4060000' AS DateTime2), CAST(N'2026-11-01T04:38:52.3800000' AS DateTime2))
GO
INSERT [dbo].[InvoiceStatusTbl] ([value]) VALUES (N'CANCELLED')
INSERT [dbo].[InvoiceStatusTbl] ([value]) VALUES (N'DRAFT')
INSERT [dbo].[InvoiceStatusTbl] ([value]) VALUES (N'ISSUED')
INSERT [dbo].[InvoiceStatusTbl] ([value]) VALUES (N'PAID')
GO
INSERT [dbo].[Meal] ([id], [mealPlanId], [type], [dayIndex], [time], [note], [imageData], [totalCalories], [totalProtein], [totalCarbs], [totalFat], [orderIndex], [createdAt], [updatedAt]) VALUES (N'06effc6c-a996-4eae-a8b9-4bc38d5fb772', N'd90fd6eb-6707-4a65-9a1b-6c33f8b9f0e7', N'BREAKFAST', NULL, N'07:30', NULL, NULL, 0, 0, 0, 0, 0, CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2), CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2))
INSERT [dbo].[Meal] ([id], [mealPlanId], [type], [dayIndex], [time], [note], [imageData], [totalCalories], [totalProtein], [totalCarbs], [totalFat], [orderIndex], [createdAt], [updatedAt]) VALUES (N'437f7eca-bdb1-46e7-8271-48b19a5b1733', N'd90fd6eb-6707-4a65-9a1b-6c33f8b9f0e7', N'LUNCH', NULL, N'07:30', NULL, NULL, 0, 0, 0, 0, 1, CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2), CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2))
GO
INSERT [dbo].[MealItem] ([id], [mealId], [foodId], [name], [imageUrl], [quantity], [unit], [calories], [protein], [carbs], [fat], [orderIndex], [createdAt], [updatedAt]) VALUES (N'75b2ed1a-28fc-4765-ab91-feb648b92c34', N'06effc6c-a996-4eae-a8b9-4bc38d5fb772', NULL, N'ức gà', NULL, 100, N'g', 0, 0, 0, 0, 0, CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2), CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2))
INSERT [dbo].[MealItem] ([id], [mealId], [foodId], [name], [imageUrl], [quantity], [unit], [calories], [protein], [carbs], [fat], [orderIndex], [createdAt], [updatedAt]) VALUES (N'e97374c2-7ba7-4492-9684-6e030ccfbc0e', N'437f7eca-bdb1-46e7-8271-48b19a5b1733', NULL, N'thịt bò', NULL, 100, N'g', 0, 0, 0, 0, 0, CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2), CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2))
GO
INSERT [dbo].[MealPlan] ([id], [trainerId], [memberId], [title], [description], [scope], [startDate], [status], [isTemplate], [templateName], [imageData], [totalCalories], [totalProtein], [totalCarbs], [totalFat], [version], [confirmedAt], [createdAt], [updatedAt]) VALUES (N'd90fd6eb-6707-4a65-9a1b-6c33f8b9f0e7', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'giảm cân', N'ăn đúng giờ', N'DAY', CAST(N'2026-10-26T00:00:00.0000000' AS DateTime2), N'SENT', 0, NULL, NULL, 0, 0, 0, 0, 1, NULL, CAST(N'2026-10-25T04:59:36.4240000' AS DateTime2), CAST(N'2026-10-25T04:59:36.5200000' AS DateTime2))
GO
INSERT [dbo].[Member] ([id], [code], [userId], [branchId], [fullName], [email], [phone], [gender], [dateOfBirth], [address], [status], [notes], [createdAt], [updatedAt], [joinedAt], [avatarUrl], [emergencyContact]) VALUES (N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'MEM-0002', NULL, N'e5c91863-5330-409c-bfb6-68a7f45b5bba', N'Phạm Thị Ngọc', N'member2@gym.local', N'0900000002', N'FEMALE', NULL, NULL, N'ACTIVE', NULL, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), NULL, NULL)
INSERT [dbo].[Member] ([id], [code], [userId], [branchId], [fullName], [email], [phone], [gender], [dateOfBirth], [address], [status], [notes], [createdAt], [updatedAt], [joinedAt], [avatarUrl], [emergencyContact]) VALUES (N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'MEM-0001', N'4a157c66-3a59-4baf-839e-12603dbe2da5', N'e5c91863-5330-409c-bfb6-68a7f45b5bba', N'Lê Hoàng Anh', N'test1@gym.local', N'0900000001', N'MALE', NULL, NULL, N'ACTIVE', NULL, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), NULL, NULL)
INSERT [dbo].[Member] ([id], [code], [userId], [branchId], [fullName], [email], [phone], [gender], [dateOfBirth], [address], [status], [notes], [createdAt], [updatedAt], [joinedAt], [avatarUrl], [emergencyContact]) VALUES (N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'MEM-0004', N'48df01ac-0639-461d-a25c-8ae7db35f85f', NULL, N'nguyen anh tuan', N'tuann302@gmail.com', N'0799951104', N'MALE', NULL, NULL, N'ACTIVE', NULL, CAST(N'2026-10-25T04:42:11.1430000' AS DateTime2), CAST(N'2026-10-25T04:42:11.1430000' AS DateTime2), CAST(N'2026-10-25T04:42:11.1430000' AS DateTime2), NULL, NULL)
INSERT [dbo].[Member] ([id], [code], [userId], [branchId], [fullName], [email], [phone], [gender], [dateOfBirth], [address], [status], [notes], [createdAt], [updatedAt], [joinedAt], [avatarUrl], [emergencyContact]) VALUES (N'9a1daf0c-8207-440a-9b5c-d478b1d401f3', N'MEM-0003', NULL, N'1f155ae2-40e6-450d-9086-177763fb846e', N'Vũ Đức Thành', N'member3@gym.local', N'0900000003', N'MALE', NULL, NULL, N'ACTIVE', NULL, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[Membership] ([id], [memberId], [packageType], [status], [startDate], [endDate], [price], [note], [createdAt], [updatedAt], [packageId], [discountAmount], [finalAmount], [remainingSessions]) VALUES (N'48703b66-d108-4716-af57-2d3c17fadf61', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'FIXED_TERM', N'PENDING', CAST(N'2026-11-25T00:00:00.0000000' AS DateTime2), CAST(N'2026-11-26T00:00:00.0000000' AS DateTime2), CAST(2000.00 AS Decimal(12, 2)), NULL, CAST(N'2026-10-25T05:00:00.5350000' AS DateTime2), CAST(N'2026-10-25T05:00:00.5350000' AS DateTime2), N'c23dc136-7d81-421c-ad67-600b0c9d4381', CAST(0.00 AS Decimal(12, 2)), CAST(2000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[Membership] ([id], [memberId], [packageType], [status], [startDate], [endDate], [price], [note], [createdAt], [updatedAt], [packageId], [discountAmount], [finalAmount], [remainingSessions]) VALUES (N'0206e18f-41bc-4a83-bd93-3b202b3a3ddc', N'9a1daf0c-8207-440a-9b5c-d478b1d401f3', N'FIXED_TERM', N'CANCELLED', CAST(N'2026-10-25T04:38:52.3800000' AS DateTime2), CAST(N'2026-11-24T04:38:52.3800000' AS DateTime2), CAST(299000.00 AS Decimal(12, 2)), NULL, CAST(N'2026-10-25T04:38:52.3880000' AS DateTime2), CAST(N'2026-10-25T04:39:06.6690000' AS DateTime2), N'2b48f96e-5a59-4a86-b1f5-0d0cb34c5779', CAST(0.00 AS Decimal(12, 2)), CAST(299000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[Membership] ([id], [memberId], [packageType], [status], [startDate], [endDate], [price], [note], [createdAt], [updatedAt], [packageId], [discountAmount], [finalAmount], [remainingSessions]) VALUES (N'b97e8e98-fef8-44e8-b6d6-6ae850a782d4', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'FIXED_TERM', N'ACTIVE', CAST(N'2026-10-25T04:42:18.6480000' AS DateTime2), CAST(N'2026-10-26T04:42:18.6480000' AS DateTime2), CAST(2000.00 AS Decimal(12, 2)), NULL, CAST(N'2026-10-25T04:42:18.6530000' AS DateTime2), CAST(N'2026-10-25T04:43:00.7900000' AS DateTime2), N'c23dc136-7d81-421c-ad67-600b0c9d4381', CAST(0.00 AS Decimal(12, 2)), CAST(2000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[Membership] ([id], [memberId], [packageType], [status], [startDate], [endDate], [price], [note], [createdAt], [updatedAt], [packageId], [discountAmount], [finalAmount], [remainingSessions]) VALUES (N'5e5905de-ea52-4422-ac59-ab75e67a6484', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'FIXED_TERM', N'PENDING', CAST(N'2026-10-25T00:00:00.0000000' AS DateTime2), CAST(N'2026-12-24T00:00:00.0000000' AS DateTime2), CAST(499000.00 AS Decimal(12, 2)), N'Chờ kích hoạt', CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), N'd6164458-c86f-4d12-8732-e9b8c564e19b', NULL, CAST(499000.00 AS Decimal(12, 2)), NULL)
INSERT [dbo].[Membership] ([id], [memberId], [packageType], [status], [startDate], [endDate], [price], [note], [createdAt], [updatedAt], [packageId], [discountAmount], [finalAmount], [remainingSessions]) VALUES (N'cbdd5126-661e-4792-804f-c822a602cd03', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'FIXED_TERM', N'ACTIVE', CAST(N'2026-10-25T00:00:00.0000000' AS DateTime2), CAST(N'2026-11-24T00:00:00.0000000' AS DateTime2), CAST(299000.00 AS Decimal(12, 2)), N'Gói 30 ngày', CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), N'2b48f96e-5a59-4a86-b1f5-0d0cb34c5779', NULL, CAST(299000.00 AS Decimal(12, 2)), NULL)
GO
INSERT [dbo].[MembershipPackage] ([id], [name], [description], [durationDays], [sessionCount], [price], [isActive], [createdAt], [updatedAt], [code], [features], [sessions], [type], [status]) VALUES (N'2b48f96e-5a59-4a86-b1f5-0d0cb34c5779', N'Gói 30 ngày', N'Gói tập cơ bản 30 ngày', 30, 0, CAST(299000.00 AS Decimal(12, 2)), 1, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), N'PKG-2B48F96E-5A59-4A86-B1F5-0D0CB34C5779', NULL, 0, N'SESSION_BASED', N'ACTIVE')
INSERT [dbo].[MembershipPackage] ([id], [name], [description], [durationDays], [sessionCount], [price], [isActive], [createdAt], [updatedAt], [code], [features], [sessions], [type], [status]) VALUES (N'c23dc136-7d81-421c-ad67-600b0c9d4381', N'1 ngày', NULL, 1, 0, CAST(2000.00 AS Decimal(12, 2)), 1, CAST(N'2026-10-25T04:39:35.5770000' AS DateTime2), CAST(N'2026-10-25T04:39:35.5770000' AS DateTime2), N'PKG-MVNC9C45', N'{"title":"1 ngày","items":["Tập luyện không giới hạn khung giờ","Sử dụng tủ đồ và phòng tắm nóng lạnh"]}', 1, N'FIXED_TERM', N'ACTIVE')
INSERT [dbo].[MembershipPackage] ([id], [name], [description], [durationDays], [sessionCount], [price], [isActive], [createdAt], [updatedAt], [code], [features], [sessions], [type], [status]) VALUES (N'd6164458-c86f-4d12-8732-e9b8c564e19b', N'Gói 60 ngày', N'Gói tập 60 ngày', 60, 0, CAST(499000.00 AS Decimal(12, 2)), 1, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), N'PKG-D6164458-C86F-4D12-8732-E9B8C564E19B', NULL, 0, N'SESSION_BASED', N'ACTIVE')
GO
INSERT [dbo].[MembershipStatusTbl] ([value]) VALUES (N'ACTIVE')
INSERT [dbo].[MembershipStatusTbl] ([value]) VALUES (N'CANCELLED')
INSERT [dbo].[MembershipStatusTbl] ([value]) VALUES (N'EXPIRED')
INSERT [dbo].[MembershipStatusTbl] ([value]) VALUES (N'PENDING')
INSERT [dbo].[MembershipStatusTbl] ([value]) VALUES (N'SUSPENDED')
GO
INSERT [dbo].[MemberStatusTbl] ([value]) VALUES (N'ACTIVE')
INSERT [dbo].[MemberStatusTbl] ([value]) VALUES (N'EXPIRED')
INSERT [dbo].[MemberStatusTbl] ([value]) VALUES (N'INACTIVE')
INSERT [dbo].[MemberStatusTbl] ([value]) VALUES (N'SUSPENDED')
GO
INSERT [dbo].[Message] ([id], [conversationId], [senderId], [receiverId], [content], [isRead], [createdAt], [type], [mealPlanId], [readAt], [editedAt], [updatedAt]) VALUES (N'9db38341-e855-4756-83f2-13c304c5de75', N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'7f8393a2-563f-455e-b0b3-e731305ee873', NULL, N'alo e', 1, CAST(N'2026-10-25T04:57:33.7800000' AS DateTime2), N'TEXT', NULL, CAST(N'2026-10-25T04:57:33.8360000' AS DateTime2), NULL, CAST(N'2026-10-25T04:57:33.8370000' AS DateTime2))
INSERT [dbo].[Message] ([id], [conversationId], [senderId], [receiverId], [content], [isRead], [createdAt], [type], [mealPlanId], [readAt], [editedAt], [updatedAt]) VALUES (N'18291e4e-b568-483b-8253-37e87794d105', N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'4a157c66-3a59-4baf-839e-12603dbe2da5', NULL, N'nghe', 1, CAST(N'2026-10-25T04:57:27.6710000' AS DateTime2), N'TEXT', NULL, CAST(N'2026-10-25T04:57:30.1830000' AS DateTime2), NULL, CAST(N'2026-10-25T04:57:30.1840000' AS DateTime2))
INSERT [dbo].[Message] ([id], [conversationId], [senderId], [receiverId], [content], [isRead], [createdAt], [type], [mealPlanId], [readAt], [editedAt], [updatedAt]) VALUES (N'd387cd6c-48ea-412b-9f9f-5adbb247c8d8', N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'7f8393a2-563f-455e-b0b3-e731305ee873', NULL, N'ăn đúng giờ', 1, CAST(N'2026-10-25T04:59:36.4960000' AS DateTime2), N'MEAL_PLAN', N'd90fd6eb-6707-4a65-9a1b-6c33f8b9f0e7', CAST(N'2026-10-25T04:59:36.5860000' AS DateTime2), NULL, CAST(N'2026-10-25T04:59:36.5870000' AS DateTime2))
INSERT [dbo].[Message] ([id], [conversationId], [senderId], [receiverId], [content], [isRead], [createdAt], [type], [mealPlanId], [readAt], [editedAt], [updatedAt]) VALUES (N'6b6fd199-90a5-4093-90ce-83201accd1c4', N'dc1ba779-18bc-456a-ad65-30522ae940e0', N'4a157c66-3a59-4baf-839e-12603dbe2da5', NULL, N'oke shop', 1, CAST(N'2026-10-25T04:59:47.8240000' AS DateTime2), N'TEXT', NULL, CAST(N'2026-10-25T04:59:47.8750000' AS DateTime2), NULL, CAST(N'2026-10-25T04:59:47.8760000' AS DateTime2))
INSERT [dbo].[Message] ([id], [conversationId], [senderId], [receiverId], [content], [isRead], [createdAt], [type], [mealPlanId], [readAt], [editedAt], [updatedAt]) VALUES (N'37430c96-7c13-4419-843a-b8314f225b39', N'66dd54d8-1440-4493-adbd-74e640e4cf44', N'7f8393a2-563f-455e-b0b3-e731305ee873', NULL, N'alo e', 0, CAST(N'2026-10-25T04:57:16.0410000' AS DateTime2), N'TEXT', NULL, NULL, NULL, CAST(N'2026-10-25T04:57:16.0410000' AS DateTime2))
GO
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'05be8daf-0b1e-4bcd-b41b-2539b0663ea9', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Check-in thành công 💪', N'Lễ tân đã check-in cho bạn lúc 11:55:22.', N'CHECKIN', N'/member/checkins', N'CHECKIN_STAFF', N'cd4ce48d-9d57-4b09-90c6-d13efd8a105f', 0, CAST(N'2026-10-25T04:55:22.0600000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'97d139e8-b850-420b-819a-2d688b9d6f28', NULL, N'Tin nhắn mới từ hội viên', N'Lê Hoàng Anh: oke shop', N'CHAT', N'/trainer/messages', N'Message', N'6b6fd199-90a5-4093-90ce-83201accd1c4', 0, CAST(N'2026-10-25T04:59:47.8310000' AS DateTime2), N'7f8393a2-563f-455e-b0b3-e731305ee873', NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'a475b6f5-9fae-4262-a3c8-42c519b1578d', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Thanh toán thành công ✅', N'Hóa đơn INV-2026-0002 đã được xác nhận. Gói tập của bạn đã được kích hoạt và có hiệu lực đến 26/10/2026.', N'PAYMENT', N'/member/payments', N'PAYMENT_CONFIRMED', N'71218274-dd92-44e5-ae1e-8d8d913e2cee', 0, CAST(N'2026-10-25T04:43:00.7970000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'a081fc5f-1187-469d-81db-47e2c41da373', N'9a1daf0c-8207-440a-9b5c-d478b1d401f3', N'Đăng ký gói tập thành công 🎟️', N'Bạn vừa đăng ký gói Gói 30 ngày (30 ngày). Gói tập đang chờ xác nhận thanh toán. Sau khi lễ tân xác nhận, gói sẽ tự động kích hoạt.', N'PAYMENT', N'/member/membership', NULL, NULL, 0, CAST(N'2026-10-25T04:38:52.4160000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'1e007a43-62ed-477f-8134-51356e1fe759', NULL, N'Tin nhắn mới từ huấn luyện viên', N'alo e', N'CHAT', N'/member/messages', N'Message', N'9db38341-e855-4756-83f2-13c304c5de75', 0, CAST(N'2026-10-25T04:57:33.7880000' AS DateTime2), N'4a157c66-3a59-4baf-839e-12603dbe2da5', NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'1293abb5-8488-4544-ae6b-5a57affc9d81', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Check-out thành công 👋', N'Bạn đã kết thúc buổi tập lúc 11:55:17.', N'CHECKIN', N'/member/checkins', N'CHECKOUT', N'd80c54ff-ffa6-411d-bf1e-7e788036f222', 0, CAST(N'2026-10-25T04:55:17.7300000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'802f9000-8ab1-48c8-b664-5aed1f98f74e', NULL, N'Tin nhắn mới từ hội viên', N'Lê Hoàng Anh: nghe', N'CHAT', N'/trainer/messages', N'Message', N'18291e4e-b568-483b-8253-37e87794d105', 0, CAST(N'2026-10-25T04:57:27.6840000' AS DateTime2), N'7f8393a2-563f-455e-b0b3-e731305ee873', NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'1dfac8e3-5471-4c0f-aa00-7f7947db55a1', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Gói tập sắp hết hạn ⏰', N'Gói 1 ngày của bạn hết hạn ngày 26/10/2026. Gia hạn ngay để không gián đoạn lịch tập.', N'MEMBERSHIP', N'/member/membership', N'MEMBERSHIP_EXPIRING', N'b97e8e98-fef8-44e8-b6d6-6ae850a782d4', 0, CAST(N'2026-10-25T04:54:35.4220000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'8270392b-fd4c-43e5-b05a-8a370eab92c6', N'9a1daf0c-8207-440a-9b5c-d478b1d401f3', N'Hợp đồng đã bị hủy 🗑️', N'Hợp đồng gói Gói 30 ngày của bạn đã bị hủy (Lý do: Hủy bởi quản trị viên).', N'MEMBERSHIP', N'/member/membership', NULL, NULL, 0, CAST(N'2026-10-25T04:39:06.6850000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'084c4ddd-a06a-4d06-b934-9cc46d367707', NULL, N'Tin nhắn mới từ huấn luyện viên', N'ăn đúng giờ', N'CHAT', N'/member/messages', N'Message', N'd387cd6c-48ea-412b-9f9f-5adbb247c8d8', 0, CAST(N'2026-10-25T04:59:36.5160000' AS DateTime2), N'4a157c66-3a59-4baf-839e-12603dbe2da5', NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'f28f64d6-974b-4ec5-8a76-b20895f503c3', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Check-out thành công 👋', N'Bạn đã kết thúc buổi tập lúc 11:55:28.', N'CHECKIN', N'/member/checkins', N'CHECKOUT', N'cd4ce48d-9d57-4b09-90c6-d13efd8a105f', 0, CAST(N'2026-10-25T04:55:28.4530000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'37c75a61-2d46-485b-8e11-c34a87094705', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'Chào mừng', N'Chào bạn đến với phòng gym!', N'GENERAL', NULL, NULL, NULL, 0, CAST(N'2026-10-25T10:18:27.2266667' AS DateTime2), N'4a157c66-3a59-4baf-839e-12603dbe2da5', NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'01bed2d5-10e4-40d2-be3e-c98ec19b8dca', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Đăng ký gói tập thành công 🎟️', N'Bạn vừa đăng ký gói 1 ngày (1 ngày). Gói tập đang chờ xác nhận thanh toán. Sau khi lễ tân xác nhận, gói sẽ tự động kích hoạt.', N'PAYMENT', N'/member/membership', NULL, NULL, 0, CAST(N'2026-10-25T04:42:18.6770000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'3b724170-4965-444e-99be-dbbb1f479ed8', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Check-in thành công 💪', N'Lễ tân đã check-in cho bạn lúc 11:55:07.', N'CHECKIN', N'/member/checkins', N'CHECKIN_STAFF', N'd80c54ff-ffa6-411d-bf1e-7e788036f222', 0, CAST(N'2026-10-25T04:55:07.4130000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'aca40823-454a-43c0-8339-e3ebc6fe774b', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'Yêu cầu gia hạn đã được tiếp nhận 🔄', N'Gói 1 ngày của bạn sẽ nối tiếp sau khi gói hiện tại hết hạn (từ 25/11/2026). Đang chờ xác nhận thanh toán.', N'PAYMENT', N'/member/membership', NULL, NULL, 0, CAST(N'2026-10-25T05:00:00.5440000' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'709ff402-5fc0-47bc-b71f-ebddf87a5588', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'Khuyến mãi', N'Ưu đãi dành cho hội viên.', N'GENERAL', NULL, NULL, NULL, 0, CAST(N'2026-10-25T10:18:27.2266667' AS DateTime2), NULL, NULL, NULL)
INSERT [dbo].[Notification] ([id], [memberId], [title], [content], [type], [link], [referenceType], [referenceId], [isRead], [createdAt], [userId], [readAt], [data]) VALUES (N'980d12ec-3b1e-4c96-9840-f9f8438cb080', N'b20d308f-b26b-46b9-9533-d280fed97a8b', N'Chào mừng đến với GymShark 🎉', N'Tài khoản hội viên của bạn đã được tạo tại quầy. Hãy đăng nhập để xem thẻ tập, lịch tập và đăng ký khuôn mặt nhận diện nhanh tại quầy.', N'SYSTEM', N'/member', NULL, NULL, 0, CAST(N'2026-10-25T04:42:11.1520000' AS DateTime2), NULL, NULL, NULL)
GO
INSERT [dbo].[PackageType] ([value]) VALUES (N'FIXED_TERM')
INSERT [dbo].[PackageType] ([value]) VALUES (N'SESSION_BASED')
GO
INSERT [dbo].[Payment] ([id], [memberId], [amount], [method], [status], [currency], [transactionRef], [confirmedById], [paidAt], [note], [createdAt], [updatedAt], [code], [membershipId], [promotionId], [discountAmount], [notes], [confirmedAt]) VALUES (N'396f0e09-3a37-4a80-a12f-2d3d8268db2e', N'470189f4-5c98-407f-8a4b-2c39d40285fa', CAST(2000.00 AS Decimal(12, 2)), N'BANK_TRANSFER', N'PENDING', N'VND', NULL, NULL, NULL, NULL, CAST(N'2026-10-25T05:00:00.5380000' AS DateTime2), CAST(N'2026-10-25T05:00:00.5380000' AS DateTime2), N'INV-2026-0003', N'48703b66-d108-4716-af57-2d3c17fadf61', NULL, NULL, N'Gia hạn gói 1 ngày (+1 ngày)', NULL)
INSERT [dbo].[Payment] ([id], [memberId], [amount], [method], [status], [currency], [transactionRef], [confirmedById], [paidAt], [note], [createdAt], [updatedAt], [code], [membershipId], [promotionId], [discountAmount], [notes], [confirmedAt]) VALUES (N'd262b372-5e89-417d-a537-30bf9f85b2e5', N'9a1daf0c-8207-440a-9b5c-d478b1d401f3', CAST(299000.00 AS Decimal(12, 2)), N'BANK_TRANSFER', N'CANCELLED', N'VND', NULL, NULL, NULL, NULL, CAST(N'2026-10-25T04:38:52.3980000' AS DateTime2), CAST(N'2026-10-25T04:39:06.6780000' AS DateTime2), N'INV-2026-0001', N'0206e18f-41bc-4a83-bd93-3b202b3a3ddc', NULL, NULL, N'Hủy theo yêu cầu quản trị viên', NULL)
INSERT [dbo].[Payment] ([id], [memberId], [amount], [method], [status], [currency], [transactionRef], [confirmedById], [paidAt], [note], [createdAt], [updatedAt], [code], [membershipId], [promotionId], [discountAmount], [notes], [confirmedAt]) VALUES (N'77194593-79f3-4410-be01-39065ffe76b1', N'470189f4-5c98-407f-8a4b-2c39d40285fa', CAST(299000.00 AS Decimal(12, 2)), N'CASH', N'PAID', N'VND', N'REF-001', NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), N'PAY-77194593-79F3-4410-BE01-39065FFE76B1', N'cbdd5126-661e-4792-804f-c822a602cd03', NULL, NULL, NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2))
INSERT [dbo].[Payment] ([id], [memberId], [amount], [method], [status], [currency], [transactionRef], [confirmedById], [paidAt], [note], [createdAt], [updatedAt], [code], [membershipId], [promotionId], [discountAmount], [notes], [confirmedAt]) VALUES (N'71218274-dd92-44e5-ae1e-8d8d913e2cee', N'b20d308f-b26b-46b9-9533-d280fed97a8b', CAST(2000.00 AS Decimal(12, 2)), N'BANK_TRANSFER', N'PAID', N'VND', N'16238005', N'c4d540ca-0716-4c1e-8fa1-490393c5b708', CAST(N'2026-10-25T04:43:00.7830000' AS DateTime2), NULL, CAST(N'2026-10-25T04:42:18.6620000' AS DateTime2), CAST(N'2026-10-25T04:43:00.7840000' AS DateTime2), N'INV-2026-0002', N'b97e8e98-fef8-44e8-b6d6-6ae850a782d4', NULL, NULL, N'Thanh toán gói 1 ngày | Đối soát tự động qua CASSO (2026-10-25 11:42:00)', CAST(N'2026-10-25T04:43:00.7830000' AS DateTime2))
INSERT [dbo].[Payment] ([id], [memberId], [amount], [method], [status], [currency], [transactionRef], [confirmedById], [paidAt], [note], [createdAt], [updatedAt], [code], [membershipId], [promotionId], [discountAmount], [notes], [confirmedAt]) VALUES (N'2eb01d5e-c5d3-4807-a7b9-9470095382cc', N'9a1daf0c-8207-440a-9b5c-d478b1d401f3', CAST(120000.00 AS Decimal(12, 2)), N'MOMO', N'PAID', N'VND', N'REF-003', NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), N'PAY-2EB01D5E-C5D3-4807-A7B9-9470095382CC', NULL, NULL, NULL, NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2))
INSERT [dbo].[Payment] ([id], [memberId], [amount], [method], [status], [currency], [transactionRef], [confirmedById], [paidAt], [note], [createdAt], [updatedAt], [code], [membershipId], [promotionId], [discountAmount], [notes], [confirmedAt]) VALUES (N'89c857f1-7ac2-46e0-9eca-d1043a86f1d9', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', CAST(250000.00 AS Decimal(12, 2)), N'BANK_TRANSFER', N'PAID', N'VND', N'REF-002', NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2), N'PAY-89C857F1-7AC2-46E0-9ECA-D1043A86F1D9', NULL, NULL, NULL, NULL, CAST(N'2026-10-25T10:18:27.2233333' AS DateTime2))
GO
INSERT [dbo].[PaymentMethodTbl] ([value]) VALUES (N'BANK_TRANSFER')
INSERT [dbo].[PaymentMethodTbl] ([value]) VALUES (N'CASH')
INSERT [dbo].[PaymentMethodTbl] ([value]) VALUES (N'CREDIT_CARD')
INSERT [dbo].[PaymentMethodTbl] ([value]) VALUES (N'MOMO')
INSERT [dbo].[PaymentMethodTbl] ([value]) VALUES (N'VNPAY')
GO
INSERT [dbo].[PaymentStatusTbl] ([value]) VALUES (N'CANCELLED')
INSERT [dbo].[PaymentStatusTbl] ([value]) VALUES (N'FAILED')
INSERT [dbo].[PaymentStatusTbl] ([value]) VALUES (N'PAID')
INSERT [dbo].[PaymentStatusTbl] ([value]) VALUES (N'PENDING')
INSERT [dbo].[PaymentStatusTbl] ([value]) VALUES (N'REFUNDED')
GO
INSERT [dbo].[Promotion] ([id], [code], [name], [description], [discountType], [discountValue], [minOrderValue], [maxDiscount], [usageLimit], [usageCount], [startDate], [endDate], [isActive], [perMemberLimit], [branchId], [createdAt], [updatedAt], [usedCount], [status]) VALUES (N'1bddea6f-cf13-4bc7-827f-6c57a2de0b25', N'PROMO10', N'Giảm 10%', NULL, N'PERCENTAGE', CAST(10.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), NULL, 0, 0, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), NULL, 1, 1, NULL, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), 0, N'ACTIVE')
INSERT [dbo].[Promotion] ([id], [code], [name], [description], [discountType], [discountValue], [minOrderValue], [maxDiscount], [usageLimit], [usageCount], [startDate], [endDate], [isActive], [perMemberLimit], [branchId], [createdAt], [updatedAt], [usedCount], [status]) VALUES (N'4c079045-9355-43f7-98ac-9508624ace86', N'PROMO50K', N'Giảm 50.000 đồng', NULL, N'FIXED_AMOUNT', CAST(50000.00 AS Decimal(10, 2)), CAST(0.00 AS Decimal(12, 2)), NULL, 0, 0, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), NULL, 1, 1, NULL, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), 0, N'ACTIVE')
GO
INSERT [dbo].[Room] ([id], [code], [name], [type], [capacity], [floor], [description], [status], [createdAt], [updatedAt]) VALUES (N'80c135c5-31b7-4a4d-8a3f-6be276f824c7', N'R-02', N'Phòng tập PT', N'PERSONAL_TRAINING', 10, NULL, NULL, N'AVAILABLE', CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2))
INSERT [dbo].[Room] ([id], [code], [name], [type], [capacity], [floor], [description], [status], [createdAt], [updatedAt]) VALUES (N'fe012dc5-1f4d-4062-a6da-ad30c288bfd5', N'R-01', N'Phòng Cardio', N'CARDIO', 20, NULL, NULL, N'AVAILABLE', CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2))
GO
INSERT [dbo].[RoomStatus] ([value]) VALUES (N'AVAILABLE')
INSERT [dbo].[RoomStatus] ([value]) VALUES (N'CLOSED')
INSERT [dbo].[RoomStatus] ([value]) VALUES (N'IN_USE')
INSERT [dbo].[RoomStatus] ([value]) VALUES (N'UNDER_MAINTENANCE')
GO
INSERT [dbo].[RoomType] ([value]) VALUES (N'CARDIO')
INSERT [dbo].[RoomType] ([value]) VALUES (N'GROUP_CLASS')
INSERT [dbo].[RoomType] ([value]) VALUES (N'GYM_AREA')
INSERT [dbo].[RoomType] ([value]) VALUES (N'OTHER')
INSERT [dbo].[RoomType] ([value]) VALUES (N'PERSONAL_TRAINING')
INSERT [dbo].[RoomType] ([value]) VALUES (N'WEIGHT_AREA')
INSERT [dbo].[RoomType] ([value]) VALUES (N'YOGA')
GO
INSERT [dbo].[ScheduleStatus] ([value]) VALUES (N'CANCELLED')
INSERT [dbo].[ScheduleStatus] ([value]) VALUES (N'COMPLETED')
INSERT [dbo].[ScheduleStatus] ([value]) VALUES (N'NO_SHOW')
INSERT [dbo].[ScheduleStatus] ([value]) VALUES (N'SCHEDULED')
GO
INSERT [dbo].[SessionType] ([value]) VALUES (N'FREE_TRAINING')
INSERT [dbo].[SessionType] ([value]) VALUES (N'GROUP_CLASS')
INSERT [dbo].[SessionType] ([value]) VALUES (N'PERSONAL_TRAINING')
GO
INSERT [dbo].[Trainer] ([id], [userId], [specialization], [certification], [experienceYears], [bio], [gender], [dateOfBirth], [rating], [hourlyRate], [status], [createdAt], [updatedAt]) VALUES (N'a2a32d68-d101-4fce-b204-84d2187529c5', N'7f8393a2-563f-455e-b0b3-e731305ee873', N'Cardio', N'Chứng chỉ huấn luyện viên', 3, NULL, N'MALE', NULL, 5, NULL, N'ACTIVE', CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2))
GO
INSERT [dbo].[TrainerMember] ([id], [trainerId], [memberId], [status], [assignedAt], [startDate], [endDate], [note], [createdAt], [updatedAt]) VALUES (N'c94e3054-1341-460c-871f-112f797500f7', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'ACTIVE', CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), NULL, NULL, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2))
INSERT [dbo].[TrainerMember] ([id], [trainerId], [memberId], [status], [assignedAt], [startDate], [endDate], [note], [createdAt], [updatedAt]) VALUES (N'b6ca6bcd-02b2-4ae3-bc7e-3c8ec3199229', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'ACTIVE', CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), NULL, NULL, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2))
GO
INSERT [dbo].[TrainerMemberStatus] ([value]) VALUES (N'ACTIVE')
INSERT [dbo].[TrainerMemberStatus] ([value]) VALUES (N'INACTIVE')
GO
INSERT [dbo].[TrainerStatus] ([value]) VALUES (N'ACTIVE')
INSERT [dbo].[TrainerStatus] ([value]) VALUES (N'INACTIVE')
INSERT [dbo].[TrainerStatus] ([value]) VALUES (N'ON_LEAVE')
GO
INSERT [dbo].[TrainingProgress] ([id], [memberId], [trainerId], [sessionType], [date], [durationMinutes], [notes], [caloriesBurned], [createdAt], [updatedAt], [sessionId], [note], [performance], [recommendation]) VALUES (N'fb6852b4-f536-402e-b3f3-d7672d5ba18e', N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'PERSONAL_TRAINING', CAST(N'2026-10-25' AS Date), 60, N'Buổi tập đầu tiên', 300, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), N'fb6852b4-f536-402e-b3f3-d7672d5ba18e', N'Buổi tập đầu tiên', N'Legacy durationMinutes=60; caloriesBurned=300; originalSessionType=PERSONAL_TRAINING', NULL)
INSERT [dbo].[TrainingProgress] ([id], [memberId], [trainerId], [sessionType], [date], [durationMinutes], [notes], [caloriesBurned], [createdAt], [updatedAt], [sessionId], [note], [performance], [recommendation]) VALUES (N'0367c6c5-000e-4d9b-91cf-ed2f03db7201', N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'PERSONAL_TRAINING', CAST(N'2026-10-25' AS Date), 45, N'Tập cardio', 220, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), N'0367c6c5-000e-4d9b-91cf-ed2f03db7201', N'Tập cardio', N'Legacy durationMinutes=45; caloriesBurned=220; originalSessionType=PERSONAL_TRAINING', NULL)
GO
INSERT [dbo].[TrainingSchedule] ([id], [roomId], [trainerId], [sessionType], [title], [description], [startTime], [endTime], [status], [maxParticipants], [createdAt], [updatedAt], [memberId], [type], [notes], [cancellationNote], [completedAt]) VALUES (N'cb677ce4-eb67-409d-bb29-add00b9f2950', N'fe012dc5-1f4d-4062-a6da-ad30c288bfd5', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'PERSONAL_TRAINING', N'PT buổi sáng', N'Buổi tập cá nhân', CAST(N'2026-10-25T11:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T12:18:27.2300000' AS DateTime2), N'SCHEDULED', 1, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), NULL, N'PERSONAL_TRAINING', NULL, NULL, NULL)
INSERT [dbo].[TrainingSchedule] ([id], [roomId], [trainerId], [sessionType], [title], [description], [startTime], [endTime], [status], [maxParticipants], [createdAt], [updatedAt], [memberId], [type], [notes], [cancellationNote], [completedAt]) VALUES (N'fb6852b4-f536-402e-b3f3-d7672d5ba18e', NULL, N'a2a32d68-d101-4fce-b204-84d2187529c5', N'GROUP_CLASS', N'Buổi tập đã ghi nhận - 2026-10-25', N'Imported from legacy TrainingProgress. Original type: PERSONAL_TRAINING', CAST(N'2026-10-25T00:00:00.0000000' AS DateTime2), CAST(N'2026-10-25T01:00:00.0000000' AS DateTime2), N'COMPLETED', 0, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), N'470189f4-5c98-407f-8a4b-2c39d40285fa', N'PERSONAL_TRAINING', NULL, NULL, CAST(N'2026-10-25T00:00:00.0000000' AS DateTime2))
INSERT [dbo].[TrainingSchedule] ([id], [roomId], [trainerId], [sessionType], [title], [description], [startTime], [endTime], [status], [maxParticipants], [createdAt], [updatedAt], [memberId], [type], [notes], [cancellationNote], [completedAt]) VALUES (N'0367c6c5-000e-4d9b-91cf-ed2f03db7201', NULL, N'a2a32d68-d101-4fce-b204-84d2187529c5', N'GROUP_CLASS', N'Buổi tập đã ghi nhận - 2026-10-25', N'Imported from legacy TrainingProgress. Original type: PERSONAL_TRAINING', CAST(N'2026-10-25T00:00:00.0000000' AS DateTime2), CAST(N'2026-10-25T00:45:00.0000000' AS DateTime2), N'COMPLETED', 0, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), N'f42d4760-d870-4fa2-a2fd-2b5a5ed3c268', N'PERSONAL_TRAINING', NULL, NULL, CAST(N'2026-10-25T00:00:00.0000000' AS DateTime2))
INSERT [dbo].[TrainingSchedule] ([id], [roomId], [trainerId], [sessionType], [title], [description], [startTime], [endTime], [status], [maxParticipants], [createdAt], [updatedAt], [memberId], [type], [notes], [cancellationNote], [completedAt]) VALUES (N'00e3ec78-e4f8-46fe-a934-f5148e042f3a', N'80c135c5-31b7-4a4d-8a3f-6be276f824c7', N'a2a32d68-d101-4fce-b204-84d2187529c5', N'GROUP_CLASS', N'Lớp tập buổi tối', N'Lớp tập nhóm', CAST(N'2026-10-25T13:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T14:18:27.2300000' AS DateTime2), N'SCHEDULED', 10, CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2300000' AS DateTime2), NULL, N'GROUP_CLASS', NULL, NULL, NULL)
GO
INSERT [dbo].[User] ([id], [email], [passwordHash], [fullName], [phone], [role], [status], [avatarUrl], [provider], [providerId], [createdAt], [updatedAt]) VALUES (N'4a157c66-3a59-4baf-839e-12603dbe2da5', N'test1@gym.local', N'$2b$10$AQI4HYfDu6HrfQM2kaIWw.aZoUVNgf1T/g4xKVrM1pT/UrcKi0dT2', N'Lê Hoàng Anh', NULL, N'MEMBER', N'ACTIVE', NULL, N'LOCAL', NULL, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2))
INSERT [dbo].[User] ([id], [email], [passwordHash], [fullName], [phone], [role], [status], [avatarUrl], [provider], [providerId], [createdAt], [updatedAt]) VALUES (N'c4d540ca-0716-4c1e-8fa1-490393c5b708', N'admin@gymshark.com', N'$2b$10$sNhRaGzlKc/WufCOJ2vFIuzNA70JKAbIpTj5z2SStaXtMnKgQuqHm', N'Quản trị viên', NULL, N'ADMIN', N'ACTIVE', NULL, N'LOCAL', NULL, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2))
INSERT [dbo].[User] ([id], [email], [passwordHash], [fullName], [phone], [role], [status], [avatarUrl], [provider], [providerId], [createdAt], [updatedAt]) VALUES (N'48df01ac-0639-461d-a25c-8ae7db35f85f', N'tuann302@gmail.com', N'$2b$10$7OBsiR4mrWhNLHCtc5jyaO0K6akj1jT4iPtlLYTqdEfIkcqz0KM/q', N'nguyen anh tuan', N'0799951104', N'MEMBER', N'ACTIVE', NULL, N'LOCAL', NULL, CAST(N'2026-10-25T04:42:11.1350000' AS DateTime2), CAST(N'2026-10-25T04:42:11.1350000' AS DateTime2))
INSERT [dbo].[User] ([id], [email], [passwordHash], [fullName], [phone], [role], [status], [avatarUrl], [provider], [providerId], [createdAt], [updatedAt]) VALUES (N'64bdaca9-17b2-4295-a4ed-a8a544eeaed8', N'staff@gym.local', N'$2b$10$v.B/QFQZC5I5jUAWM4jBX.BXBzPA7pLWqMbcXorI0BUPjswCgV4sO', N'Trần Thị Bình', NULL, N'STAFF', N'ACTIVE', NULL, N'LOCAL', NULL, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2))
INSERT [dbo].[User] ([id], [email], [passwordHash], [fullName], [phone], [role], [status], [avatarUrl], [provider], [providerId], [createdAt], [updatedAt]) VALUES (N'7f8393a2-563f-455e-b0b3-e731305ee873', N'trainer@gym.local', N'$2b$10$F9svRQu.ALCEXkAK2f8L7u5Y0glMe9JAfCFZC8nLFj46ngBrgIR6i', N'Phạm Văn Cường', NULL, N'TRAINER', N'ACTIVE', NULL, N'LOCAL', NULL, CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2), CAST(N'2026-10-25T10:18:27.2200000' AS DateTime2))
GO
INSERT [dbo].[UserRole] ([value]) VALUES (N'ADMIN')
INSERT [dbo].[UserRole] ([value]) VALUES (N'MANAGER')
INSERT [dbo].[UserRole] ([value]) VALUES (N'MEMBER')
INSERT [dbo].[UserRole] ([value]) VALUES (N'STAFF')
INSERT [dbo].[UserRole] ([value]) VALUES (N'TRAINER')
GO
INSERT [dbo].[UserStatus] ([value]) VALUES (N'ACTIVE')
INSERT [dbo].[UserStatus] ([value]) VALUES (N'INACTIVE')
INSERT [dbo].[UserStatus] ([value]) VALUES (N'SUSPENDED')
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Branch__72E12F1BF6502C64]    Script Date: 10/26/2026 7:44:25 AM ******/
ALTER TABLE [dbo].[Branch] ADD UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Member__357D4CF9AD6D6526]    Script Date: 10/26/2026 7:44:25 AM ******/
ALTER TABLE [dbo].[Member] ADD UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Membersh__72E12F1B2F40BC77]    Script Date: 10/26/2026 7:44:25 AM ******/
ALTER TABLE [dbo].[MembershipPackage] ADD UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Promotio__357D4CF9BC8E474E]    Script Date: 10/26/2026 7:44:25 AM ******/
ALTER TABLE [dbo].[Promotion] ADD UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__Trainer__CB9A1CFEE4853B55]    Script Date: 10/26/2026 7:44:25 AM ******/
ALTER TABLE [dbo].[Trainer] ADD UNIQUE NONCLUSTERED 
(
	[userId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__User__AB6E616475779024]    Script Date: 10/26/2026 7:44:25 AM ******/
ALTER TABLE [dbo].[User] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[AuditLog] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[AuditLog] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Branch] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Branch] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[Branch] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Branch] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT ('MANUAL') FOR [method]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT (getdate()) FOR [checkInTime]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT ('CHECKED_IN') FOR [status]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[CheckIn] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Conversation] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[Conversation] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[Conversation] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[Conversation] ADD  DEFAULT (getdate()) FOR [updatedAt]
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
ALTER TABLE [dbo].[AuditLog]  WITH CHECK ADD  CONSTRAINT [FK_Audit_User] FOREIGN KEY([userId])
REFERENCES [dbo].[User] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[AuditLog] CHECK CONSTRAINT [FK_Audit_User]
GO
ALTER TABLE [dbo].[Branch]  WITH CHECK ADD  CONSTRAINT [FK_Branch_Status] FOREIGN KEY([status])
REFERENCES [dbo].[UserStatus] ([value])
GO
ALTER TABLE [dbo].[Branch] CHECK CONSTRAINT [FK_Branch_Status]
GO
ALTER TABLE [dbo].[CheckIn]  WITH CHECK ADD  CONSTRAINT [FK_CheckIn_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[CheckIn] CHECK CONSTRAINT [FK_CheckIn_Member]
GO
ALTER TABLE [dbo].[CheckIn]  WITH CHECK ADD  CONSTRAINT [FK_CheckIn_Method] FOREIGN KEY([method])
REFERENCES [dbo].[CheckInMethod] ([value])
GO
ALTER TABLE [dbo].[CheckIn] CHECK CONSTRAINT [FK_CheckIn_Method]
GO
ALTER TABLE [dbo].[CheckIn]  WITH CHECK ADD  CONSTRAINT [FK_CheckIn_Status] FOREIGN KEY([status])
REFERENCES [dbo].[CheckInStatus] ([value])
GO
ALTER TABLE [dbo].[CheckIn] CHECK CONSTRAINT [FK_CheckIn_Status]
GO
ALTER TABLE [dbo].[Conversation]  WITH CHECK ADD  CONSTRAINT [FK_Conv_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Conversation] CHECK CONSTRAINT [FK_Conv_Member]
GO
ALTER TABLE [dbo].[Conversation]  WITH CHECK ADD  CONSTRAINT [FK_Conv_Trainer] FOREIGN KEY([trainerId])
REFERENCES [dbo].[Trainer] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Conversation] CHECK CONSTRAINT [FK_Conv_Trainer]
GO
ALTER TABLE [dbo].[FaceEmbedding]  WITH CHECK ADD  CONSTRAINT [FK_Face_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[FaceEmbedding] CHECK CONSTRAINT [FK_Face_Member]
GO
ALTER TABLE [dbo].[Invoice]  WITH CHECK ADD  CONSTRAINT [FK_Invoice_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[Invoice] CHECK CONSTRAINT [FK_Invoice_Member]
GO
ALTER TABLE [dbo].[Invoice]  WITH CHECK ADD  CONSTRAINT [FK_Invoice_Status] FOREIGN KEY([status])
REFERENCES [dbo].[InvoiceStatusTbl] ([value])
GO
ALTER TABLE [dbo].[Invoice] CHECK CONSTRAINT [FK_Invoice_Status]
GO
ALTER TABLE [dbo].[Invoice]  WITH CHECK ADD  CONSTRAINT [Invoice_membershipId_fkey] FOREIGN KEY([membershipId])
REFERENCES [dbo].[Membership] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Invoice] CHECK CONSTRAINT [Invoice_membershipId_fkey]
GO
ALTER TABLE [dbo].[Invoice]  WITH CHECK ADD  CONSTRAINT [Invoice_paymentId_fkey] FOREIGN KEY([paymentId])
REFERENCES [dbo].[Payment] ([id])
GO
ALTER TABLE [dbo].[Invoice] CHECK CONSTRAINT [Invoice_paymentId_fkey]
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
ALTER TABLE [dbo].[MealPlan]  WITH CHECK ADD  CONSTRAINT [MealPlan_memberId_fkey] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[MealPlan] CHECK CONSTRAINT [MealPlan_memberId_fkey]
GO
ALTER TABLE [dbo].[MealPlan]  WITH CHECK ADD  CONSTRAINT [MealPlan_trainerId_fkey] FOREIGN KEY([trainerId])
REFERENCES [dbo].[Trainer] ([id])
GO
ALTER TABLE [dbo].[MealPlan] CHECK CONSTRAINT [MealPlan_trainerId_fkey]
GO
ALTER TABLE [dbo].[Member]  WITH CHECK ADD  CONSTRAINT [FK_Member_Branch] FOREIGN KEY([branchId])
REFERENCES [dbo].[Branch] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Member] CHECK CONSTRAINT [FK_Member_Branch]
GO
ALTER TABLE [dbo].[Member]  WITH CHECK ADD  CONSTRAINT [FK_Member_Gender] FOREIGN KEY([gender])
REFERENCES [dbo].[Gender] ([value])
GO
ALTER TABLE [dbo].[Member] CHECK CONSTRAINT [FK_Member_Gender]
GO
ALTER TABLE [dbo].[Member]  WITH CHECK ADD  CONSTRAINT [FK_Member_Status] FOREIGN KEY([status])
REFERENCES [dbo].[MemberStatusTbl] ([value])
GO
ALTER TABLE [dbo].[Member] CHECK CONSTRAINT [FK_Member_Status]
GO
ALTER TABLE [dbo].[Member]  WITH CHECK ADD  CONSTRAINT [FK_Member_User] FOREIGN KEY([userId])
REFERENCES [dbo].[User] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Member] CHECK CONSTRAINT [FK_Member_User]
GO
ALTER TABLE [dbo].[Membership]  WITH CHECK ADD  CONSTRAINT [FK_Membership_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[Membership] CHECK CONSTRAINT [FK_Membership_Member]
GO
ALTER TABLE [dbo].[Membership]  WITH CHECK ADD  CONSTRAINT [FK_Membership_Status] FOREIGN KEY([status])
REFERENCES [dbo].[MembershipStatusTbl] ([value])
GO
ALTER TABLE [dbo].[Membership] CHECK CONSTRAINT [FK_Membership_Status]
GO
ALTER TABLE [dbo].[Membership]  WITH CHECK ADD  CONSTRAINT [FK_Membership_Type] FOREIGN KEY([packageType])
REFERENCES [dbo].[PackageType] ([value])
GO
ALTER TABLE [dbo].[Membership] CHECK CONSTRAINT [FK_Membership_Type]
GO
ALTER TABLE [dbo].[Membership]  WITH CHECK ADD  CONSTRAINT [Membership_packageId_fkey] FOREIGN KEY([packageId])
REFERENCES [dbo].[MembershipPackage] ([id])
GO
ALTER TABLE [dbo].[Membership] CHECK CONSTRAINT [Membership_packageId_fkey]
GO
ALTER TABLE [dbo].[Message]  WITH CHECK ADD  CONSTRAINT [FK_Message_Conv] FOREIGN KEY([conversationId])
REFERENCES [dbo].[Conversation] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Message] CHECK CONSTRAINT [FK_Message_Conv]
GO
ALTER TABLE [dbo].[Message]  WITH CHECK ADD  CONSTRAINT [FK_Message_Receiver] FOREIGN KEY([receiverId])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[Message] CHECK CONSTRAINT [FK_Message_Receiver]
GO
ALTER TABLE [dbo].[Message]  WITH CHECK ADD  CONSTRAINT [FK_Message_Sender] FOREIGN KEY([senderId])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[Message] CHECK CONSTRAINT [FK_Message_Sender]
GO
ALTER TABLE [dbo].[Message]  WITH CHECK ADD  CONSTRAINT [Message_mealPlanId_fkey] FOREIGN KEY([mealPlanId])
REFERENCES [dbo].[MealPlan] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Message] CHECK CONSTRAINT [Message_mealPlanId_fkey]
GO
ALTER TABLE [dbo].[MessageAttachment]  WITH CHECK ADD  CONSTRAINT [MessageAttachment_messageId_fkey] FOREIGN KEY([messageId])
REFERENCES [dbo].[Message] ([id])
GO
ALTER TABLE [dbo].[MessageAttachment] CHECK CONSTRAINT [MessageAttachment_messageId_fkey]
GO
ALTER TABLE [dbo].[Notification]  WITH CHECK ADD  CONSTRAINT [FK_Notification_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[Notification] CHECK CONSTRAINT [FK_Notification_Member]
GO
ALTER TABLE [dbo].[Notification]  WITH CHECK ADD  CONSTRAINT [Notification_userId_fkey] FOREIGN KEY([userId])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[Notification] CHECK CONSTRAINT [Notification_userId_fkey]
GO
ALTER TABLE [dbo].[Payment]  WITH CHECK ADD  CONSTRAINT [FK_Payment_Confirm] FOREIGN KEY([confirmedById])
REFERENCES [dbo].[User] ([id])
GO
ALTER TABLE [dbo].[Payment] CHECK CONSTRAINT [FK_Payment_Confirm]
GO
ALTER TABLE [dbo].[Payment]  WITH CHECK ADD  CONSTRAINT [FK_Payment_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[Payment] CHECK CONSTRAINT [FK_Payment_Member]
GO
ALTER TABLE [dbo].[Payment]  WITH CHECK ADD  CONSTRAINT [FK_Payment_Method] FOREIGN KEY([method])
REFERENCES [dbo].[PaymentMethodTbl] ([value])
GO
ALTER TABLE [dbo].[Payment] CHECK CONSTRAINT [FK_Payment_Method]
GO
ALTER TABLE [dbo].[Payment]  WITH CHECK ADD  CONSTRAINT [FK_Payment_Status] FOREIGN KEY([status])
REFERENCES [dbo].[PaymentStatusTbl] ([value])
GO
ALTER TABLE [dbo].[Payment] CHECK CONSTRAINT [FK_Payment_Status]
GO
ALTER TABLE [dbo].[Payment]  WITH CHECK ADD  CONSTRAINT [Payment_membershipId_fkey] FOREIGN KEY([membershipId])
REFERENCES [dbo].[Membership] ([id])
GO
ALTER TABLE [dbo].[Payment] CHECK CONSTRAINT [Payment_membershipId_fkey]
GO
ALTER TABLE [dbo].[Payment]  WITH CHECK ADD  CONSTRAINT [Payment_promotionId_fkey] FOREIGN KEY([promotionId])
REFERENCES [dbo].[Promotion] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Payment] CHECK CONSTRAINT [Payment_promotionId_fkey]
GO
ALTER TABLE [dbo].[Promotion]  WITH CHECK ADD  CONSTRAINT [FK_Promotion_Branch] FOREIGN KEY([branchId])
REFERENCES [dbo].[Branch] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Promotion] CHECK CONSTRAINT [FK_Promotion_Branch]
GO
ALTER TABLE [dbo].[Promotion]  WITH CHECK ADD  CONSTRAINT [FK_Promotion_DiscountType] FOREIGN KEY([discountType])
REFERENCES [dbo].[DiscountType] ([value])
GO
ALTER TABLE [dbo].[Promotion] CHECK CONSTRAINT [FK_Promotion_DiscountType]
GO
ALTER TABLE [dbo].[Room]  WITH CHECK ADD  CONSTRAINT [FK_Room_Status] FOREIGN KEY([status])
REFERENCES [dbo].[RoomStatus] ([value])
GO
ALTER TABLE [dbo].[Room] CHECK CONSTRAINT [FK_Room_Status]
GO
ALTER TABLE [dbo].[Room]  WITH CHECK ADD  CONSTRAINT [FK_Room_Type] FOREIGN KEY([type])
REFERENCES [dbo].[RoomType] ([value])
GO
ALTER TABLE [dbo].[Room] CHECK CONSTRAINT [FK_Room_Type]
GO
ALTER TABLE [dbo].[Trainer]  WITH CHECK ADD  CONSTRAINT [FK_Trainer_Status] FOREIGN KEY([status])
REFERENCES [dbo].[TrainerStatus] ([value])
GO
ALTER TABLE [dbo].[Trainer] CHECK CONSTRAINT [FK_Trainer_Status]
GO
ALTER TABLE [dbo].[Trainer]  WITH CHECK ADD  CONSTRAINT [FK_Trainer_User] FOREIGN KEY([userId])
REFERENCES [dbo].[User] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Trainer] CHECK CONSTRAINT [FK_Trainer_User]
GO
ALTER TABLE [dbo].[TrainerMember]  WITH CHECK ADD  CONSTRAINT [FK_TM_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TrainerMember] CHECK CONSTRAINT [FK_TM_Member]
GO
ALTER TABLE [dbo].[TrainerMember]  WITH CHECK ADD  CONSTRAINT [FK_TM_Status] FOREIGN KEY([status])
REFERENCES [dbo].[TrainerMemberStatus] ([value])
GO
ALTER TABLE [dbo].[TrainerMember] CHECK CONSTRAINT [FK_TM_Status]
GO
ALTER TABLE [dbo].[TrainerMember]  WITH CHECK ADD  CONSTRAINT [FK_TM_Trainer] FOREIGN KEY([trainerId])
REFERENCES [dbo].[Trainer] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TrainerMember] CHECK CONSTRAINT [FK_TM_Trainer]
GO
ALTER TABLE [dbo].[TrainingProgress]  WITH CHECK ADD  CONSTRAINT [FK_Progress_Member] FOREIGN KEY([memberId])
REFERENCES [dbo].[Member] ([id])
GO
ALTER TABLE [dbo].[TrainingProgress] CHECK CONSTRAINT [FK_Progress_Member]
GO
ALTER TABLE [dbo].[TrainingProgress]  WITH CHECK ADD  CONSTRAINT [FK_Progress_SessionType] FOREIGN KEY([sessionType])
REFERENCES [dbo].[SessionType] ([value])
GO
ALTER TABLE [dbo].[TrainingProgress] CHECK CONSTRAINT [FK_Progress_SessionType]
GO
ALTER TABLE [dbo].[TrainingProgress]  WITH CHECK ADD  CONSTRAINT [FK_Progress_Trainer] FOREIGN KEY([trainerId])
REFERENCES [dbo].[Trainer] ([id])
GO
ALTER TABLE [dbo].[TrainingProgress] CHECK CONSTRAINT [FK_Progress_Trainer]
GO
ALTER TABLE [dbo].[TrainingProgress]  WITH CHECK ADD  CONSTRAINT [TrainingProgress_sessionId_fkey] FOREIGN KEY([sessionId])
REFERENCES [dbo].[TrainingSchedule] ([id])
GO
ALTER TABLE [dbo].[TrainingProgress] CHECK CONSTRAINT [TrainingProgress_sessionId_fkey]
GO
ALTER TABLE [dbo].[TrainingSchedule]  WITH CHECK ADD  CONSTRAINT [FK_Schedule_Room] FOREIGN KEY([roomId])
REFERENCES [dbo].[Room] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[TrainingSchedule] CHECK CONSTRAINT [FK_Schedule_Room]
GO
ALTER TABLE [dbo].[TrainingSchedule]  WITH CHECK ADD  CONSTRAINT [FK_Schedule_SessionType] FOREIGN KEY([sessionType])
REFERENCES [dbo].[SessionType] ([value])
GO
ALTER TABLE [dbo].[TrainingSchedule] CHECK CONSTRAINT [FK_Schedule_SessionType]
GO
ALTER TABLE [dbo].[TrainingSchedule]  WITH CHECK ADD  CONSTRAINT [FK_Schedule_Status] FOREIGN KEY([status])
REFERENCES [dbo].[ScheduleStatus] ([value])
GO
ALTER TABLE [dbo].[TrainingSchedule] CHECK CONSTRAINT [FK_Schedule_Status]
GO
ALTER TABLE [dbo].[TrainingSchedule]  WITH CHECK ADD  CONSTRAINT [FK_Schedule_Trainer] FOREIGN KEY([trainerId])
REFERENCES [dbo].[Trainer] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[TrainingSchedule] CHECK CONSTRAINT [FK_Schedule_Trainer]
GO
ALTER TABLE [dbo].[User]  WITH CHECK ADD  CONSTRAINT [FK_User_Role] FOREIGN KEY([role])
REFERENCES [dbo].[UserRole] ([value])
GO
ALTER TABLE [dbo].[User] CHECK CONSTRAINT [FK_User_Role]
GO
ALTER TABLE [dbo].[User]  WITH CHECK ADD  CONSTRAINT [FK_User_Status] FOREIGN KEY([status])
REFERENCES [dbo].[UserStatus] ([value])
GO
ALTER TABLE [dbo].[User] CHECK CONSTRAINT [FK_User_Status]
GO
