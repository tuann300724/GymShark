INSERT INTO Exercise (id, name, enName, [group], equipment, description, createdAt, updatedAt)
VALUES
 (NEWID(), N'Squat', N'Barbell Back Squat', N'Legs', N'Barbell + Rack', N'Bài nền chân: đẩy hông về sau, hạ đến đùi song song sàn.', GETDATE(), GETDATE()),
 (NEWID(), N'Deadlift', N'Romanian Deadlift', N'Legs', N'Barbell', N'Kéo tạ sàn: giữ lưng thẳng, đẩy sàn bằng chân và kéo hông về trước.', GETDATE(), GETDATE()),
 (NEWID(), N'Leg Press', N'Leg Press Machine', N'Legs', N'Máy Leg Press', N'Đẩy chân máy: giữ lưng áp ghế, đẩy bằng gót chân.', GETDATE(), GETDATE()),
 (NEWID(), N'Ép tạ nằm', N'Barbell Bench Press', N'Ngực', N'Barbell + Ghế phẳng', N'Ngực chính: hạ tạ chậm, đẩy nhanh không đu người.', GETDATE(), GETDATE()),
 (NEWID(), N'Ép tạ nghiêng', N'Incline Dumbbell Press', N'Ngực', N'Tạ đơn + Ghế nghiêng', N'Ngực trên: nghiêng 30°, hạ tạ chậm cảm nhận cơ.', GETDATE(), GETDATE()),
 (NEWID(), N'Kéo xà', N'Pull-up / Lat Pulldown', N'Lưng', N'Xà đơn / Máy kéo', N'Lưng rộng: kéo ngực chạm thanh, siết nách đỉnh 1 giây.', GETDATE(), GETDATE()),
 (NEWID(), N'Kéo tạ barbell', N'Barbell Row', N'Lưng', N'Barbell', N'Lưng giữa: hông đẩy sau, thanh trượt sát đùi.', GETDATE(), GETDATE()),
 (NEWID(), N'Ép vai qua đầu', N'Overhead Press', N'Vai', N'Barbell / Tạ đơn', N'Vai trước: siết mông, đẩy thanh thẳng qua mặt.', GETDATE(), GETDATE()),
 (NEWID(), N'Nép tạ sang bên', N'Lateral Raise', N'Vai', N'Tạ đơn', N'Vai giữa: nâng ngang vai, hạ chậm không đu thân.', GETDATE(), GETDATE()),
 (NEWID(), N'Gập tạ barbell', N'Barbell Curl', N'Tay trước', N'Barbell', N'Biceps: giữ khuỷu tay cố định, chỉ gập khớp khuỷu.', GETDATE(), GETDATE()),
 (NEWID(), N'Đẩy cáp xuống', N'Triceps Pushdown', N'Tay sau', N'Máy cáp', N'Triceps: ép khuỷu tay sát thân, chỉ khớp khuỷu chuyển động.', GETDATE(), GETDATE()),
 (NEWID(), N'Gập bụng treo', N'Hanging Leg Raise', N'Bụng', N'Thanh xà', N'Bụng dưới: cuộn xương cùng trước, nâng chân chậm.', GETDATE(), GETDATE()),
 (NEWID(), N'Plank', N'Forearm Plank', N'Bụng', N'Thảm / Sàn', N'Bụng tổng thể: giữ lưng thẳng, ép bụng, thở đều.', GETDATE(), GETDATE()),
 (NEWID(), N'Tập xà kép', N'Parallel Bar Dips', N'Tay sau', N'Xà kép', N'Tay sau + ngực dưới: người nghiêng nhẹ về trước khi xuống.', GETDATE(), GETDATE());
