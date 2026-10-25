\$file = 'backend/prisma/schema.prisma'
\$content = Get-Content \$file -Raw
\$content = \$content -replace '@default\((\w+)\)', '@default("`$1")'
\$content = \$content -replace '\s(\w+)\s+(UserRole|UserStatus|Gender|MemberStatus|TrainerStatus|PackageType|MembershipStatus|PaymentMethod|PaymentStatus|InvoiceStatus|CheckInStatus|CheckInMethod|ScheduleStatus|SessionType|TrainerMemberStatus|DiscountType|EquipmentStatus|EquipmentCondition|MaintenanceStatus|MaintenanceType|RoomType|ConversationStatus|MessageType|FoodCategory|MealPlanScope|MealPlanStatus|MealType)\b', ' `$1 String'
\$content = \$content -replace 'enum\s+\w+\s*\{[^}]*\}', ''
\$content = \$content -replace 'Json\?', 'String?'
\$content = \$content -replace 'Float\[\]', 'String?'
\$content = \$content -replace 'onDelete: Restrict', 'onDelete: NoAction'
Set-Content \$file \$content -Encoding UTF8
Write-Host "Schema updated: \$file"
