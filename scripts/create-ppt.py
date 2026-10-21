#!/usr/bin/env python3
"""Generate PPT from PROMPT_THUYETTRINH.md"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION
import os

# Theme colors
INK = RGBColor(0x0B, 0x0D, 0x0F)
NEON = RGBColor(0xB7, 0xFF, 0x00)
CHALK = RGBColor(0xF2, 0xF4, 0xF0)
SURFACE = RGBColor(0x15, 0x16, 0x1A)
LINE_COLOR = RGBColor(0x2A, 0x2D, 0x30)

# Image paths relative to workspace root
IMAGES = {
    'hero': 'frontend/public/images/hero.jpg',
    'gym': 'frontend/public/images/gym-wide.jpg',
    'cta': 'frontend/public/images/cta.jpg',
    'bw': 'frontend/public/images/bw-training.jpg',
}

def add_textbox(slide, left, top, width, height, text, font_size=14, bold=False, color=CHALK, align=PP_ALIGN.LEFT):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = 'Calibri'  # fallback; Barlow/Be Vietnam not guaranteed
    p.alignment = align
    return txBox

def set_bg(slide, color=INK):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_neon_bar(slide, left=0.4, top=0.3, width=3.5, height=0.02):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(left), Inches(top), Inches(width), Inches(height)
    )
    shape.fill.solid(); shape.fill.fore_color.rgb = NEON
    shape.line.fill.background()
    return shape

def add_image_bg(slide, img_path, left=0, top=0, width=10, height=5.625):
    try:
        slide.shapes.add_picture(img_path, Inches(left), Inches(top), Inches(width), Inches(height))
    except Exception:
        pass

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Helper: build slides from prompt content
slides_data = [
    ("TIÊU ĐỀ — GYM SHARK", [
        "Hệ thống quản lý phòng tập gym full-stack",
        "Next.js 14 + TypeScript + Tailwind v3  |  NestJS + TypeORM + PostgreSQL 17",
        "Chat realtime Socket.IO • FACE_ID (1024-dim) • Meal-plan builder • Audit 34 action",
        "Đồ án tốt nghiệp — ĐH Lạc Hồng  |  2026-10-21"
    ], 'hero'),
    ("BỐI CẢNH & VẤN ĐỀ", [
        "Quản lý phòng gym thủ công → thất thoát hội viên, khó theo dõi check-in",
        "HLV cần công cụ thực đơn dinh dưỡng, chat trực tiếp với hội viên",
        "Ban quản lý cần báo cáo chuyên cần, thanh toán, khuyến mãi, audit đầy đủ",
        "Mục tiêu: full-stack tích hợp từ hội viên → HLV → lễ tân → admin"
    ], None),
    ("CÔNG NGHỆ & KIẾN TRÚC", [
        "FE: Next.js 14 (App Router) + TypeScript + Tailwind CSS v3 + lucide-react",
        "BE: NestJS (36/36 smoke PASS) + TypeORM (28 entities, DB_SYNCHRONIZE=true)",
        "DB: PostgreSQL 17 native (service Running, port 5432, DB gym_db)",
        "Realtime: Socket.IO JWT-auth (join user:<id>, typing, message:new, conversation:updated)",
        "AI/FACE: @vladmandic/human (client-side), vector 1024, consent NĐ13/2023, anti-spoof real<0.3"
    ], None),
    ("CẤU TRÚC DỰ ÁN", [
        "Frontend: app/(public) + (member) + (admin) + (trainer) + components/chat/chat-client.tsx (dùng chung)",
        "Backend modules: auth, members, memberships, payments, invoices, checkins, schedules, trainers, foods, meal-plans, chat, faces, audit-logs, notifications, promotions, reports",
        "Schema: Conversation + Message + MessageAttachment + Food + MealPlan + Meal + MealItem + FaceEmbedding (1024-dim vector Float[], consentAt, imageData data URL) + CheckIn (CARD/QR/BIOMETRIC/PHONE/FACE_ID)",
        "SP: 185 stored-procedures (Phase 2 SQL Server migration) — revert PostgreSQL cho ổn định"
    ], None),
    ("CHAT REALTIME (HLV ↔ HỘI VIÊN)", [
        "Socket.IO JWT-auth: event message:new, conversation:updated, messages:read",
        "Component dùng chung: src/components/chat/chat-client.tsx",
        "Phân quyền: chỉ TrainerMember ACTIVE mới chat (backend enforce)",
        "Lưu trữ: Conversation + Message + MessageAttachment (base64 data URL) — ảnh tối, tương phản mạnh"
    ], 'bw'),
    ("THỰC ĐƠN & THƯ VIỆN THỰC PHẨM", [
        "Thư viện: Food (26 món seed) — CRUD /admin/foods",
        "Thực đơn: MealPlan + Meal (BREAKFAST/LUNCH/DINNER/SNACK) + MealItem",
        "Tính dinh dưỡng: tổng calo / P / C / F (100g) — snapshot khi lưu + gửi qua chat",
        "Builder: /trainer/meal-plans/builder — thêm bữa → chọn món từ thư viện → tính tổng → Lưu nháp / Gửi hội viên (kèm chat)"
    ], None),
    ("CHECK-IN / CHECK-OUT + FACE_ID", [
        "Schema CheckIn: method enum CARD/QR/BIOMETRIC/PHONE/FACE_ID",
        "FaceEmbedding: vector Float[] 1024-dim (@vladmandic/human CDN model), consentAt (NĐ13/2023), anti-spoof (real<0.3 chặn mẫu)",
        "Lễ tân 1:N scan: /admin/checkins — POST /checkins/face-scan (threshold 0.7) → 404 → lễ tân đối chiếu ảnh thủ công",
        "Member check-in: /member/checkin — đăng ký /member/face-registration → FACE_ID"
    ], 'cta'),
    ("PROMOTION + NOTIFICATION + REPORTING", [
        "Promotion: validate tự tính subtotal-discount-total / usage đếm qua Payment / stats / auto-expire",
        "Notification: bell 3 phía — /admin/notifications, /announce (SPECIFIC_BRANCH + role), ticker 6h (NotificationTickerService)",
        "Reports: /admin/reports — 8 tab + CSV export BOM + KPI chuyên cần (/admin/reports/attendance), doanh thu, thành viên",
        "AuditLog: @Global(), log() không bao giờ throw — 34 action / 12 entity — /admin/audit-logs (gate ADMIN/MANAGER)"
    ], None),
    ("TRẠNG THÁI MÔI TRƯỜNG (HIỆN TẠI)", [
        "DB: PostgreSQL 17 native (postgres/postgrespassword, port 5432, DB gym_db) — revert từ SQL Server 2022 (50862) cho ổn định",
        ".env: DATABASE_URL postgresql://postgres:postgrespassword@localhost:5432/gym_db?schema=public",
        "prisma/schema.prisma: provider = postgresql (revert từ sqlserver)",
        "TypeORM: type = 'postgres' (revert từ 'mssql'), entities đã sửa datetime2→timestamp, nvarchar→varchar, bit→boolean, SYSUTCDATETIME→CURRENT_TIMESTAMP",
        "BE: localhost:3001/api — database: connected — TypeORM synchronize tạo bảng từ entities",
        "FE: localhost:3000 — typecheck/lint/format/build PASS — QA responsive 294/294 PASS (6 viewport × 49 route)"
    ], None),
    ("DEMO / VIDEO / QR", [
        "Link demo live: http://localhost:3000/login (trainer@gym.com / Trainer@123456 — member@gym.com / Member@123456)",
        "Swagger BE docs: http://localhost:3001/api/docs",
        "Nguồn ảnh: frontend/public/images/ (hero.jpg, gym-wide.jpg, pullup.jpg, program-*.jpg, cta.jpg, bw-training.jpg) — bắt buộc tông tối, tương phản mạnh, alt tiếng Việt",
        "Hướng phát triển tiếp: AI nhận diện món từ ảnh (FoodRecognitionProvider stub — kiến trúc mở), tích hợp thanh toán MOMO/VNPAY thật, nâng cấp Next.js 15/16, 6 PR Dependabot chờ duyệt"
    ], 'hero'),
    ("CHECKLIST / KIỂM TRA (AGENTS.md)", [
        "✓ typecheck + lint + format:check PASS",
        "✓ npm run build (FE 49 routes + BE nest build) PASS",
        "✓ GET /api/health → database: 'connected'",
        "✓ FE /login 200 OK, BE /api/docs hoạt động",
        "✓ Browser QA: 0 console error, 0 overflow 768px, 0 HTTP ≥400 (bỏ qua ERR_ABORTED + host ngoài)",
        "✓ Git message: Conventional Commits (feat(frontend): ..., fix(admin): ..., docs: ...)",
        "✓ Không commit: .env, .next/, dist/, node_modules/, screenshot tạm"
    ], None),
    ("KẾT LUẬN & HƯỚNG TIẾP", [
        "Dự án GymShark đã hoàn thành đầy đủ các kỳ: Check-in (Kỳ 4–10), Membership + Check-in (Kỳ 4), Trainer + Schedule (STEP 5), Payment + Invoice (STEP 6), Promotion + Notification (STEP 8), AuditLog + Security + Reports (STEP 9–10), Chat realtime + Meal-plan + Food library (Giai đoạn 1–2), Check-in nhận diện khuôn mặt FACE_ID (Kỳ 11), Three.js + Framer Motion (Kỳ 13)",
        "DB: PostgreSQL 17 native ổn định (revert từ SQL Server 2022 Phase 2 — 185 SP, adapter 20 module); TypeORM entities đã sửa cho PostgreSQL",
        "Hạn chế còn lại: AI nhận diện món từ ảnh (stub), thanh toán thật (stub MOMO/VNPAY), 5 PR Dependabot chờ duyệt",
        "Cảm ơn!"
    ], 'cta'),
]

for idx, (title, bullets, cover) in enumerate(slides_data, 1):
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
    set_bg(slide, INK)
    # Title bar (neon bar + title)
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(0.35), Inches(0.08), Inches(0.6))
    bar.fill.solid(); bar.fill.fore_color.rgb = NEON; bar.line.fill.background()
    # Title
    add_textbox(slide, 0.8, 0.3, 12, 0.8, title, font_size=28, bold=True, color=NEON, align=PP_ALIGN.LEFT)
    add_neon_bar(slide, 0.4, 1.0, 4.5, 0.02)
    # Subtitle / number
    add_textbox(slide, 11.5, 0.3, 1.5, 0.4, f"SLIDE {idx:02d}", font_size=10, bold=False, color=CHALK, align=PP_ALIGN.RIGHT)
    # Content box (surface)
    content_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.3), Inches(12.3), Inches(5.6))
    content_box.fill.solid(); content_box.fill.fore_color.rgb = SURFACE
    content_box.line.color.rgb = LINE_COLOR; content_box.line.width = Pt(0.5)
    # Content text
    content_text = "\n".join([f"• {b}" for b in bullets])
    add_textbox(slide, 0.8, 1.6, 11.8, 5.0, content_text, font_size=13, bold=False, color=CHALK, align=PP_ALIGN.LEFT)
    # Cover image (optional)
    if cover:
        try:
            img_path = IMAGES.get(cover, IMAGES['hero'])
            # Check exists
            if os.path.exists(img_path):
                # Place small image on right side next to content, or as full slide background behind dark layer
                # Here: right-side thumbnail with slight transparency overlay
                slide.shapes.add_picture(img_path, Inches(11.5), Inches(4.4), Inches(1.6), Inches(2.0))
        except Exception:
            pass

# Last slide footer
last_slide = prs.slides[-1]
add_textbox(last_slide, 0.5, 7.0, 12.3, 0.4,
            "GymShark — Đồ Án Tốt Nghiệp ĐH Lạc Hồng | Được tạo từ docs/PROMPT_THUYETTRINH.md | 2026-10-21",
            font_size=9, bold=False, color=LINE_COLOR, align=PP_ALIGN.CENTER)

output_path = 'docs/ThuyetTrinh_GymShark.pptx'
prs.save(output_path)
print("Saved:", output_path, "slides:", len(prs.slides))
