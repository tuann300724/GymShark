---
description: Stage và commit thay đổi theo Conventional Commits
---

Commit các thay đổi hiện tại. Ghi chú thêm từ tôi: $ARGUMENTS

1. `git status --short` + `git diff --stat` để nắm toàn bộ thay đổi.
2. KHÔNG commit những thứ ngoài ý muốn: `.env`, file nằm trong `.gitignore`, chụp màn hình/tập tin tạm ở ngoài repo.
3. Chia thay đổi thành các commit hợp lý, message chuẩn **Conventional Commits** (type tiếng Anh + mô tả dễ hiểu), ví dụ: `feat(frontend): thêm trang blog`, `ci: thêm GitHub Actions`, `chore: cấu hình ESLint`.
4. `git add -A` rồi `git commit`.
5. **KHÔNG push** — hỏi tôi trước khi `git push`.
6. Báo lại: các commit vừa tạo (hash + message) và trạng thái `git status` còn lại.
