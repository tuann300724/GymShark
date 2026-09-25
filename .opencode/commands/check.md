---
description: Kiểm tra nhanh chất lượng frontend (typecheck + lint + format)
---

Kiểm tra chất lượng mã nguồn thư mục `frontend/` và báo cáo kết quả.

Yêu cầu bổ sung (nếu có): $ARGUMENTS

Thực hiện tuần tự, DỪNG ở bước đầu tiên FAIL:

1. `npm run typecheck` (tsc --noEmit)
2. `npm run lint`
3. `npm run format:check`

Quy tắc báo cáo:
- FAIL → nêu file:dòng + lỗi ngắn gọn, kèm đề xuất cách sửa (chưa tự sửa).
- PASS cả 3 → báo "3/3 PASS".
