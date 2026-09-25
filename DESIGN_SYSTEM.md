# DESIGN SYSTEM — Dark Cinematic + Neon Fitness

Toàn bộ website GymMaster dùng **một** design system. Tài liệu này là nguồn sự thật duy nhất khi sửa/Thêm giao diện.

## 1. Color palette (exact)

| Token | Hex | Dùng cho |
|---|---|---|
| `ink` | `#0B0D0F` | Background toàn site |
| `surface` | `#15191D` | Card / panel / secondary background |
| `neon` | `#B7FF00` | Accent (CTA, active, số liệu quan trọng, icon nhấn) |
| `neon-hover` | `#D0FF4D` | Hover của CTA |
| `chalk` | `#F5F5F5` | Text chính |
| `muted` | `#9AA0A6` | Text phụ / metadata |
| `line` | `#272C31` | Border / divider |
| `danger` | `#FF4545` | Error / destructive |

**Tỷ lệ màu:** ~70% ink · 20% surface · 8% chalk/muted · **2% neon**.

Neon CHỈ dùng cho: CTA button, nav active, progress, số liệu quan trọng, icon nhấn, label nhỏ, hover highlight. **Không bao giờ** làm background lớn, không gradient neon tràn lan, không glow loè loẹt.

Site là **dark-only** (đã khóa). KHÔNG viết `dark:` variant nữa — dùng class trực tiếp. KHÔNG dùng `bg-white`, `bg-slate-*`, `text-slate-*`, `emerald`, `teal` — tất cả đã lỗi thời.

## 2. Typography (max 2 font families)

- **Display (H1–H3, số liệu):** `font-display` = Barlow Condensed — bold/extrabold, thường UPPERCASE, `tracking-tight`.
- **Body:** `font-sans` = Be Vietnam Pro (mặc định) — regular/medium/semibold.

Hierarchy:
- H1: `font-display text-[clamp(3rem,8vw,5.5rem)] font-extrabold uppercase leading-[0.95]`
- H2 section: dùng class `.section-title` (`font-display text-4xl sm:text-5xl font-bold uppercase`)
- H3: `font-display text-xl~2xl font-bold uppercase` (card) hoặc `font-bold` (trong app)
- Body: `text-sm/base text-muted leading-relaxed`, giới hạn `max-w-xl` cho đoạn dài
- Metadata: `text-xs text-muted`, label uppercase: class `.meta-label` hoặc `text-[11px] font-semibold uppercase tracking-[0.18em] text-neon/text-muted`

## 3. Utilities có sẵn (globals.css)

- `.container-x` → `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`
- `.section-title` → H2 section chuẩn
- `.meta-label` → label metadata nhỏ (muted); muốn trắng: thêm `!text-chalk`
- `.reveal` + component `<Reveal delay={ms}>` (client) → fade/slide khi cuộn vào viewport
- `animate-fade-in` / `animate-slide-up` / `animate-zoom-in`

## 4. Components (`@/components/ui/...`)

- `Button` — variants: `primary` (neon, text-ink), `secondary`/`outline` (border-line, hover neon), `ghost`, `danger`. **Primary = neon bắt buộc cho CTA chính.**
- `Card`, `CardTitle`, `CardDescription`, `CardContent` — mặc định `bg-surface border border-line rounded-2xl`
- `Badge` — `success` = neon, `destructive` = danger…
- `Input` / `Textarea` / `Select` / `Progress` / `Skeleton` / `Dialog` / `Toast` / `StatCard` (`colorScheme="neon"`)

## 5. Quy tắc layout & UI

1. **Radius:** button/input 10px (`rounded-[10px]`), card 16px (`rounded-2xl`), badge pill. Không trộn kiểu.
2. **Border mọi nơi dùng `border-line`**; hover nhấn `hover:border-neon/40` (mờ, có kiểm soát).
3. **Shadow:** subtle, ví dụ `shadow-[0_1px_2px_rgba(0,0,0,0.35)]`. Không glow mạnh.
4. **Section spacing:** `py-20 lg:py-24`, margin đầu section grid `mt-10~12`.
5. **Grid:** mobile 1 cột → `sm:grid-cols-2 lg:grid-cols-3`. Không overflow ngang (bọc trang bằng `overflow-x-hidden` nếu có phần tử vượt biên).
6. **Ảnh:** luôn có overlay tối (`bg-gradient-to-t from-ink/70`) khi có chữ đè lên; card ảnh `aspect-[16/10]` + `object-cover`; hover zoom `group-hover:scale-105` (transition 500ms).
7. **Motion:** chỉ transform/opacity, ≤500ms, tôn trọng `prefers-reduced-motion` (thường đã có sẵn trong CSS).
8. **Eyebrow:** tối đa 1 nhãn uppercase nhỏ mỗi 3 section. Trang detail thường chỉ có 1 eyebrow ở hero trang.
9. **Icons:** `lucide-react`, outline, kích thước 3.5–5 (`h-4 w-4` … `h-5 w-5`), accent bằng `text-neon` hoặc `text-muted`.
10. **Không emoji** trong UI text.

## 6. Mapping khi sửa code cũ

| Cũ (đừng dùng) | Mới |
|---|---|
| `bg-emerald-600 text-white` (button) | `bg-neon text-ink font-bold` hoặc `<Button>` |
| `text-emerald-600 dark:text-emerald-400` | `text-neon` |
| `bg-emerald-500/10 text-emerald-500` | `bg-neon/10 text-neon` |
| `border-emerald-500/40` | `border-neon/40` |
| `bg-white dark:bg-slate-900` | `bg-surface` |
| `border-slate-200 dark:border-slate-800` | `border-line` |
| `text-slate-900 dark:text-white` | `text-chalk` |
| `text-slate-500 dark:text-slate-400` | `text-muted` |
| `bg-slate-50 dark:bg-slate-950` (input) | `bg-ink` |
| `from-emerald-600 to-teal-400` (gradient card lớn) | `bg-surface border border-neon/30` + điểm nhấn neon (số/icon), **không gradient neon lớn** |
| `shadow-emerald-500/20` | bỏ glow hoặc `shadow-[0_0_24px_-12px_rgba(183,255,0,0.5)]` cho CTA |
| `text-rose-500/600` (error) | `text-danger` |
| `hover:bg-slate-100` | `hover:bg-ink` hoặc `hover:bg-line/40` |

## 7. Ảnh có sẵn (`/public/images`)

| File | Nội dung |
|---|---|
| `hero.jpg` | Battle rope trong garage tối (portrait) |
| `program-chest-triceps.jpg` · `program-back-biceps.jpg` · `program-shoulders.jpg` · `program-legs-abs.jpg` · `program-chest-shoulders.jpg` · `program-back-arms.jpg` | 6 ảnh tập luyện dark |
| `article.jpg` | Nữ vận động viên, ánh sáng tối |
| `cta.jpg` | Deadlift gần như đen tuyệt đối (nền chữ) |
| `gym-wide.jpg` | Hàng tạ đơn trong gym |
| `bw-training.jpg` | Trắng đen, gym tối |
| `pullup.jpg` | Trắng đen, tập xà |

Dùng `next/image` với `fill` + `object-cover` trong container có `aspect` sẵn, `sizes` hợp lý.

## 8. Reference implementations

Xem các file này để lấy chuẩn (KHÔNG sửa chúng khi đang làm trang khác):
- `src/app/(public)/page.tsx` + `src/components/home/*` — homepage
- `src/components/layout/public-header.tsx`, `public-footer.tsx`
- `src/app/globals.css`, `tailwind.config.ts`
